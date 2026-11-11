use crate::clock::Instant;
use crate::game::{Game, Move};
use std::time::Duration;
#[derive(Debug)]
pub struct SearchResult {
    pub action: Move,
    pub depth: u32,
    pub nodes: u64,
    pub elapsed: Duration,
}
/// Score from the farmers' perspective. Includes the C++ material/cow weights.
pub fn evaluate(g: &Game) -> i32 {
    let scale = (g.width + g.height) as i32;
    let players = g.count_players() as i32;
    let enemies = g.count_enemies() as i32;
    let held = g.count_held_cows();
    let value = held.min(g.rules.cow_sacrifice) * 6 + (held - g.rules.cow_sacrifice).max(0) * 3;
    (enemies - players) * 5 * scale - value * scale - g.cows_collected * 8 * scale
        + if enemies > 0 {
            g.enemyeval / enemies
        } else {
            0
        }
        - if players > 0 {
            g.playereval / players
        } else {
            0
        }
}
struct Context {
    deadline: Instant,
    nodes: u64,
    scorer: fn(&Game) -> i32,
}
impl Context {
    fn alpha_beta(
        &mut self,
        g: &Game,
        depth: u32,
        mut alpha: i32,
        mut beta: i32,
    ) -> Result<i32, ()> {
        self.nodes += 1;
        if Instant::now() >= self.deadline {
            return Err(());
        }
        match g.winner() {
            -1 => return Ok(1_000_000),
            1 => return Ok(-1_000_000),
            _ => {}
        }
        if depth == 0 {
            return Ok((self.scorer)(g));
        }
        let enemy = g.enemy_turn();
        let mut best = if enemy { i32::MIN } else { i32::MAX };
        let mut children: Vec<_> = g
            .legal_moves()
            .into_iter()
            .map(|m| {
                let mut c = g.clone();
                c.make_move(&m);
                ((self.scorer)(&c), c)
            })
            .collect();
        children.sort_by_key(|(sc, _)| if enemy { -sc } else { *sc });
        for (_, child) in children {
            let sc = self.alpha_beta(&child, depth - 1, alpha, beta)?;
            if enemy {
                best = best.max(sc);
                alpha = alpha.max(best);
            } else {
                best = best.min(sc);
                beta = beta.min(best);
            }
            if alpha >= beta {
                break;
            }
        }
        Ok(best)
    }
}
/// Counterpart of Search.h. Clones are independent; search never mutates the live game.
pub struct Search {
    pub game: Game,
    pub timeout: Duration,
    pub max_depth: u32,
    pub threads: usize,
    pub scorer: fn(&Game) -> i32,
}
impl Search {
    pub fn new(game: Game, timeout: Duration, max_depth: u32) -> Self {
        Self {
            game,
            timeout,
            max_depth,
            threads: 1,
            scorer: evaluate,
        }
    }
    pub fn begin_search(&self) -> SearchResult {
        let g = &self.game;
        let start = Instant::now();
        let deadline = start + self.timeout;
        let mut s = Context {
            deadline,
            nodes: 0,
            scorer: self.scorer,
        };
        let mut moves = g.legal_moves();
        let mut best = moves[0].clone();
        let mut completed = 0;
        for depth in 1..=self.max_depth {
            let mut scores = vec![];
            let mut finished = true;
            if self.threads <= 1 || cfg!(target_arch = "wasm32") {
                let mut alpha = -2_000_000;
                let mut beta = 2_000_000;
                for m in &moves {
                    let mut c = g.clone();
                    c.make_move(m);
                    match s.alpha_beta(&c, depth - 1, alpha, beta) {
                        Ok(sc) => {
                            scores.push((sc, m.clone()));
                            if g.enemy_turn() {
                                alpha = alpha.max(sc);
                            } else {
                                beta = beta.min(sc);
                            }
                        }
                        Err(()) => {
                            finished = false;
                            break;
                        }
                    }
                }
            } else {
                use std::sync::atomic::{AtomicI32, Ordering};
                // Search the principal move first, like the C++ first-child wrapper.
                let mut first = g.clone();
                first.make_move(&moves[0]);
                let first_score = match s.alpha_beta(&first, depth - 1, -2_000_000, 2_000_000) {
                    Ok(sc) => sc,
                    Err(()) => break,
                };
                let shared = AtomicI32::new(first_score);
                scores.push((first_score, moves[0].clone()));
                let workers = self.threads.clamp(1, 16).min(moves.len());
                let batches = std::thread::scope(|scope| {
                    let mut jobs = vec![];
                    for worker in 0..workers {
                        let moves = &moves;
                        let scorer = self.scorer;
                        let shared = &shared;
                        jobs.push(scope.spawn(move || {
                            let mut ctx = Context {
                                deadline,
                                nodes: 0,
                                scorer,
                            };
                            let mut results = vec![];
                            for i in (worker + 1..moves.len()).step_by(workers) {
                                let bound = shared.load(Ordering::Relaxed);
                                let (alpha, beta) = if g.enemy_turn() {
                                    (bound, 2_000_000)
                                } else {
                                    (-2_000_000, bound)
                                };
                                let mut c = g.clone();
                                c.make_move(&moves[i]);
                                let result = ctx.alpha_beta(&c, depth - 1, alpha, beta);
                                if let Ok(sc) = result {
                                    if g.enemy_turn() {
                                        shared.fetch_max(sc, Ordering::Relaxed);
                                    } else {
                                        shared.fetch_min(sc, Ordering::Relaxed);
                                    }
                                }
                                results.push((i, bound, result));
                            }
                            (ctx.nodes, results)
                        }));
                    }
                    jobs.into_iter()
                        .map(|h| h.join().expect("search worker panicked"))
                        .collect::<Vec<_>>()
                });
                let mut results = vec![];
                for (nodes, batch) in batches {
                    s.nodes += nodes;
                    results.extend(batch);
                }
                results.sort_by_key(|(i, _, _)| *i);
                let target = shared.load(Ordering::Relaxed);
                // Re-search earlier ambiguous ties with a full window. This preserves
                // move-order tie breaking independent of worker scheduling.
                let mut exact_best = if first_score == target { Some(0) } else { None };
                for &(i, bound, ref result) in &results {
                    if let Ok(sc) = *result {
                        let exact = if g.enemy_turn() {
                            sc > bound
                        } else {
                            sc < bound
                        };
                        if exact && sc == target {
                            exact_best = Some(exact_best.map_or(i, |j| j.min(i)));
                        }
                    }
                }
                for (i, bound, result) in results {
                    match result {
                        Ok(mut sc) => {
                            let exact = if g.enemy_turn() {
                                sc > bound
                            } else {
                                sc < bound
                            };
                            if !exact && sc == target && exact_best.is_some_and(|j| i < j) {
                                let mut c = g.clone();
                                c.make_move(&moves[i]);
                                match s.alpha_beta(&c, depth - 1, -2_000_000, 2_000_000) {
                                    Ok(value) => sc = value,
                                    Err(()) => {
                                        finished = false;
                                        break;
                                    }
                                }
                                if sc == target {
                                    exact_best = Some(i);
                                }
                            }
                            scores.push((sc, moves[i].clone()));
                        }
                        Err(()) => finished = false,
                    }
                }
            }

            if !finished {
                break;
            }
            scores.sort_by_key(|(sc, _)| if g.enemy_turn() { -sc } else { *sc });
            best = scores[0].1.clone();
            completed = depth;
            moves = scores.into_iter().map(|(_, m)| m).collect();
        }
        SearchResult {
            action: best,
            depth: completed,
            nodes: s.nodes,
            elapsed: start.elapsed(),
        }
    }
}
pub fn search(g: &Game, timeout: Duration, max_depth: u32) -> SearchResult {
    Search::new(g.clone(), timeout, max_depth).begin_search()
}

//! Original TestSearch.cpp corpus, with unchanged card/color answers and budgets.
use std::{fs, path::Path, time::Duration};
use udder_chaos::{
    game::{Game, Move, Piece, Rules},
    search::search,
};
fn fixture(name: &str) -> (Game, u64, u32, usize, u8) {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/search");
    let input = fs::read_to_string(dir.join("input").join(name)).unwrap();
    let mut it = input.split_whitespace();
    let mut next = || it.next().unwrap().parse::<usize>().unwrap();
    let (w, h, np, nc, nd) = (next(), next(), next(), next(), next());
    let board = (0..h)
        .map(|_| (0..w).map(|_| next() as u8).collect())
        .collect();
    let pieces = (0..np)
        .map(|_| Piece {
            x: next(),
            y: next(),
            kind: next() as u8,
            score: next() as i32,
        })
        .collect();
    // The old search file format used frontend directions; TestSearch.cpp inverted 1/3.
    let cards = (0..nc)
        .map(|_| (0..nd).map(|_| [0, 3, 2, 1][next()]).collect())
        .collect();
    let (timeout, depth) = (next() as u64, next() as u32);
    let mut g = Game::new(board, pieces, cards, Rules::default()).unwrap();
    g.turn = 2;
    g.player_id = 2;
    let answer = fs::read_to_string(dir.join("output").join(name)).unwrap();
    let mut it = answer
        .split_whitespace()
        .map(|s| s.parse::<usize>().unwrap());
    (
        g,
        timeout,
        depth,
        it.next().unwrap(),
        (it.next().unwrap() - 1) as u8,
    )
}
fn check(name: &str) {
    let (g, ms, depth, card, color) = fixture(name);
    let r = search(&g, Duration::from_millis(ms), depth);
    eprintln!(
        "{name}: {:?}, depth {}, {} nodes, {:?}",
        r.action, r.depth, r.nodes, r.elapsed
    );
    assert_eq!(r.action, Move::Play { card, color }, "{name}");
}
macro_rules! case {
    ($fn:ident,$file:literal) => {
        #[test]
        fn $fn() {
            check($file);
        }
    };
}
case!(win_in_one, "win-in-1-0.txt");
case!(kill_many_zero, "kill-many-0.txt");
case!(kill_many_one, "kill-many-1.txt");
case!(value, "value.txt");
case!(full_one, "full-1.txt");
case!(full_two, "full-2.txt");
case!(large_one, "large-1.txt");
case!(large_two, "large-2.txt");
case!(wait_one, "wait-1.txt");
case!(wait_two, "wait-2.txt");
#[test]
fn timeout_always_returns_legal_move() {
    let (g, _, _, _, _) = fixture("full-1.txt");
    let r = search(&g, Duration::ZERO, 100);
    assert!(g.legal_moves().contains(&r.action));
    assert_eq!(r.depth, 0);
}
#[test]
fn no_jet_fallback_is_legal() {
    let (mut g, _, _, _, _) = fixture("win-in-1-0.txt");
    for c in 0..4 {
        g.enemy.xs[c].clear();
        g.enemy.ys[c].clear();
        g.enemy.ss[c].clear();
        g.enemy.deads[c].clear();
        g.enemies[c].reset();
    }
    let r = search(&g, Duration::from_millis(10), 2);
    assert!(g.legal_moves().contains(&r.action));
}
#[test]
fn parallel_search_finds_same_tactical_move() {
    let (g, _, depth, card, color) = fixture("win-in-1-0.txt");
    let mut s = udder_chaos::search::Search::new(g, Duration::from_secs(1), depth);
    s.threads = 2;
    assert_eq!(s.begin_search().action, Move::Play { card, color });
}
#[test]
fn custom_scorer_and_search_leave_input_unchanged() {
    let (g, _, _, _, _) = fixture("full-1.txt");
    let before = g.clone();
    let mut s = udder_chaos::search::Search::new(g, Duration::from_millis(50), 2);
    s.scorer = |g| g.count_enemies() as i32 - g.count_players() as i32;
    let found = s.begin_search();
    assert!(before.legal_moves().contains(&found.action));
    assert_eq!(before, s.game);
}

#[test]
fn all_original_answers_with_two_workers() {
    for name in [
        "full-1.txt",
        "full-2.txt",
        "kill-many-0.txt",
        "kill-many-1.txt",
        "large-1.txt",
        "large-2.txt",
        "value.txt",
        "wait-1.txt",
        "wait-2.txt",
        "win-in-1-0.txt",
    ] {
        let (g, ms, depth, card, color) = fixture(name);
        let mut search = udder_chaos::search::Search::new(g, Duration::from_millis(ms), depth);
        search.threads = 2;
        let r = search.begin_search();
        eprintln!(
            "parallel {name}: {:?}, depth {}, {} nodes, {:?}",
            r.action, r.depth, r.nodes, r.elapsed
        );
        assert_eq!(r.action, Move::Play { card, color }, "parallel {name}");
    }
}

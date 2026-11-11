use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// C++ coordinates: 0=right, 1=increasing y, 2=left, 3=decreasing y.
/// Named Down/Up here to match the rendered board. Wire values are unchanged.
pub const DX: [i32; 4] = [1, 0, -1, 0];
pub const DY: [i32; 4] = [0, 1, 0, -1];
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Piece {
    pub x: usize,
    pub y: usize,
    pub kind: u8,
    pub score: i32,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Rules {
    pub hand_size: usize,
    pub cow_sacrifice: i32,
    pub cow_regen_rate: u32,
    pub days_per_round: u32,
    pub score_goal: i32,
}
impl Default for Rules {
    fn default() -> Self {
        Self {
            hand_size: 3,
            cow_sacrifice: 5,
            cow_regen_rate: 15,
            days_per_round: 5,
            score_goal: 10,
        }
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub enum Move {
    Play { card: usize, color: u8 },
    Rotate { card: usize, rotation: u8 },
    Buy { x: usize, y: usize },
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Deck {
    pub cards: Vec<Vec<u8>>,
    pub queue: Vec<usize>,
    pub player: Vec<usize>,
    pub enemy: Vec<usize>,
    pub cursor: usize,
}
impl Deck {
    pub fn new(cards: Vec<Vec<u8>>, hand: usize) -> Result<Self, String> {
        if hand == 0
            || hand > 8
            || cards.len() <= 2 * hand
            || cards.len() > 128
            || cards
                .iter()
                .any(|c| c.is_empty() || c.len() > 16 || c.iter().any(|&d| d > 3))
        {
            return Err("Invalid deck or hand size".into());
        }
        let q = cards.len() - 2 * hand;
        Ok(Self {
            cards,
            queue: (0..q).collect(),
            player: (q..q + hand).collect(),
            enemy: (q + hand..q + 2 * hand).collect(),
            cursor: 0,
        })
    }
    pub fn choose(&mut self, card: usize, enemy: bool) -> Vec<u8> {
        let hand = if enemy {
            &mut self.enemy
        } else {
            &mut self.player
        };
        let id = hand[card];
        std::mem::swap(&mut hand[card], &mut self.queue[self.cursor]);
        self.cursor = (self.cursor + 1) % self.queue.len();
        self.cards[id].clone()
    }
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct Respawn {
    pub x: usize,
    pub y: usize,
    pub turn: u32,
}
/// Presentation metadata only: winner() remains the C++ behavioral reference.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum EndReason {
    CowGoal,
    CrewDestroyed,
    SacrificeFailed,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct RoundEvent {
    pub turn: u32,
    pub required: i32,
    pub offered: i32,
    pub success: bool,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum StepEvent {
    CowAbducted {
        x: usize,
        y: usize,
        kind: u8,
    },
    CowDeposited {
        x: usize,
        y: usize,
        kind: u8,
        count: i32,
    },
    UfoPopped {
        x: usize,
        y: usize,
        kind: u8,
        farmer_kind: u8,
    },
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
pub struct GameView {
    pub board: Vec<Vec<u8>>,
    pub pieces: Vec<Piece>,
    pub deck: Deck,
    pub rules: Rules,
    pub turn: u32,
    pub player_id: u8,
    pub cows_collected: i32,
    pub failed_sacrifice: bool,
    pub respawns: Vec<Respawn>,
    pub winner: i8,
    pub end_reason: Option<EndReason>,
    pub round_event: Option<RoundEvent>,
    pub ships_destroyed: u32,
    #[serde(default)]
    pub events: Vec<StepEvent>,
}
/// Direct counterpart of Game::SOA: separate contiguous bytes for each coordinate.
#[derive(Clone, Debug, PartialEq, Eq, Default, Serialize)]
pub struct Soa {
    pub xs: [Vec<u8>; 4],
    pub ys: [Vec<u8>; 4],
    pub ss: [Vec<i32>; 4],
    pub deads: [Vec<u8>; 4],
}
impl Soa {
    fn push(&mut self, c: usize, x: u8, y: u8, score: i32) {
        self.xs[c].push(x);
        self.ys[c].push(y);
        self.ss[c].push(score);
        self.deads[c].push(0);
    }
    fn purge(&mut self, c: usize) {
        let mut w = 0;
        for i in 0..self.deads[c].len() {
            if self.deads[c][i] != 0 {
                continue;
            }
            self.xs[c][w] = self.xs[c][i];
            self.ys[c][w] = self.ys[c][i];
            self.ss[c][w] = self.ss[c][i];
            self.deads[c][w] = 0;
            w += 1;
        }
        self.xs[c].truncate(w);
        self.ys[c].truncate(w);
        self.ss[c].truncate(w);
        self.deads[c].truncate(w);
    }
}
use crate::bitset::Bitset;
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Game {
    pub width: usize,
    pub height: usize,
    pub rules: Rules,
    pub deck: Deck,
    pub turn: u32,
    pub player_id: u8,
    pub cows_collected: i32,
    pub failed_sacrifice: bool,
    pub ships_destroyed: u32,
    pub player: Soa,
    pub enemy: Soa,
    pub players: [Bitset; 4],
    pub enemies: [Bitset; 4],
    pub impassible: Bitset,
    pub cows: Bitset,
    pub score_tiles: Bitset,
    pub player_spawns: [Vec<(usize, usize)>; 4],
    pub enemy_spawns: [Vec<(usize, usize)>; 4],
    pub playereval: i32,
    pub enemyeval: i32,
    pub cow_respawn: Vec<Bitset>,
    pub enemyhm: Vec<i32>,
    pub playerhm: Vec<i32>,
}
impl Game {
    pub fn new(
        board: Vec<Vec<u8>>,
        pieces: Vec<Piece>,
        cards: Vec<Vec<u8>>,
        rules: Rules,
    ) -> Result<Self, String> {
        let width = board.first().map_or(0, Vec::len);
        let height = board.len();
        if width == 0
            || width > 255
            || height > 255
            || board
                .iter()
                .any(|r| r.len() != width || r.iter().any(|&t| t > 14))
        {
            return Err("Invalid board".into());
        }
        if rules.cow_regen_rate == 0
            || rules.cow_regen_rate > 10000
            || rules.days_per_round == 0
            || rules.days_per_round > 1000
            || rules.cow_sacrifice < 0
            || rules.score_goal < 1
        {
            return Err("Invalid rules".into());
        }
        if pieces
            .iter()
            .any(|p| p.x >= width || p.y >= height || !(1..=8).contains(&p.kind) || p.score < 0)
        {
            return Err("Invalid piece".into());
        }
        let deck = Deck::new(cards, rules.hand_size)?;
        let area = width * height;
        let mut g = Self {
            width,
            height,
            deck,
            turn: 0,
            player_id: 0,
            cows_collected: 0,
            failed_sacrifice: false,
            ships_destroyed: 0,
            player: Soa::default(),
            enemy: Soa::default(),
            players: std::array::from_fn(|_| Bitset::new(area)),
            enemies: std::array::from_fn(|_| Bitset::new(area)),
            impassible: Bitset::new(area),
            cows: Bitset::new(area),
            score_tiles: Bitset::new(area),
            player_spawns: std::array::from_fn(|_| vec![]),
            enemy_spawns: std::array::from_fn(|_| vec![]),
            playereval: 0,
            enemyeval: 0,
            cow_respawn: vec![Bitset::new(area); rules.cow_regen_rate as usize],
            enemyhm: vec![0; area],
            playerhm: vec![0; area],
            rules,
        };
        for p in &pieces {
            let c = ((p.kind - 1) % 4) as usize;
            if p.kind <= 4 {
                g.player.push(c, p.x as u8, p.y as u8, p.score);
                g.players[c].set(p.y * width + p.x, true);
            } else {
                g.enemy.push(c, p.x as u8, p.y as u8, p.score);
                g.enemies[c].set(p.y * width + p.x, true);
            }
        }
        for (y, row) in board.iter().enumerate() {
            for (x, &t) in row.iter().enumerate() {
                let i = y * width + x;
                match t {
                    1 => g.cows.set(i, true),
                    2 => g.impassible.set(i, true),
                    7..=10 => {
                        let c = (t - 7) as usize;
                        if g.player_spawns[c].is_empty() {
                            // One spawn per crew; every crew may deposit at any portal.
                            g.player_spawns[c].push((x, y));
                            g.score_tiles.set(i, true);
                        }
                    }
                    11..=14 => g.enemy_spawns[(t - 11) as usize].push((x, y)),
                    _ => {}
                }
            }
        }
        // Same fixed enemy heatmap as Game.cpp; player heatmap was disabled there.
        let mut queue = std::collections::VecDeque::new();
        let mut visited = vec![false; area];
        for p in pieces.iter().filter(|p| p.kind <= 4) {
            queue.push_back((p.x, p.y, 0));
            visited[p.y * width + p.x] = true;
        }
        while let Some((x, y, d)) = queue.pop_front() {
            g.enemyhm[y * width + x] = (width + height) as i32 - d;
            for dir in 0..4 {
                let nx = x as i32 + DX[dir];
                let ny = y as i32 + DY[dir];
                if nx < 0 || ny < 0 || nx >= width as i32 || ny >= height as i32 {
                    continue;
                }
                let i = ny as usize * width + nx as usize;
                if visited[i] || g.impassible.get(i) {
                    continue;
                }
                visited[i] = true;
                queue.push_back((nx as usize, ny as usize, d + 1));
            }
        }
        for c in 0..4 {
            for i in 0..g.enemy.xs[c].len() {
                g.playereval +=
                    g.enemyhm[g.enemy.ys[c][i] as usize * width + g.enemy.xs[c][i] as usize];
            }
        }
        Ok(g)
    }
    pub fn area(&self) -> usize {
        self.width * self.height
    }
    pub fn enemy_turn(&self) -> bool {
        self.turn % 3 == 2
    }
    pub fn count_players(&self) -> usize {
        self.player.xs.iter().map(Vec::len).sum()
    }
    pub fn count_enemies(&self) -> usize {
        self.enemy.xs.iter().map(Vec::len).sum()
    }
    pub fn count_held_cows(&self) -> i32 {
        self.player.ss.iter().flatten().sum()
    }
    pub fn winner(&self) -> i8 {
        if self.player.xs.iter().any(Vec::is_empty) {
            return -1;
        }
        if self.cows_collected >= self.rules.score_goal {
            return 1;
        }
        if self.turn > 0
            && self.turn.is_multiple_of(self.rules.days_per_round * 6)
            && self.failed_sacrifice
        {
            return -1;
        }
        0
    }
    pub fn end_reason(&self) -> Option<EndReason> {
        match self.winner() {
            -1 if self.player.xs.iter().any(Vec::is_empty) => Some(EndReason::CrewDestroyed),
            -1 => Some(EndReason::SacrificeFailed),
            1 => Some(EndReason::CowGoal),
            _ => None,
        }
    }
    pub fn legal_moves(&self) -> Vec<Move> {
        let mut out = vec![];
        for card in 0..self.rules.hand_size {
            if self.enemy_turn() {
                for color in 0..4 {
                    if !self.enemy.xs[color as usize].is_empty() {
                        out.push(Move::Play { card, color });
                    }
                }
            } else {
                out.push(Move::Play {
                    card,
                    color: self.player_id,
                });
                for rotation in 1..=3 {
                    out.push(Move::Rotate { card, rotation });
                }
            }
        }
        if !self.enemy_turn() && self.cows_collected > 0 {
            for &(x, y) in &self.player_spawns[self.player_id as usize] {
                let i = y * self.width + x;
                if self.players.iter().chain(&self.enemies).all(|b| !b.get(i)) {
                    out.push(Move::Buy { x, y });
                }
            }
        }
        if self.enemy_turn() && out.is_empty() {
            out.push(Move::Play { card: 0, color: 0 });
        }
        out
    }
    fn validate_move(&self, action: &Move) -> Result<(), String> {
        if self.winner() != 0 {
            return Err("The game has ended".into());
        }
        if !self.legal_moves().contains(action) {
            return Err("Illegal move".into());
        }
        Ok(())
    }
    pub fn apply(&mut self, action: &Move) -> Result<(), String> {
        self.validate_move(action)?;
        self.make_move(action);
        Ok(())
    }
    pub fn apply_with_frames(&mut self, action: &Move) -> Result<Vec<GameView>, String> {
        self.validate_move(action)?;
        let mut frames = vec![];
        self.make_move_recorded(action, Some(&mut frames));
        Ok(frames)
    }
    pub fn make_move(&mut self, action: &Move) {
        self.make_move_recorded(action, None);
    }
    fn make_move_recorded(&mut self, action: &Move, mut frames: Option<&mut Vec<GameView>>) {
        let bucket = self.turn as usize % self.cow_respawn.len();
        self.cows.union(&self.cow_respawn[bucket]);
        self.cow_respawn[bucket].reset();
        match *action {
            Move::Play { card, color } => {
                let enemy = self.enemy_turn();
                let moves = self.deck.choose(card, enemy);
                for d in moves {
                    // Presentation captures are allocated only when a client requests frames.
                    let cows_before = if frames.is_some() && !enemy {
                        Some(self.cows.clone())
                    } else {
                        None
                    };
                    let cargo_before = if frames.is_some() && !enemy {
                        self.player.ss[self.player_id as usize].clone()
                    } else {
                        vec![]
                    };
                    let ships_before = if frames.is_some() && enemy {
                        self.view_pieces()
                            .into_iter()
                            .filter(|p| p.kind <= 4)
                            .collect::<Vec<_>>()
                    } else {
                        vec![]
                    };
                    if enemy {
                        self.play_enemy_movement(d, color as usize);
                    } else {
                        self.play_player_movement(d);
                    }
                    if let Some(ref mut f) = frames {
                        let mut frame = self.view();
                        if let Some(cows) = cows_before {
                            let c = self.player_id as usize;
                            for (i, &before) in cargo_before.iter().enumerate() {
                                let x = self.player.xs[c][i] as usize;
                                let y = self.player.ys[c][i] as usize;
                                let picked_up = i32::from(
                                    cows.get(y * self.width + x)
                                        && !self.cows.get(y * self.width + x),
                                );
                                if picked_up > 0 {
                                    frame.events.push(StepEvent::CowAbducted {
                                        x,
                                        y,
                                        kind: self.player_id + 1,
                                    });
                                }
                                let deposited = before + picked_up - self.player.ss[c][i];
                                if deposited > 0 {
                                    frame.events.push(StepEvent::CowDeposited {
                                        x,
                                        y,
                                        kind: self.player_id + 1,
                                        count: deposited,
                                    });
                                }
                            }
                        }
                        for p in ships_before {
                            if self.enemies[color as usize].get(p.y * self.width + p.x) {
                                frame.events.push(StepEvent::UfoPopped {
                                    x: p.x,
                                    y: p.y,
                                    kind: p.kind,
                                    farmer_kind: color + 5,
                                });
                            }
                        }
                        f.push(frame);
                    }
                }
                if !enemy {
                    self.player_id = (self.player_id + 1) & 3;
                }
            }
            Move::Rotate { card, rotation } => {
                for d in &mut self.deck.cards[self.deck.player[card]] {
                    *d = (*d + rotation) & 3;
                }
                self.player_id = (self.player_id + 1) & 3;
            }
            Move::Buy { x, y } => {
                let c = self.player_id as usize;
                self.player.push(c, x as u8, y as u8, 0);
                self.players[c].set(y * self.width + x, true);
                self.cows_collected -= 1;
                self.player_id = (self.player_id + 1) & 3;
            }
        }
        self.turn += 1;
        if self.turn.is_multiple_of(self.rules.days_per_round * 6) {
            for c in 0..4 {
                for &(x, y) in &self.enemy_spawns[c] {
                    let i = y * self.width + x;
                    if self.enemies[c].get(i) {
                        continue;
                    }
                    self.enemies[c].set(i, true);
                    self.enemy.push(c, x as u8, y as u8, 0);
                }
            }
            self.failed_sacrifice = self.cows_collected < self.rules.cow_sacrifice;
            if !self.failed_sacrifice {
                self.cows_collected -= self.rules.cow_sacrifice;
            }
        }
        if let Some(f) = frames {
            f.push(self.view());
        }
    }
    /// Game.cpp play_movement: shift, correct obstacles, then resolve own collisions.
    pub fn play_movement(&mut self, d: u8, choice: usize, player: bool) {
        let area = self.area();
        let mut blocked = self.impassible.clone();
        let masks = if player { &self.players } else { &self.enemies };
        for (c, mask) in masks.iter().enumerate() {
            if c != choice {
                blocked.union(mask);
            }
        }
        let unit = if player {
            &mut self.player
        } else {
            &mut self.enemy
        };
        let oldx = unit.xs[choice].clone();
        let oldy = unit.ys[choice].clone();
        let pos = if d == 1 || d == 3 {
            &mut unit.ys[choice]
        } else {
            &mut unit.xs[choice]
        };
        crate::simd::step(
            pos,
            d < 2,
            if d == 1 || d == 3 {
                (self.height - 1) as u8
            } else {
                (self.width - 1) as u8
            },
        );
        let n = unit.xs[choice].len();
        let mut occupied = vec![0u16; area];
        for i in 0..n {
            let idx = unit.ys[choice][i] as usize * self.width + unit.xs[choice][i] as usize;
            if blocked.get(idx) {
                unit.xs[choice][i] = oldx[i];
                unit.ys[choice][i] = oldy[i];
            }
            occupied[unit.ys[choice][i] as usize * self.width + unit.xs[choice][i] as usize] += 1;
        }
        // Restore original coordinates, rather than subtracting past an edge as C++ could.
        loop {
            let mut changed = false;
            for i in 0..n {
                let idx = unit.ys[choice][i] as usize * self.width + unit.xs[choice][i] as usize;
                if occupied[idx] >= 2
                    && (unit.xs[choice][i] != oldx[i] || unit.ys[choice][i] != oldy[i])
                {
                    occupied[idx] -= 1;
                    unit.xs[choice][i] = oldx[i];
                    unit.ys[choice][i] = oldy[i];
                    occupied[oldy[i] as usize * self.width + oldx[i] as usize] += 1;
                    changed = true;
                }
            }
            if !changed {
                break;
            }
        }
    }
    pub fn play_player_movement(&mut self, d: u8) {
        let c = self.player_id as usize;
        self.play_movement(d, c, true);
        let mut mask = Bitset::new(self.area());
        for i in 0..self.player.xs[c].len() {
            let idx = self.player.ys[c][i] as usize * self.width + self.player.xs[c][i] as usize;
            self.player.ss[c][i] += i32::from(self.cows.get(idx));
            if self.score_tiles.get(idx) {
                self.cows_collected += self.player.ss[c][i];
                self.player.ss[c][i] = 0;
            }
            mask.set(idx, true);
        }
        for color in 0..4 {
            for i in 0..self.enemy.xs[color].len() {
                let idx = self.enemy.ys[color][i] as usize * self.width
                    + self.enemy.xs[color][i] as usize;
                self.enemy.deads[color][i] |= u8::from(mask.get(idx));
                if mask.get(idx) {
                    self.enemyeval -= self.enemyhm[idx];
                }
            }
            self.enemies[color].subtract(&mask);
            self.enemy.purge(color);
        }
        let bucket = self.turn as usize % self.cow_respawn.len();
        self.cow_respawn[bucket].union(&self.cows.intersection(&mask));
        self.players[c] = mask.clone();
        self.cows.subtract(&mask);
    }
    pub fn play_enemy_movement(&mut self, d: u8, c: usize) {
        let before = self.count_players();
        for i in 0..self.enemy.xs[c].len() {
            self.enemyeval -= self.enemyhm
                [self.enemy.ys[c][i] as usize * self.width + self.enemy.xs[c][i] as usize];
        }
        self.play_movement(d, c, false);
        let mut mask = Bitset::new(self.area());
        for i in 0..self.enemy.xs[c].len() {
            let idx = self.enemy.ys[c][i] as usize * self.width + self.enemy.xs[c][i] as usize;
            mask.set(idx, true);
            self.enemyeval += self.enemyhm[idx];
        }
        for color in 0..4 {
            for i in 0..self.player.xs[color].len() {
                let idx = self.player.ys[color][i] as usize * self.width
                    + self.player.xs[color][i] as usize;
                self.player.deads[color][i] |= u8::from(mask.get(idx));
            }
            self.players[color].subtract(&mask);
            self.player.purge(color);
        }
        self.enemies[c] = mask;
        self.ships_destroyed += (before - self.count_players()) as u32;
    }
    pub fn view_pieces(&self) -> Vec<Piece> {
        let mut out = vec![];
        for c in 0..4 {
            for (unit, base) in [(&self.player, 1), (&self.enemy, 5)] {
                for i in 0..unit.xs[c].len() {
                    out.push(Piece {
                        x: unit.xs[c][i] as usize,
                        y: unit.ys[c][i] as usize,
                        kind: c as u8 + base,
                        score: unit.ss[c][i],
                    });
                }
            }
        }
        out.sort_by_key(|p| (p.y, p.x, p.kind));
        out
    }
    pub fn view_board(&self) -> Vec<Vec<u8>> {
        let mut board = vec![vec![0; self.width]; self.height];
        for (y, row) in board.iter_mut().enumerate() {
            for (x, t) in row.iter_mut().enumerate() {
                let i = y * self.width + x;
                *t = if self.impassible.get(i) {
                    2
                } else if self.cows.get(i) {
                    1
                } else {
                    0
                };
            }
        }
        for c in 0..4 {
            for &(x, y) in &self.player_spawns[c] {
                board[y][x] = c as u8 + 7;
            }
            for &(x, y) in &self.enemy_spawns[c] {
                board[y][x] = c as u8 + 11;
            }
        }
        board
    }
    pub fn view(&self) -> GameView {
        let mut respawns = vec![];
        let rate = self.rules.cow_regen_rate;
        for (b, mask) in self.cow_respawn.iter().enumerate() {
            let delta = (b as u32 + rate - self.turn % rate) % rate;
            for y in 0..self.height {
                for x in 0..self.width {
                    if mask.get(y * self.width + x) {
                        respawns.push(Respawn {
                            x,
                            y,
                            turn: self.turn + delta,
                        });
                    }
                }
            }
        }
        GameView {
            board: self.view_board(),
            pieces: self.view_pieces(),
            deck: self.deck.clone(),
            rules: self.rules.clone(),
            turn: self.turn,
            player_id: self.player_id,
            cows_collected: self.cows_collected,
            failed_sacrifice: self.failed_sacrifice,
            respawns,
            winner: self.winner(),
            end_reason: self.end_reason(),
            ships_destroyed: self.ships_destroyed,
            events: vec![],
            round_event: if self.turn > 0 && self.turn.is_multiple_of(self.rules.days_per_round * 6)
            {
                Some(RoundEvent {
                    turn: self.turn,
                    required: self.rules.cow_sacrifice,
                    offered: if self.failed_sacrifice {
                        self.cows_collected
                    } else {
                        self.rules.cow_sacrifice
                    },
                    success: !self.failed_sacrifice,
                })
            } else {
                None
            },
        }
    }
}

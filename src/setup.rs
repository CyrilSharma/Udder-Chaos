use crate::{
    game::{Game, Piece},
    protocol::Settings,
};
pub(crate) fn validate(s: &Settings) -> Result<(), String> {
    if s.map_id >= maps().len()
        || s.card_deck_size <= s.rules.hand_size * 2
        || s.card_deck_size > 128
        || s.timer_length == 0
        || s.timer_length > 3600
        || s.difficulty == 0
        || s.difficulty > 3000
        || s.threads == 0
        || s.threads > 16
    {
        return Err("Invalid game settings".into());
    }
    Game::new(
        vec![vec![0]],
        vec![],
        vec![vec![0]; s.card_deck_size],
        s.rules.clone(),
    )
    .map(|_| ())
}
pub fn maps() -> Vec<Vec<Vec<u8>>> {
    include_str!("../assets/maps.txt")
        .trim()
        .split("\n\n")
        .map(|m| {
            m.lines()
                .map(|l| l.split_whitespace().map(|v| v.parse().unwrap()).collect())
                .collect()
        })
        .collect()
}
fn next_random(seed: &mut u32) -> u32 {
    *seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
    *seed
}
pub fn setup(s: &Settings) -> Result<Game, String> {
    validate(s)?;
    let board = maps()[s.map_id].clone();
    let mut pieces = vec![];
    for (y, row) in board.iter().enumerate() {
        for (x, &t) in row.iter().enumerate() {
            if t >= 7 {
                pieces.push(Piece {
                    x,
                    y,
                    kind: t - 6,
                    score: 0,
                });
            }
        }
    }
    let presets = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
        [0, 1, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
    ];
    let mut seed = s.seed;
    let mut cards: Vec<Vec<u8>> = (0..s.card_deck_size)
        .map(|i| {
            let rot = (next_random(&mut seed) % 4) as u8;
            presets[i % 7].iter().map(|d| (d + rot) % 4).collect()
        })
        .collect();
    for i in (1..cards.len()).rev() {
        let j = next_random(&mut seed) as usize % (i + 1);
        cards.swap(i, j);
    }
    Game::new(board, pieces, cards, s.rules.clone())
}

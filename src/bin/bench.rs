//! Focused equivalents of TestBitset.cpp and TestGamePerf.cpp.
use std::{hint::black_box, time::Instant};
use udder_chaos::{
    bitset::Bitset,
    game::{Game, Piece, Rules},
    simd,
};
fn main() {
    let args: Vec<_> = std::env::args().collect();
    let mode = args.get(1).map(String::as_str).unwrap_or("simd");
    let iterations: usize = args.get(2).map(|s| s.parse().unwrap()).unwrap_or(100000);
    println!(
        "mode={mode} iterations={iterations} arch={} release={} monitoring=elapsed-wall-clock",
        std::env::consts::ARCH,
        !cfg!(debug_assertions)
    );
    match mode {
        "simd" => {
            println!("kernel: 4096 u8 coordinates, bound=254, alternating +1/-1; same inputs for scalar and dispatch; no game rollout");
            for vector in [false, true] {
                let mut data: Vec<u8> = (0..4096).map(|i| (i % 255) as u8).collect();
                let start = Instant::now();
                for i in 0..iterations {
                    if vector {
                        simd::step(black_box(&mut data), i % 2 == 0, 254);
                    } else {
                        simd::scalar_step(black_box(&mut data), i % 2 == 0, 254);
                    }
                }
                println!(
                    "{}: {:?}; checksum={}",
                    if vector {
                        "SIMD dispatch"
                    } else {
                        "portable scalar"
                    },
                    start.elapsed(),
                    data.iter().map(|&v| v as u64).sum::<u64>()
                );
            }
        }
        "game" => {
            println!("board=16x16, 4 same-color UFOs at (0,0)..(3,3), seeded terrain, 16 cards of 3 directions; direct movement calls, C++ Rules::default, no episode reset");
            let board = (0..16)
                .map(|y| {
                    (0..16)
                        .map(|x| {
                            if x > 4 && ((x * 13 + y * 7) % 5 == 0) {
                                2
                            } else {
                                0
                            }
                        })
                        .collect()
                })
                .collect();
            let pieces = (0..4)
                .map(|i| Piece {
                    x: i,
                    y: i,
                    kind: 1,
                    score: 0,
                })
                .collect();
            let mut g =
                Game::new(board, pieces, vec![vec![0, 1, 2]; 16], Rules::default()).unwrap();
            let start = Instant::now();
            for i in 0..iterations {
                g.play_player_movement((i % 4) as u8);
                black_box(&g);
            }
            println!(
                "{:?}, {:.0} movements/s",
                start.elapsed(),
                iterations as f64 / start.elapsed().as_secs_f64()
            );
        }
        "bitset" => {
            println!("256 bits, deterministic updates, masked final block; Rust Vec<u64> replaces STL/Boost comparison");
            let mut b = Bitset::new(256);
            let start = Instant::now();
            for i in 0..iterations {
                b.set(i % 256, true);
                black_box(&b);
            }
            println!("{:?}; count={}", start.elapsed(), b.count());
        }
        _ => panic!("Usage: bench [simd|game|bitset] [iterations]"),
    }
}

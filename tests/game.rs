//! Deterministic Rust ports of every TestGame.cpp case and subcase.
use udder_chaos::game::{Deck, Game, Move, Piece, Rules};
fn p(y: usize, x: usize, kind: u8) -> Piece {
    Piece {
        x,
        y,
        kind,
        score: 0,
    }
}
fn game(board: Vec<Vec<u8>>, pieces: Vec<Piece>) -> Game {
    Game::new(
        board,
        pieces,
        (0..16)
            .map(|i| vec![(i % 4) as u8, ((i + 1) % 4) as u8, ((i + 2) % 4) as u8])
            .collect(),
        Rules::default(),
    )
    .unwrap()
}
fn blank(pieces: Vec<Piece>) -> Game {
    game(vec![vec![0; 16]; 16], pieces)
}
fn crews() -> Vec<Piece> {
    vec![p(0, 0, 1), p(0, 15, 2), p(15, 0, 3), p(15, 15, 4)]
}
#[test]
fn creation_roundtrip() {
    let mut board = vec![vec![0; 16]; 16];
    for (y, row) in board.iter_mut().enumerate() {
        for (x, t) in row.iter_mut().enumerate() {
            *t = ((x * 7 + y * 3) % 3) as u8;
        }
    }
    let pieces = vec![
        p(2, 3, 1),
        p(4, 5, 2),
        p(7, 9, 5),
        p(10, 2, 7),
        p(11, 13, 4),
    ];
    let g = game(board.clone(), pieces.clone());
    assert_eq!(g.view_board(), board);
    let mut expected = pieces;
    expected.sort_by_key(|p| (p.y, p.x, p.kind));
    assert_eq!(g.view_pieces(), expected);
    assert_eq!(g.deck.cards.len(), 16);
}
#[test]
fn player_movement_no_walls_edges_collisions() {
    let mut g = blank(vec![p(5, 5, 1), p(5, 11, 1), p(11, 5, 1), p(11, 11, 1)]);
    let old = g.view_pieces();
    for d in [0, 1, 2, 3] {
        g.play_player_movement(d);
    }
    assert_eq!(g.view_pieces(), old);
}
#[test]
fn player_movement_just_edges() {
    let mut g = blank(vec![p(0, 0, 1), p(0, 15, 1), p(15, 0, 1), p(15, 15, 1)]);
    for d in [0, 1, 2, 3] {
        for _ in 0..12 {
            g.play_player_movement(d);
        }
        assert_eq!(g.count_players(), 4);
        let ps = g.view_pieces();
        for p in &ps {
            assert!(p.x < 16 && p.y < 16);
        }
        for (i, p) in ps.iter().enumerate() {
            assert!(ps[i + 1..].iter().all(|q| (p.x, p.y) != (q.x, q.y)));
        }
    }
}
#[test]
fn player_movement_just_walls() {
    let mut board = vec![vec![0; 16]; 16];
    for (y, row) in board.iter_mut().enumerate() {
        for (x, t) in row.iter_mut().enumerate() {
            if (x + y) % 2 == 0 {
                *t = 2;
            }
        }
    }
    let pieces = vec![p(0, 1, 1), p(0, 15, 1), p(14, 15, 1), p(15, 10, 1)];
    let mut g = game(board, pieces.clone());
    for d in 0..4 {
        for _ in 0..12 {
            g.play_player_movement(d);
        }
    }
    assert_eq!(g.view_pieces(), pieces);
}
#[test]
fn player_movement_self_collision() {
    let pieces = vec![p(0, 0, 1), p(0, 1, 1), p(1, 0, 1), p(1, 1, 1)];
    let mut g = blank(pieces.clone());
    for d in 0..4 {
        for _ in 0..25 {
            g.play_player_movement(d);
        }
    }
    assert_eq!(g.view_pieces(), pieces);
}
#[test]
fn player_movement_other_collision() {
    let pieces = vec![
        p(0, 0, 1),
        p(0, 1, 1),
        p(0, 10, 2),
        p(1, 0, 1),
        p(1, 1, 1),
        p(1, 10, 2),
        p(2, 0, 2),
        p(2, 1, 2),
        p(2, 8, 2),
        p(2, 9, 2),
    ];
    let mut g = blank(pieces.clone());
    for d in 0..4 {
        for _ in 0..25 {
            g.play_player_movement(d);
        }
    }
    assert_eq!(g.view_pieces(), pieces);
}
#[test]
fn cow_capturing() {
    let mut board = vec![vec![0; 16]; 16];
    for row in board.iter_mut().take(11).skip(1) {
        for t in row.iter_mut().take(11).skip(1) {
            *t = 1;
        }
    }
    let mut g = game(board, vec![p(0, 0, 1)]);
    for _ in 0..10 {
        g.play_player_movement(0);
    }
    for _ in 0..10 {
        g.play_player_movement(1);
    }
    assert_eq!(g.count_held_cows(), 10);
    assert_eq!(g.cows.count(), 90);
    assert_eq!(g.cow_respawn[0].count(), 10);
}
#[test]
fn unit_killing() {
    let mut g = blank(vec![
        p(5, 5, 1),
        p(5, 6, 5),
        p(5, 4, 6),
        p(4, 5, 7),
        p(6, 5, 8),
    ]);
    for d in 0..4 {
        g.play_player_movement(d);
        g.play_player_movement((d + 2) % 4);
        assert_eq!(g.count_enemies(), 3 - d as usize);
    }
    assert_eq!(g.view_pieces(), vec![p(5, 5, 1)]);
}
#[test]
fn enemy_movement_matches_player_logic() {
    let mut board = vec![vec![0; 16]; 16];
    for (y, row) in board.iter_mut().enumerate() {
        for (x, t) in row.iter_mut().enumerate() {
            if x > 4 && (x * 13 + y * 7) % 5 == 0 {
                *t = 2;
            }
        }
    }
    let ps = (0..4).map(|i| p(i, i, 1)).collect();
    let es = (0..4).map(|i| p(i, i, 5)).collect();
    let mut a = game(board.clone(), ps);
    let mut b = game(board, es);
    let mut seed = 7u32;
    for _ in 0..1000 {
        seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
        let d = (seed >> 24) % 4;
        a.play_player_movement(d as u8);
        b.play_enemy_movement(d as u8, 0);
    }
    for (x, y) in a.view_pieces().iter().zip(b.view_pieces()) {
        assert_eq!((x.x, x.y), (y.x, y.y));
    }
}
#[test]
fn scoring_at_another_crews_portal() {
    let mut board = vec![vec![0; 16]; 16];
    // Original scoring fixture, now with a yellow portal instead of a zone tile.
    board[0][0] = 8;
    board[7][0] = 1;
    board[8][0] = 2;
    let mut g = game(board, vec![p(1, 0, 1)]);
    for _ in 0..10 {
        g.play_player_movement(1);
    }
    assert_eq!(g.count_held_cows(), 1);
    assert_eq!(g.cows_collected, 0);
    for _ in 0..10 {
        g.play_player_movement(3);
    }
    assert_eq!(g.count_held_cows(), 0);
    assert_eq!(g.cows_collected, 1);
}
#[test]
fn game_jover() {
    assert_eq!(blank(vec![]).winner(), -1);
    let mut a = blank(crews());
    a.cows_collected = 1_000_000;
    assert_eq!(a.winner(), 1);
    for pass in [true, false] {
        let mut g = blank(crews());
        g.cows_collected = g.rules.cow_sacrifice - i32::from(!pass);
        g.turn = g.rules.days_per_round * 6 - 1;
        g.make_move(&Move::Play { card: 0, color: 0 });
        assert_eq!(g.winner(), if pass { 0 } else { -1 });
    }
}
#[test]
fn card_manager_choose() {
    let cards = (0..16)
        .map(|i| vec![(i % 4) as u8, (i / 4) as u8])
        .collect();
    let mut cm = Deck::new(cards, 3).unwrap();
    let q = 10;
    cm.choose(0, false);
    for i in 0..q {
        assert_eq!(cm.choose(0, false), cm.cards[i]);
    }
    cm.choose(0, true);
    for i in 0..q {
        assert_eq!(cm.choose(0, true), cm.cards[i]);
    }
}
#[test]
fn card_manager_rotate() {
    let mut g = blank(crews());
    let id = g.deck.player[1];
    let old = g.deck.cards[id].clone();
    g.make_move(&Move::Rotate {
        card: 1,
        rotation: 1,
    });
    assert_eq!(
        g.deck.cards[id],
        old.iter().map(|d| (d + 1) % 4).collect::<Vec<_>>()
    );
    assert_eq!(g.turn, 1);
    assert_eq!(g.player_id, 1);
}
#[test]
fn cow_respawn_ring() {
    let mut g = blank(crews());
    g.cows.set(1, true);
    g.play_player_movement(0);
    assert!(!g.cows.get(1));
    g.turn = 14;
    g.make_move(&Move::Rotate {
        card: 0,
        rotation: 1,
    });
    assert!(!g.cows.get(1));
    g.make_move(&Move::Rotate {
        card: 0,
        rotation: 1,
    });
    assert!(g.cows.get(1));
}
#[test]
fn blocked_chain_preserves_edges_and_order() {
    for reversed in [false, true] {
        let mut ps = vec![p(0, 0, 1), p(0, 1, 1), p(0, 2, 1)];
        if reversed {
            ps.reverse();
        }
        let mut g = blank(ps);
        g.play_player_movement(2);
        assert_eq!(g.view_pieces(), vec![p(0, 0, 1), p(0, 1, 1), p(0, 2, 1)]);
    }
}
#[test]
fn invalid_moves_are_atomic() {
    let mut g = blank(crews());
    let old = g.clone();
    for m in [
        Move::Play {
            card: 100,
            color: 0,
        },
        Move::Play { card: 0, color: 3 },
        Move::Rotate {
            card: 0,
            rotation: 0,
        },
        Move::Buy { x: 999, y: 999 },
    ] {
        assert!(g.apply(&m).is_err());
        assert_eq!(g, old);
    }
}
#[test]
fn enemy_captures_alien_and_purges_arrays() {
    let mut g = blank(vec![p(0, 0, 1), p(0, 1, 5)]);
    g.play_enemy_movement(2, 0);
    assert_eq!(g.count_players(), 0);
    assert_eq!(g.players[0].count(), 0);
    assert_eq!(g.enemy.xs[0], vec![0]);
}
#[test]
fn round_spawns_enemies_and_sacrifices() {
    let mut board = vec![vec![0; 16]; 16];
    board[8][8] = 11;
    let mut g = game(board, crews());
    g.turn = 29;
    g.cows_collected = 6;
    g.make_move(&Move::Play { card: 0, color: 0 });
    assert_eq!(g.cows_collected, 1);
    assert_eq!(g.count_enemies(), 1);
    assert_eq!(g.enemy.xs[0], vec![8]);
    assert!(!g.failed_sacrifice);
}
#[test]
fn simd_matches_scalar_all_directions_lengths_and_bounds() {
    use udder_chaos::simd::*;
    for len in [0, 1, 15, 16, 17, 31, 32, 33, 127, 256] {
        for bound in [0, 1, 15, 127, 254] {
            for positive in [false, true] {
                let mut actual: Vec<u8> =
                    (0..len).map(|i| (i % (bound as usize + 1)) as u8).collect();
                let mut expected = actual.clone();
                scalar_step(&mut expected, positive, bound);
                step(&mut actual, positive, bound);
                assert_eq!(actual, expected, "len={len} bound={bound}");
            }
        }
    }
}
#[test]
fn bitset_across_word_boundaries() {
    use udder_chaos::bitset::Bitset;
    for n in [1, 63, 64, 65, 255, 256, 257] {
        let mut a = Bitset::new(n);
        for i in 0..n {
            a.set(i, i % 2 == 0);
        }
        assert_eq!(a.count(), n.div_ceil(2));
        let b = a.clone();
        a.subtract(&b);
        assert_eq!(a.count(), 0);
        a.union(&b);
        assert_eq!(a.intersection(&b), b);
        a.reset();
        assert_eq!(a.count(), 0);
    }
}
#[test]
fn animation_frames_are_recorded_by_the_same_engine() {
    let mut g = blank(crews());
    let mut reference = g.clone();
    let action = Move::Play { card: 0, color: 0 };
    let directions = g.deck.cards[g.deck.player[0]].len();
    let frames = g.apply_with_frames(&action).unwrap();
    reference.apply(&action).unwrap();
    assert_eq!(frames.len(), directions + 1);
    assert_eq!(frames.last(), Some(&reference.view()));
    assert_eq!(g, reference);
}
#[test]
fn round_and_loss_metadata_preserve_the_cpp_winner_rules() {
    use udder_chaos::game::EndReason;
    for (banked, success) in [(5, true), (4, false)] {
        let mut g = blank(crews());
        g.turn = 29;
        g.cows_collected = banked;
        g.make_move(&Move::Play { card: 0, color: 0 });
        let view = g.view();
        let event = view.round_event.unwrap();
        assert_eq!(event.turn, 30);
        assert_eq!(event.required, 5);
        assert_eq!(event.offered, banked);
        assert_eq!(event.success, success);
        assert_eq!(
            view.end_reason,
            if success {
                None
            } else {
                Some(EndReason::SacrificeFailed)
            }
        );
        assert_eq!(g.winner(), if success { 0 } else { -1 });
    }
}
#[test]
fn farmer_captures_are_counted_without_destroying_surviving_crews() {
    use udder_chaos::game::EndReason;
    let mut pieces = crews();
    pieces.push(p(0, 1, 5));
    let mut g = blank(pieces);
    g.play_enemy_movement(2, 0);
    assert_eq!(g.winner(), -1);
    assert_eq!(g.end_reason(), Some(EndReason::CrewDestroyed));
    assert_eq!(g.view().ships_destroyed, 1);
    assert_eq!(g.count_players(), 3);
}
#[test]
fn rotations_support_clockwise_counterclockwise_and_half_turns() {
    for (rotation, expected) in [
        (1, vec![1, 2, 3, 0]),
        (2, vec![2, 3, 0, 1]),
        (3, vec![3, 0, 1, 2]),
    ] {
        let mut g = blank(crews());
        let card = g.deck.player[0];
        g.deck.cards[card] = vec![0, 1, 2, 3];
        let before = g.deck.clone();
        g.apply(&Move::Rotate { card: 0, rotation }).unwrap();
        assert_eq!(g.deck.cards[card], expected);
        assert_eq!(g.deck.player, before.player);
        assert_eq!(g.deck.queue, before.queue);
        assert_eq!(g.turn, 1);
        assert_eq!(g.player_id, 1);
    }
}

#[test]
fn portals_persist_after_movement_and_only_own_portal_allows_spawning() {
    let board = vec![vec![3, 7, 0, 4, 8, 0, 5, 9, 0, 6, 10, 0]];
    let expected = vec![vec![0, 7, 0, 0, 8, 0, 0, 9, 0, 0, 10, 0]];
    let mut g = game(board, vec![p(0, 1, 1), p(0, 4, 2), p(0, 7, 3), p(0, 10, 4)]);
    assert_eq!(g.view_board(), expected);
    g.play_player_movement(0);
    assert_eq!(g.view_board(), expected);
    g.cows_collected = 1;
    let before = g.clone();
    assert!(g.apply(&Move::Buy { x: 0, y: 0 }).is_err());
    assert!(g.apply(&Move::Buy { x: 4, y: 0 }).is_err());
    assert_eq!(g, before);
    g.apply(&Move::Buy { x: 1, y: 0 }).unwrap();
    assert!(g.view_pieces().iter().any(|p| p.kind == 1 && p.x == 1));
    assert_eq!(g.view_board(), expected);
}

#[test]
fn former_zone_tiles_do_not_deposit_cows() {
    let mut board = vec![vec![0; 4]];
    board[0][0] = 7;
    board[0][1] = 3;
    let mut g = game(
        board,
        vec![Piece {
            x: 2,
            y: 0,
            kind: 1,
            score: 3,
        }],
    );
    g.play_player_movement(2);
    assert_eq!(g.cows_collected, 0);
    assert_eq!(g.count_held_cows(), 3);
    g.play_player_movement(2);
    assert_eq!(g.cows_collected, 3);
    assert_eq!(g.count_held_cows(), 0);
}

#[test]
fn capture_events_follow_real_substeps_and_do_not_change_simulation() {
    use udder_chaos::game::StepEvent;
    let mut board = vec![vec![0; 16]; 16];
    board[0][1] = 1;
    let mut g = game(board, crews());
    let card = g.deck.player[0];
    g.deck.cards[card] = vec![0, 0];
    let mut reference = g.clone();
    let action = Move::Play { card: 0, color: 0 };
    let frames = g.apply_with_frames(&action).unwrap();
    reference.apply(&action).unwrap();
    assert_eq!(g, reference);
    assert_eq!(
        frames[0].events,
        vec![StepEvent::CowAbducted {
            x: 1,
            y: 0,
            kind: 1
        }]
    );
    assert!(frames[1].events.is_empty());
    assert!(frames[2].events.is_empty());
    assert!(g.view().events.is_empty());
}
#[test]
fn pitchfork_pop_records_the_captured_ship_and_farmer() {
    use udder_chaos::game::StepEvent;
    let mut ships = crews();
    ships[0] = p(2, 2, 1);
    ships.push(p(2, 1, 5));
    let mut g = game(vec![vec![0; 16]; 16], ships);
    g.turn = 2;
    let card = g.deck.enemy[0];
    g.deck.cards[card] = vec![0];
    let frames = g
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    assert_eq!(
        frames[0].events,
        vec![StepEvent::UfoPopped {
            x: 2,
            y: 2,
            kind: 1,
            farmer_kind: 5
        }]
    );
    assert_eq!(g.ships_destroyed, 1);
    assert!(frames.last().unwrap().events.is_empty());
}

#[test]
fn deposited_cows_are_recorded_once_at_another_crews_portal() {
    use udder_chaos::game::StepEvent;
    let mut board = vec![vec![0; 16]; 16];
    board[0][1] = 8;
    let mut ships = crews();
    ships[0].score = 3;
    let mut g = game(board, ships);
    let id = g.deck.player[0];
    g.deck.cards[id] = vec![0, 2, 0];
    let mut reference = g.clone();
    let action = Move::Play { card: 0, color: 0 };
    let frames = g.apply_with_frames(&action).unwrap();
    reference.apply(&action).unwrap();
    assert_eq!(g, reference);
    assert_eq!(
        frames[0].events,
        vec![StepEvent::CowDeposited {
            x: 1,
            y: 0,
            kind: 1,
            count: 3
        }]
    );
    assert!(frames.iter().skip(1).all(|f| f.events.is_empty()));
    assert_eq!(g.cows_collected, 3);
    assert_eq!(g.count_held_cows(), 0);
}

#[test]
fn played_cards_follow_displayed_directions_left_to_right() {
    // Check intermediate positions: the endpoint alone cannot distinguish reordered arrows.
    for enemy in [false, true] {
        for slot in 0..3 {
            for a in 0..4u8 {
                for b in 0..4u8 {
                    for c in 0..4u8 {
                        let mut pieces = crews();
                        pieces[0] = p(5, 5, 1);
                        if enemy {
                            pieces.push(p(5, 5, 5));
                        }
                        let mut g = blank(pieces);
                        if enemy {
                            g.turn = 2;
                        }
                        let id = if enemy {
                            g.deck.enemy[slot]
                        } else {
                            g.deck.player[slot]
                        };
                        let arrows = vec![a, b, c];
                        g.deck.cards[id] = arrows.clone();
                        let frames = g
                            .apply_with_frames(&Move::Play {
                                card: slot,
                                color: 0,
                            })
                            .unwrap();
                        let (mut x, mut y) = (5, 5);
                        for (step, direction) in arrows.into_iter().enumerate() {
                            match direction {
                                0 => x += 1,
                                1 => y += 1,
                                2 => x -= 1,
                                3 => y -= 1,
                                _ => unreachable!(),
                            }
                            let kind = if enemy { 5 } else { 1 };
                            let ship = frames[step].pieces.iter().find(|p| p.kind == kind).unwrap();
                            assert_eq!(
                                (ship.x, ship.y),
                                (x, y),
                                "enemy={enemy} slot={slot} arrows={a},{b},{c} step={step}"
                            );
                        }
                    }
                }
            }
        }
    }
}

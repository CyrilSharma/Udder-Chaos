//! Deterministic real-engine fixtures for the developer-only animation preview.
use serde::Serialize;
use std::collections::BTreeMap;
use udder_chaos::{
    game::{GameView, Move},
    protocol::Settings,
    server::setup,
};
#[derive(Serialize)]
struct Fixture {
    initial: GameView,
    frames: Vec<GameView>,
}
fn main() {
    let mut out = BTreeMap::new();
    for (name, banked) in [("sacrifice", 6), ("failure", 4)] {
        let mut g = setup(&Settings::default()).unwrap();
        g.turn = 29;
        g.player_id = 0;
        g.cows_collected = banked;
        let initial = g.view();
        let frames = g
            .apply_with_frames(&Move::Play { card: 0, color: 0 })
            .unwrap();
        out.insert(name, Fixture { initial, frames });
    }
    let mut g = setup(&Settings::default()).unwrap();
    g.turn = 2;
    g.player_id = 2;
    let x = g.player.xs[0][0];
    let y = g.player.ys[0][0];
    g.enemy.xs[0] = vec![x - 1];
    g.enemy.ys[0] = vec![y];
    g.enemy.ss[0] = vec![0];
    g.enemy.deads[0] = vec![0];
    g.enemies[0].reset();
    g.enemies[0].set(y as usize * g.width + x as usize - 1, true);
    let id = g.deck.enemy[0];
    g.deck.cards[id] = vec![0];
    let initial = g.view();
    let frames = g
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("farmers", Fixture { initial, frames });
    let mut purchase = setup(&Settings::default()).unwrap();
    let (x, y) = purchase.player_spawns[0][0];
    purchase.player.xs[0][0] = (x - 1) as u8;
    purchase.players[0].reset();
    purchase.players[0].set(y * purchase.width + x - 1, true);
    purchase.cows_collected = 1;
    let initial = purchase.view();
    let frames = purchase.apply_with_frames(&Move::Buy { x, y }).unwrap();
    out.insert("purchase", Fixture { initial, frames });
    let mut abduction = setup(&Settings::default()).unwrap();
    let x = abduction.player.xs[0][0] as usize;
    let y = abduction.player.ys[0][0] as usize;
    abduction.cows.set(y * abduction.width + x - 1, true);
    let id = abduction.deck.player[0];
    abduction.deck.cards[id] = vec![2];
    let initial = abduction.view();
    let frames = abduction
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("abduction", Fixture { initial, frames });
    let mut chain = setup(&Settings::default()).unwrap();
    let x = chain.player.xs[0][0] as usize;
    let y = chain.player.ys[0][0] as usize;
    for distance in 1..=3 {
        chain.cows.set(y * chain.width + x - distance, true);
    }
    let id = chain.deck.player[0];
    chain.deck.cards[id] = vec![2, 2, 2];
    let initial = chain.view();
    let frames = chain
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("abduction_chain", Fixture { initial, frames });
    let mut deposit = setup(&Settings::default()).unwrap();
    let (x, y) = deposit.player_spawns[1][0];
    deposit.player.xs[1][0] = (x + 1) as u8;
    deposit.players[1].reset();
    deposit.players[1].set(y * deposit.width + x + 1, true);
    deposit.player.xs[0][0] = (x - 1) as u8;
    deposit.player.ys[0][0] = y as u8;
    deposit.player.ss[0][0] = 3;
    deposit.players[0].reset();
    deposit.players[0].set(y * deposit.width + x - 1, true);
    let id = deposit.deck.player[0];
    deposit.deck.cards[id] = vec![0];
    let initial = deposit.view();
    let frames = deposit
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("deposit", Fixture { initial, frames });
    let mut alien = setup(&Settings::default()).unwrap();
    let (x, y) = alien.player_spawns[0][0];
    alien.cows_collected = alien.rules.score_goal - 1;
    alien.player.xs[0][0] = (x - 1) as u8;
    alien.player.ss[0][0] = 1;
    alien.players[0].reset();
    alien.players[0].set(y * alien.width + x - 1, true);
    let id = alien.deck.player[0];
    alien.deck.cards[id] = vec![0];
    let initial = alien.view();
    let frames = alien
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("aliens", Fixture { initial, frames });
    let mut order = setup(&Settings::default()).unwrap();
    // Exact reported first-turn card; clear field to make its path unambiguous.
    order.player.xs[0][0] = 5;
    order.player.ys[0][0] = 5;
    order.players[0].reset();
    order.players[0].set(5 * order.width + 5, true);
    order.impassible.reset();
    order.cows.reset();
    let id = order.deck.player[0];
    order.deck.cards[id] = vec![3, 2, 2];
    let initial = order.view();
    let frames = order
        .apply_with_frames(&Move::Play { card: 0, color: 0 })
        .unwrap();
    out.insert("card_order", Fixture { initial, frames });
    let mut field_order = setup(&Settings::default()).unwrap();
    let id = field_order.deck.player[2];
    field_order.deck.cards[id] = vec![3, 2, 2];
    let initial = field_order.view();
    let frames = field_order
        .apply_with_frames(&Move::Play { card: 2, color: 0 })
        .unwrap();
    out.insert("card_order_field", Fixture { initial, frames });
    let json = serde_json::to_string_pretty(&out).unwrap();
    let source=format!("// Generated by cargo run --example animation_fixtures.\nimport type {{ GameView }} from '../protocol';\nexport const fixtures = {json} as unknown as Record<string, {{initial:GameView;frames:GameView[]}}>;\n");
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("frontend/src/dev/animation-fixtures.ts");
    std::fs::write(path, source).unwrap();
}

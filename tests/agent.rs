use udder_chaos::{
    agent::{Agent, Request},
    protocol::Settings,
    server::setup,
};
#[test]
fn legacy_init_and_get_now_assert_real_state() {
    let mut a = Agent::default();
    assert!(a.handle(Request::Get).error.is_some());
    let g = setup(&Settings::default()).unwrap();
    let v = g.view();
    let reply = a.handle(Request::Init {
        board: v.board.clone(),
        pieces: v.pieces.clone(),
        cards: g.deck.cards.clone(),
        rules: g.rules.clone(),
    });
    assert!(reply.error.is_none());
    assert_eq!(reply.game, Some(v.clone()));
    assert_eq!(a.handle(Request::Get).game, Some(v));
}
#[test]
fn agent_query_returns_action_without_desynchronizing() {
    let mut a = Agent::default();
    let g = setup(&Settings::default()).unwrap();
    let v = g.view();
    a.handle(Request::Init {
        board: v.board,
        pieces: v.pieces,
        cards: g.deck.cards.clone(),
        rules: g.rules,
    });
    let r = a.handle(Request::Query {
        timeout_ms: 10,
        max_depth: 2,
        threads: 1,
    });
    let action = r.action.unwrap();
    let before = a.game.as_ref().unwrap().turn;
    assert_eq!(before, 0);
    assert!(a.handle(Request::Advance { action }).error.is_none());
    assert_eq!(a.game.unwrap().turn, 1);
}
#[test]
fn jsonl_binary_accepts_multiple_typed_requests() {
    use std::{
        io::Write,
        process::{Command, Stdio},
    };
    let mut c = Command::new(env!("CARGO_BIN_EXE_ai"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut input = c.stdin.take().unwrap();
    writeln!(input, "{{\"type\":\"get\"}}\n{{\"type\":\"get\"}}").unwrap();
    drop(input);
    let out = c.wait_with_output().unwrap();
    assert!(out.status.success());
    let lines: Vec<_> = std::str::from_utf8(&out.stdout).unwrap().lines().collect();
    assert_eq!(lines.len(), 2);
    for line in lines {
        let r: udder_chaos::agent::Response = serde_json::from_str(line).unwrap();
        assert!(r.error.unwrap().contains("Initialize"));
    }
}

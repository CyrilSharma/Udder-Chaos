use udder_chaos::{
    browser::{BrowserEngine, EngineRequest},
    game::Move,
    protocol::Settings,
};
#[test]
fn replicas_prepare_commit_and_replay_identically() {
    let settings = Settings::default();
    let mut a = BrowserEngine::default();
    let mut b = BrowserEngine::default();
    let initial = a.handle(EngineRequest::Init {
        settings: settings.clone(),
    });
    b.handle(EngineRequest::Init { settings });
    let action = Move::Play { card: 2, color: 0 };
    let prepared = a.handle(EngineRequest::Prepare {
        action: action.clone(),
    });
    assert!(prepared.error.is_none());
    assert_eq!(a.handle(EngineRequest::View).state, initial.state);
    assert_eq!(
        b.handle(EngineRequest::Prepare { action }).state,
        prepared.state
    );
    let committed = a.handle(EngineRequest::Commit);
    assert_eq!(b.handle(EngineRequest::Commit).state, committed.state);
    let mut replacement = BrowserEngine::default();
    let recovered = replacement.handle(EngineRequest::Restore {
        checkpoint: committed.checkpoint.unwrap(),
    });
    assert_eq!(recovered.state, committed.state);
    assert_eq!(recovered.game, committed.game);
}
#[test]
fn abandoned_preparations_and_invalid_checkpoints_do_not_change_committed_state() {
    let mut engine = BrowserEngine::default();
    let initial = engine.handle(EngineRequest::Init {
        settings: Settings::default(),
    });
    engine.handle(EngineRequest::Prepare {
        action: Move::Play { card: 0, color: 0 },
    });
    engine.handle(EngineRequest::Discard);
    assert!(engine.handle(EngineRequest::Commit).error.is_some());
    assert_eq!(engine.handle(EngineRequest::View).state, initial.state);
    let mut invalid = initial.checkpoint.unwrap();
    invalid.actions.push(Move::Play {
        card: 999,
        color: 0,
    });
    assert!(engine
        .handle(EngineRequest::Restore {
            checkpoint: invalid
        })
        .error
        .is_some());
    assert_eq!(engine.handle(EngineRequest::View).state, initial.state);
}

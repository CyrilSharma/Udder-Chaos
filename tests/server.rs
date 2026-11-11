use udder_chaos::{game::Move, protocol::*, server::*};
fn create(app: &App, solo: bool) -> (Snapshot, String) {
    let r = app.command(Command::Create {
        name: "Captain".into(),
        solo,
        settings: Settings::default(),
    });
    assert!(r.error.is_none(), "{:?}", r.error);
    (r.snapshot.unwrap(), r.token.unwrap())
}
#[test]
fn init_get_serde_replaces_legacy_jest_tests() {
    let a = App::default();
    let (s, t) = create(&a, true);
    let cmd = Command::Get {
        room: s.room,
        token: t,
    };
    let roundtrip: Command = serde_json::from_str(&serde_json::to_string(&cmd).unwrap()).unwrap();
    let reply = a.command(roundtrip);
    assert!(reply.error.is_none());
    assert_eq!(reply.snapshot.unwrap().players[0].name, "Captain");
}

#[test]
fn cross_device_rejoin_preserves_color_and_game_and_revokes_old_token() {
    let app = App::default();
    let (s, old) = create(&app, true);
    let room = s.room;
    let denied = app.command(Command::Rejoin {
        room: room.clone(),
        name: Some("Captain".into()),
    });
    assert!(denied.error.unwrap().contains("still connected"));
    app.command(Command::Start {
        room: room.clone(),
        token: old.clone(),
    });
    app.command(Command::Leave {
        room: room.clone(),
        token: old.clone(),
    });
    let reply = app.command(Command::Rejoin {
        room: room.clone(),
        name: None,
    });
    assert!(reply.error.is_none(), "{:?}", reply.error);
    let snapshot = reply.snapshot.unwrap();
    assert_eq!(snapshot.you, 0);
    assert_eq!(snapshot.players.len(), 1);
    assert_eq!(snapshot.game.unwrap().turn, 0);
    let new = reply.token.unwrap();
    assert_ne!(old, new);
    assert!(app
        .command(Command::Get {
            room: room.clone(),
            token: old
        })
        .error
        .is_some());
    assert!(app
        .command(Command::Get { room, token: new })
        .error
        .is_none());
}
#[test]
fn authoritative_move_and_stale_rejection() {
    let a = App::default();
    let (s, t) = create(&a, true);
    let s = a
        .command(Command::Start {
            room: s.room.clone(),
            token: t.clone(),
        })
        .snapshot
        .unwrap();
    let cmd = Command::Move {
        room: s.room.clone(),
        token: t.clone(),
        revision: s.revision,
        action: Move::Play { card: 0, color: 0 },
    };
    let r = a.command(cmd.clone());
    assert_eq!(r.snapshot.unwrap().game.unwrap().turn, 1);
    assert!(a.command(cmd).error.unwrap().contains("State changed"));
    let s = a
        .command(Command::Get {
            room: s.room,
            token: t,
        })
        .snapshot
        .unwrap();
    assert_eq!(s.game.unwrap().turn, 1);
}
#[test]
fn room_capacity_unique_colors_host_privileges_and_turns() {
    let a = App::default();
    let (s, t) = create(&a, false);
    let code = s.room;
    let mut ts = vec![t.clone()];
    for n in 1..4 {
        let r = a.command(Command::Join {
            room: code.clone(),
            name: format!("Crew {n}"),
            token: None,
        });
        assert_eq!(r.snapshot.as_ref().unwrap().you, n);
        ts.push(r.token.unwrap());
    }
    assert!(a
        .command(Command::Join {
            room: code.clone(),
            name: "Extra".into(),
            token: None
        })
        .error
        .is_some());
    assert!(a
        .command(Command::Start {
            room: code.clone(),
            token: ts[1].clone()
        })
        .error
        .is_some());
    assert!(a
        .command(Command::Configure {
            room: code.clone(),
            token: ts[1].clone(),
            name: "Other".into(),
            color: 0,
            settings: None,
            solo: None,
        })
        .error
        .is_some());
    let s = a
        .command(Command::Start {
            room: code.clone(),
            token: t.clone(),
        })
        .snapshot
        .unwrap();
    assert!(a
        .command(Command::Move {
            room: code.clone(),
            token: ts[1].clone(),
            revision: s.revision,
            action: Move::Play { card: 0, color: 0 }
        })
        .error
        .is_some());
    assert!(a
        .command(Command::Move {
            room: code.clone(),
            token: t,
            revision: s.revision,
            action: Move::Play { card: 0, color: 0 }
        })
        .error
        .is_none());
}
#[test]
fn reconnect_uses_private_token_not_color_or_socket_id() {
    let a = App::default();
    let (s, t) = create(&a, true);
    a.command(Command::Start {
        room: s.room.clone(),
        token: t.clone(),
    });
    let good = a.command(Command::Join {
        room: s.room.clone(),
        name: "Ignored".into(),
        token: Some(t.clone()),
    });
    assert!(good.error.is_none());
    assert!(a
        .command(Command::Join {
            room: s.room.clone(),
            name: "Intruder".into(),
            token: Some("bad".into())
        })
        .error
        .is_some());
    let json = serde_json::to_string(&good.snapshot).unwrap();
    assert!(!json.contains(&t));
}
#[test]
fn deterministic_seed_maps_deck_and_settings() {
    let mut s = Settings::default();
    let a = setup(&s).unwrap();
    assert_eq!(a, setup(&s).unwrap());
    s.seed = 1;
    assert_ne!(a.deck.cards, setup(&s).unwrap().deck.cards);
    assert_eq!(a.rules, Settings::default().rules);
}
#[test]
fn strict_commands_and_invalid_configuration() {
    assert!(
        serde_json::from_str::<Command>(r#"{"type":"get","room":"X","token":"Y","extra":1}"#)
            .is_err()
    );
    let a = App::default();
    let mut s = Settings::default();
    s.rules.cow_regen_rate = 0;
    assert!(a
        .command(Command::Create {
            name: "C".into(),
            solo: true,
            settings: s
        })
        .error
        .is_some());
}
#[test]
fn generated_types_stay_in_sync() {
    assert_eq!(
        std::fs::read_to_string(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/frontend/src/protocol.ts"
        ))
        .unwrap(),
        udder_chaos::protocol::typescript()
    );
}
#[tokio::test]
async fn http_protocol_roundtrip() {
    use axum::{
        body::{to_bytes, Body},
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;
    let c = Command::Create {
        name: "HTTP".into(),
        solo: true,
        settings: Settings::default(),
    };
    let res = router(App::default())
        .oneshot(
            Request::post("/api/command")
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(&c).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let b = to_bytes(res.into_body(), 1024 * 1024).await.unwrap();
    let r: Reply = serde_json::from_slice(&b).unwrap();
    assert!(r.error.is_none());
    assert!(r.token.is_some());
}
#[tokio::test]
async fn server_timer_plays_for_absent_players() {
    let a = App::default();
    let settings = Settings {
        timer_length: 1,
        ..Settings::default()
    };
    let r = a.command(Command::Create {
        name: "Timer".into(),
        solo: true,
        settings,
    });
    let s = r.snapshot.unwrap();
    let t = r.token.unwrap();
    a.command(Command::Start {
        room: s.room.clone(),
        token: t.clone(),
    });
    tokio::time::sleep(std::time::Duration::from_millis(1100)).await;
    a.tick().await;
    let g = a
        .command(Command::Get {
            room: s.room,
            token: t,
        })
        .snapshot
        .unwrap()
        .game
        .unwrap();
    assert_eq!(g.turn, 1);
}
#[tokio::test]
async fn ai_and_multiple_clients_share_authoritative_state() {
    let a = App::default();
    let settings = Settings {
        difficulty: 10,
        threads: 2,
        ..Settings::default()
    };
    let r = a.command(Command::Create {
        name: "AI check".into(),
        solo: true,
        settings,
    });
    let mut s = r.snapshot.unwrap();
    let token = r.token.unwrap();
    s = a
        .command(Command::Start {
            room: s.room,
            token: token.clone(),
        })
        .snapshot
        .unwrap();
    for color in [0, 1] {
        s = a
            .command(Command::Move {
                room: s.room,
                token: token.clone(),
                revision: s.revision,
                action: Move::Play { card: 0, color },
            })
            .snapshot
            .unwrap();
    }
    a.tick().await;
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    let cmd = Command::Get {
        room: s.room,
        token,
    };
    let one = a.command(cmd.clone()).snapshot.unwrap();
    let two = a.command(cmd).snapshot.unwrap();
    assert_eq!(one.game.as_ref().unwrap().turn, 3);
    assert_eq!(one.game, two.game);
    assert_eq!(one.revision, two.revision);
}

#[test]
fn hover_forecasts_match_committed_moves_without_changing_the_room() {
    let app = App::default();
    let (initial, token) = create(&app, true);
    let snapshot = app
        .command(Command::Start {
            room: initial.room,
            token: token.clone(),
        })
        .snapshot
        .unwrap();
    for card in 0..3 {
        let request = PreviewRequest {
            room: snapshot.room.clone(),
            token: token.clone(),
            revision: snapshot.revision,
            card,
        };
        let preview = app.preview(request).preview.unwrap();
        let unchanged = app
            .command(Command::Get {
                room: snapshot.room.clone(),
                token: token.clone(),
            })
            .snapshot
            .unwrap();
        assert_eq!(unchanged.revision, snapshot.revision);
        assert_eq!(unchanged.game, snapshot.game);
        assert_eq!(unchanged.frames, snapshot.frames);
        let mut reference = setup(&snapshot.settings).unwrap();
        let frames = reference
            .apply_with_frames(&Move::Play { card, color: 0 })
            .unwrap();
        let expected: Vec<Vec<_>> = frames[..frames.len() - 1]
            .iter()
            .map(|frame| {
                frame
                    .pieces
                    .iter()
                    .filter(|p| p.kind == 1)
                    .cloned()
                    .collect()
            })
            .collect();
        assert_eq!(preview.steps, expected);
    }
}

#[test]
fn hover_forecasts_reject_stale_unauthorized_and_invalid_cards() {
    let app = App::default();
    let (initial, token) = create(&app, true);
    let snapshot = app
        .command(Command::Start {
            room: initial.room,
            token: token.clone(),
        })
        .snapshot
        .unwrap();
    let request = PreviewRequest {
        room: snapshot.room,
        token,
        revision: snapshot.revision,
        card: 0,
    };
    for invalid in [
        PreviewRequest {
            token: "wrong".into(),
            ..request.clone()
        },
        PreviewRequest {
            revision: request.revision - 1,
            ..request.clone()
        },
        PreviewRequest {
            card: 999,
            ..request.clone()
        },
    ] {
        assert!(app.preview(invalid).error.is_some());
    }
    assert!(app.preview(request).error.is_none());
}

#[test]
fn lobby_host_can_toggle_solo_before_start() {
    let a = App::default();
    let (s, token) = create(&a, false);
    let configured = a.command(Command::Configure {
        room: s.room.clone(),
        token: token.clone(),
        name: "Captain".into(),
        color: 0,
        settings: None,
        solo: Some(true),
    });
    assert!(configured.error.is_none());
    assert!(configured.snapshot.unwrap().solo);
    assert!(a
        .command(Command::Start {
            room: s.room,
            token
        })
        .error
        .is_none());
}

//! Compare any two executables implementing agent::Request / agent::Response.
use std::{
    io::{BufRead, BufReader, Write},
    process::{Child, ChildStdin, Command, Stdio},
    sync::mpsc,
    time::Duration,
};
use udder_chaos::{
    agent::{Request, Response},
    protocol::Settings,
    server::setup,
};
struct Engine {
    child: Child,
    input: ChildStdin,
    output: mpsc::Receiver<String>,
}
impl Engine {
    fn new(path: &str) -> Self {
        let mut child = Command::new(path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .expect("Could not start engine");
        let input = child.stdin.take().unwrap();
        let out = child.stdout.take().unwrap();
        let (tx, output) = mpsc::channel();
        std::thread::spawn(move || {
            for line in BufReader::new(out).lines() {
                match line {
                    Ok(l) => {
                        if tx.send(l).is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        });
        Self {
            child,
            input,
            output,
        }
    }
    fn send(&mut self, r: &Request) -> Response {
        serde_json::to_writer(&mut self.input, r).unwrap();
        writeln!(self.input).unwrap();
        self.input.flush().unwrap();
        let text = self
            .output
            .recv_timeout(Duration::from_secs(10))
            .expect("Engine exceeded 10-second response deadline");
        let reply: Response = serde_json::from_str(&text).expect("Engine returned invalid JSON");
        assert!(reply.error.is_none(), "Engine error: {:?}", reply.error);
        reply
    }
}
impl Drop for Engine {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
fn main() {
    let args: Vec<_> = std::env::args().collect();
    assert!(
        (3..=4).contains(&args.len()),
        "Usage: arena <engine1> <engine2> [matches=10]"
    );
    let matches: usize = args.get(3).map(|s| s.parse().unwrap()).unwrap_or(10);
    assert!(matches > 0);
    let mut engines = [Engine::new(&args[1]), Engine::new(&args[2])];
    let mut wins = [0, 0];
    let mut draws = 0;
    let mut settings = Settings::default();
    settings.rules.cow_sacrifice = 3;
    settings.rules.score_goal = 7;
    println!(
        "Arena configuration: {}",
        serde_json::to_string(&settings).unwrap()
    );
    println!("matches={matches}, seed=match index, timeout_ms=100, max_depth=64, threads=1, turn_cap=1000; alternate alien/farmer sides");
    for i in 0..matches {
        settings.seed = i as u32;
        let mut g = setup(&settings).unwrap();
        let initial = g.view();
        let init = Request::Init {
            board: initial.board,
            pieces: initial.pieces,
            cards: g.deck.cards.clone(),
            rules: g.rules.clone(),
        };
        for e in &mut engines {
            e.send(&init);
        }
        while g.winner() == 0 && g.turn < 1000 {
            let idx = if g.enemy_turn() { 1 - i % 2 } else { i % 2 };
            let m = engines[idx]
                .send(&Request::Query {
                    timeout_ms: 100,
                    max_depth: 64,
                    threads: 1,
                })
                .action
                .expect("Engine returned no action");
            g.apply(&m).expect("Engine returned illegal action");
            for e in &mut engines {
                let response = e.send(&Request::Advance { action: m.clone() });
                assert_eq!(response.game.unwrap(), g.view(), "Engine state diverged");
            }
        }
        match g.winner() {
            1 => wins[i % 2] += 1,
            -1 => wins[1 - i % 2] += 1,
            _ => draws += 1,
        }
        println!(
            "match {i}: winner={}, turns={}, wins={wins:?}, draws={draws}",
            g.winner(),
            g.turn
        );
    }
}

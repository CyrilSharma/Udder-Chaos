use std::io::{self, BufRead, Write};
use udder_chaos::agent::{Agent, Request, Response};
fn main() {
    let mut agent = Agent::default();
    let mut stdout = io::stdout().lock();
    for line in io::stdin().lock().lines() {
        let reply = match line {
            Ok(l) => match serde_json::from_str::<Request>(&l) {
                Ok(r) => agent.handle(r),
                Err(e) => Response {
                    game: None,
                    action: None,
                    error: Some(e.to_string()),
                },
            },
            Err(_) => break,
        };
        serde_json::to_writer(&mut stdout, &reply).unwrap();
        writeln!(stdout).unwrap();
        stdout.flush().unwrap();
    }
}

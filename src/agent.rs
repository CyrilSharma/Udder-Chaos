//! Typed JSONL interface for standalone AI processes and Arena. No text parser.
use crate::{
    game::{Game, GameView, Move, Piece, Rules},
    search::Search,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub enum Request {
    Init {
        board: Vec<Vec<u8>>,
        pieces: Vec<Piece>,
        cards: Vec<Vec<u8>>,
        rules: Rules,
    },
    Get,
    Advance {
        action: Move,
    },
    Query {
        timeout_ms: u32,
        max_depth: u32,
        threads: usize,
    },
}
#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub game: Option<GameView>,
    pub action: Option<Move>,
    pub error: Option<String>,
}
#[derive(Default)]
pub struct Agent {
    pub game: Option<Game>,
}
impl Agent {
    pub fn handle(&mut self, request: Request) -> Response {
        match self.execute(request) {
            Ok((game, action)) => Response {
                game: Some(game),
                action,
                error: None,
            },
            Err(e) => Response {
                game: None,
                action: None,
                error: Some(e),
            },
        }
    }
    fn execute(&mut self, request: Request) -> Result<(GameView, Option<Move>), String> {
        let mut action = None;
        match request {
            Request::Init {
                board,
                pieces,
                cards,
                rules,
            } => {
                self.game = Some(Game::new(board, pieces, cards, rules)?);
            }
            Request::Get => {}
            Request::Advance { action: m } => {
                self.game
                    .as_mut()
                    .ok_or("Initialize a game first")?
                    .apply(&m)?;
            }
            Request::Query {
                timeout_ms,
                max_depth,
                threads,
            } => {
                if timeout_ms == 0
                    || timeout_ms > 60000
                    || max_depth == 0
                    || max_depth > 128
                    || threads == 0
                    || threads > 16
                {
                    return Err("Invalid search configuration".into());
                }
                let g = self.game.as_ref().ok_or("Initialize a game first")?;
                if g.winner() != 0 {
                    return Err("The game has ended".into());
                }
                let mut search = Search::new(
                    g.clone(),
                    Duration::from_millis(timeout_ms as u64),
                    max_depth,
                );
                search.threads = threads;
                action = Some(search.begin_search().action);
            }
        }
        Ok((
            self.game.as_ref().ok_or("Initialize a game first")?.view(),
            action,
        ))
    }
}

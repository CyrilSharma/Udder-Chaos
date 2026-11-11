//! Browser transport boundary. Rules, frames and AI remain in the original Rust engine.
use crate::{
    game::{Game, GameView, Move, Piece},
    protocol::Settings,
    search::Search,
    setup::setup,
};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct Checkpoint {
    pub settings: Settings,
    pub actions: Vec<Move>,
}
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
pub enum EngineRequest {
    Init { settings: Settings },
    Restore { checkpoint: Checkpoint },
    View,
    Prepare { action: Move },
    Commit,
    Discard,
    Preview { card: usize },
    Query { timeout_ms: u32, max_depth: u32 },
}
#[derive(Serialize, Deserialize, TS)]
pub struct EngineReply {
    pub game: Option<GameView>,
    pub frames: Vec<GameView>,
    pub checkpoint: Option<Checkpoint>,
    pub state: Option<String>,
    pub action: Option<Move>,
    pub steps: Vec<Vec<Piece>>,
    pub error: Option<String>,
}
#[derive(Default)]
pub struct BrowserEngine {
    current: Option<(Game, Checkpoint)>,
    pending: Option<(Game, Move, Vec<GameView>)>,
}
impl BrowserEngine {
    pub fn handle(&mut self, request: EngineRequest) -> EngineReply {
        let mut reply = EngineReply {
            game: None,
            frames: vec![],
            checkpoint: None,
            state: None,
            action: None,
            steps: vec![],
            error: None,
        };
        if let Err(error) = self.execute(request, &mut reply) {
            reply.error = Some(error);
        }
        reply
    }
    fn execute(&mut self, request: EngineRequest, reply: &mut EngineReply) -> Result<(), String> {
        match request {
            EngineRequest::Init { settings } => {
                let game = setup(&settings)?;
                self.current = Some((
                    game,
                    Checkpoint {
                        settings,
                        actions: vec![],
                    },
                ));
                self.pending = None;
            }
            EngineRequest::Restore { checkpoint } => {
                if checkpoint.actions.len() > 100_000 {
                    return Err("Checkpoint is too long".into());
                }
                let mut game = setup(&checkpoint.settings)?;
                for action in &checkpoint.actions {
                    game.apply(action)?;
                }
                self.current = Some((game, checkpoint));
                self.pending = None;
            }
            EngineRequest::Prepare { action } => {
                let mut game = self
                    .current
                    .as_ref()
                    .ok_or("Initialize a game first")?
                    .0
                    .clone();
                let frames = game.apply_with_frames(&action)?;
                reply.game = Some(game.view());
                reply.state = Some(serde_json::to_string(&game).map_err(|e| e.to_string())?);
                reply.frames = frames.clone();
                self.pending = Some((game, action, frames));
                return Ok(());
            }
            EngineRequest::Commit => {
                let (game, action, frames) = self.pending.take().ok_or("No prepared turn")?;
                let current = self.current.as_mut().ok_or("Initialize a game first")?;
                current.0 = game;
                current.1.actions.push(action);
                reply.frames = frames;
            }
            EngineRequest::Discard => {
                self.pending = None;
            }
            EngineRequest::Preview { card } => {
                let game = &self.current.as_ref().ok_or("Initialize a game first")?.0;
                if game.enemy_turn() {
                    return Err("It is not an alien turn".into());
                }
                let mut forecast = game.clone();
                let frames = forecast.apply_with_frames(&Move::Play {
                    card,
                    color: game.player_id,
                })?;
                reply.steps = frames[..frames.len() - 1]
                    .iter()
                    .map(|f| {
                        f.pieces
                            .iter()
                            .filter(|p| p.kind == game.player_id + 1)
                            .cloned()
                            .collect()
                    })
                    .collect();
            }
            EngineRequest::Query {
                timeout_ms,
                max_depth,
            } => {
                if timeout_ms == 0 || timeout_ms > 3000 || max_depth == 0 || max_depth > 128 {
                    return Err("Invalid search configuration".into());
                }
                let game = &self.current.as_ref().ok_or("Initialize a game first")?.0;
                if game.winner() != 0 {
                    return Err("The game has ended".into());
                }
                reply.action = Some(
                    Search::new(
                        game.clone(),
                        Duration::from_millis(timeout_ms as u64),
                        max_depth,
                    )
                    .begin_search()
                    .action,
                );
            }
            EngineRequest::View => {}
        }
        let (game, checkpoint) = self.current.as_ref().ok_or("Initialize a game first")?;
        reply.game = Some(game.view());
        reply.state = Some(serde_json::to_string(game).map_err(|e| e.to_string())?);
        reply.checkpoint = Some(checkpoint.clone());
        Ok(())
    }
}

#[cfg(target_arch = "wasm32")]
mod abi {
    use super::*;
    use std::cell::RefCell;
    thread_local! { static ENGINE: RefCell<BrowserEngine> = RefCell::new(BrowserEngine::default()); }
    #[no_mangle]
    pub extern "C" fn udder_alloc(len: u32) -> u32 {
        Box::into_raw(vec![0u8; len as usize].into_boxed_slice()) as *mut u8 as u32
    }
    #[no_mangle]
    pub unsafe extern "C" fn udder_free(ptr: u32, len: u32) {
        // SAFETY: only allocations returned by this module with their original length are passed by the worker.
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
            ptr as *mut u8,
            len as usize,
        )));
    }
    #[no_mangle]
    pub unsafe extern "C" fn udder_step(ptr: u32, len: u32, positive: u32, bound: u32) {
        // SAFETY: the worker/test harness passes a module allocation of this length.
        crate::simd::step(
            std::slice::from_raw_parts_mut(ptr as *mut u8, len as usize),
            positive != 0,
            bound as u8,
        );
    }
    #[no_mangle]
    pub unsafe extern "C" fn udder_call(ptr: u32, len: u32) -> u64 {
        // SAFETY: the worker allocates and initializes this input slice before calling.
        let input = std::slice::from_raw_parts(ptr as *const u8, len as usize);
        let result = match serde_json::from_slice::<EngineRequest>(input) {
            Ok(request) => ENGINE
                .with(|engine| serde_json::to_vec(&engine.borrow_mut().handle(request)).unwrap()),
            Err(error) => {
                serde_json::to_vec(&serde_json::json!({"error":error.to_string()})).unwrap()
            }
        }
        .into_boxed_slice();
        let size = result.len() as u64;
        let address = Box::into_raw(result) as *mut u8 as u32;
        ((address as u64) << 32) | size
    }
}

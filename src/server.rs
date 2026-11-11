use crate::{
    game::{Game, Move},
    protocol::*,
    search::Search,
};
use axum::{extract::State, routing::post, Json, Router};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tower_http::services::{ServeDir, ServeFile};
use uuid::Uuid;
#[derive(Clone)]
pub struct App {
    inner: Arc<Mutex<HashMap<String, Room>>>,
}
struct Seat {
    token: String,
    name: String,
    color: u8,
    seen: Instant,
}
struct Room {
    seats: Vec<Seat>,
    settings: Settings,
    game: Option<Game>,
    revision: u32,
    deadline: Instant,
    busy: bool,
    frames: Vec<crate::game::GameView>,
    solo: bool,
    touched: Instant,
}
fn name(s: &str) -> Result<String, String> {
    let s = s.trim();
    if s.is_empty() || s.chars().count() > 24 {
        Err("Names must contain 1–24 characters".into())
    } else {
        Ok(s.into())
    }
}
fn token() -> String {
    Uuid::new_v4().to_string()
}
use crate::setup::validate;
pub use crate::setup::{maps, setup};
impl Default for App {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
impl Room {
    fn snapshot(&self, code: &str, idx: usize) -> Snapshot {
        Snapshot {
            version: VERSION,
            room: code.into(),
            revision: self.revision,
            players: self
                .seats
                .iter()
                .map(|p| Player {
                    name: p.name.clone(),
                    color: p.color,
                    connected: p.seen.elapsed() < Duration::from_secs(5),
                })
                .collect(),
            settings: self.settings.clone(),
            game: self.game.as_ref().map(Game::view),
            frames: self.frames.clone(),
            you: self.seats[idx].color,
            host: idx == 0,
            solo: self.solo,
            turn_deadline_ms: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as f64
                + self
                    .deadline
                    .saturating_duration_since(Instant::now())
                    .as_millis() as f64,
        }
    }
    fn reset_clock(&mut self) {
        self.deadline = Instant::now() + Duration::from_secs(self.settings.timer_length as u64);
        self.revision += 1;
    }
}
impl App {
    /// Read-only hover forecast, using the exact same movement/obstacle/capture engine.
    pub fn preview(&self, request: PreviewRequest) -> PreviewReply {
        let result = (|| {
            let rooms = self.inner.lock().unwrap();
            let room = rooms.get(&request.room).ok_or("Room not found")?;
            let seat = room
                .seats
                .iter()
                .find(|s| s.token == request.token)
                .ok_or("Invalid session")?;
            if room.revision != request.revision {
                return Err("State changed; try again".into());
            }
            let game = room.game.as_ref().ok_or("Game has not started")?;
            if game.enemy_turn() || (!room.solo && game.player_id != seat.color) {
                return Err("It is not your turn".into());
            }
            let mut forecast = game.clone();
            let frames = forecast.apply_with_frames(&Move::Play {
                card: request.card,
                color: game.player_id,
            })?;
            let steps = frames[..frames.len() - 1]
                .iter()
                .map(|frame| {
                    frame
                        .pieces
                        .iter()
                        .filter(|p| p.kind == game.player_id + 1)
                        .cloned()
                        .collect()
                })
                .collect();
            Ok(CardPreview {
                revision: request.revision,
                card: request.card,
                steps,
            })
        })();
        match result {
            Ok(preview) => PreviewReply {
                preview: Some(preview),
                error: None,
            },
            Err(error) => PreviewReply {
                preview: None,
                error: Some(error),
            },
        }
    }
    pub fn command(&self, c: Command) -> Reply {
        match self.execute(c) {
            Ok(r) => r,
            Err(e) => Reply::error(e),
        }
    }
    fn execute(&self, mut c: Command) -> Result<Reply, String> {
        let mut rooms = self.inner.lock().unwrap();
        if let Command::Create {
            name: n,
            solo,
            settings,
        } = c
        {
            validate(&settings)?;
            let n = name(&n)?;
            let t = token();
            let mut code;
            loop {
                code = Uuid::new_v4().simple().to_string()[..6].to_uppercase();
                if !rooms.contains_key(&code) {
                    break;
                }
            }
            let room = Room {
                seats: vec![Seat {
                    token: t.clone(),
                    name: n,
                    color: 0,
                    seen: Instant::now(),
                }],
                settings,
                game: None,
                revision: 0,
                deadline: Instant::now(),
                busy: false,
                frames: vec![],
                solo,
                touched: Instant::now(),
            };
            let snapshot = room.snapshot(&code, 0);
            rooms.insert(code, room);
            return Ok(Reply {
                snapshot: Some(snapshot),
                token: Some(t),
                error: None,
            });
        }
        if let Command::Join {
            room, token: None, ..
        } = &c
        {
            let code = room.trim().to_uppercase();
            let r = rooms.get(&code).ok_or("Room not found")?;
            if r.seats
                .iter()
                .any(|s| s.seen.elapsed() >= Duration::from_secs(5))
            {
                c = Command::Rejoin {
                    room: code,
                    name: None,
                };
            }
        }
        if let Command::Rejoin {
            room: code,
            name: n,
        } = c
        {
            let code = code.trim().to_uppercase();
            let r = rooms.get_mut(&code).ok_or("Room not found")?;
            let wanted = n
                .as_deref()
                .map(name)
                .transpose()?
                .map(|n| n.to_lowercase());
            let matches: Vec<_> = r
                .seats
                .iter()
                .enumerate()
                .filter(|(_, s)| wanted.as_ref().is_none_or(|n| s.name.to_lowercase() == *n))
                .collect();
            let available: Vec<_> = matches
                .iter()
                .filter(|(_, s)| s.seen.elapsed() >= Duration::from_secs(5))
                .map(|(i, _)| *i)
                .collect();
            if available.is_empty() {
                return Err(if matches.is_empty() {
                    "No disconnected player has that name"
                } else {
                    "That player is still connected"
                }
                .into());
            }
            if available.len() != 1 {
                return Err(if wanted.is_none() {
                    "Enter your name to rejoin"
                } else {
                    "More than one disconnected player has that name"
                }
                .into());
            }
            let idx = available[0];
            let t = token();
            r.seats[idx].token = t.clone();
            r.seats[idx].seen = Instant::now();
            r.touched = Instant::now();
            r.revision += 1;
            return Ok(Reply {
                snapshot: Some(r.snapshot(&code, idx)),
                token: Some(t),
                error: None,
            });
        }
        if let Command::Join {
            room: code,
            name: n,
            token: resume,
        } = c
        {
            let code = code.trim().to_uppercase();
            let r = rooms.get_mut(&code).ok_or("Room not found")?;
            if let Some(t) = resume {
                if let Some(idx) = r.seats.iter().position(|s| s.token == t) {
                    r.seats[idx].seen = Instant::now();
                    r.touched = Instant::now();
                    return Ok(Reply {
                        snapshot: Some(r.snapshot(&code, idx)),
                        token: Some(t),
                        error: None,
                    });
                }
            }
            if r.game.is_some() {
                return Err("This game is in progress; use your saved session to reconnect".into());
            }
            if r.seats.len() == 4 || r.solo {
                return Err("This room is full".into());
            }
            let color = (0..4)
                .find(|c| r.seats.iter().all(|p| p.color != *c))
                .unwrap();
            let t = token();
            r.seats.push(Seat {
                token: t.clone(),
                name: name(&n)?,
                color,
                seen: Instant::now(),
            });
            r.revision += 1;
            r.touched = Instant::now();
            return Ok(Reply {
                snapshot: Some(r.snapshot(&code, r.seats.len() - 1)),
                token: Some(t),
                error: None,
            });
        }
        let (code, t) = match &c {
            Command::Get { room, token }
            | Command::Configure { room, token, .. }
            | Command::Start { room, token }
            | Command::Move { room, token, .. }
            | Command::Leave { room, token } => (room.clone(), token.clone()),
            _ => unreachable!(),
        };
        let r = rooms.get_mut(&code).ok_or("Room not found")?;
        let idx = r
            .seats
            .iter()
            .position(|s| s.token == t)
            .ok_or("Invalid session")?;
        r.seats[idx].seen = Instant::now();
        r.touched = Instant::now();
        match c {
            Command::Get { .. } => {}
            Command::Configure {
                name: n,
                color,
                settings,
                solo,
                ..
            } => {
                if r.game.is_some() {
                    return Err("Game already started".into());
                }
                if color > 3
                    || r.seats
                        .iter()
                        .enumerate()
                        .any(|(i, p)| i != idx && p.color == color)
                {
                    return Err("Color is taken".into());
                }
                let n = name(&n)?;
                if let Some(solo) = solo {
                    if idx != 0 || (solo && r.seats.len() != 1) {
                        return Err("Only the host of an empty lobby can enable solo mode".into());
                    }
                }
                if let Some(s) = settings {
                    if idx != 0 {
                        return Err("Only the host can change settings".into());
                    }
                    validate(&s)?;
                    r.settings = s;
                }
                if let Some(solo) = solo {
                    r.solo = solo;
                }
                r.seats[idx].name = n;
                r.seats[idx].color = color;
                r.revision += 1;
            }
            Command::Start { .. } => {
                if idx != 0 {
                    return Err("Only the host can start".into());
                }
                if r.game.is_some() {
                    return Err("Game already started".into());
                }
                if !r.solo && r.seats.len() != 4 {
                    return Err("Four players are required".into());
                }
                r.game = Some(setup(&r.settings)?);
                r.reset_clock();
            }
            Command::Move {
                revision, action, ..
            } => {
                if revision != r.revision {
                    return Err("State changed; try again".into());
                }
                let g = r.game.as_mut().ok_or("Game has not started")?;
                if g.enemy_turn() || (!r.solo && g.player_id != r.seats[idx].color) {
                    return Err("It is not your turn".into());
                }
                r.frames = g.apply_with_frames(&action)?;
                r.reset_clock();
            }
            Command::Leave { .. } => {
                if r.game.is_none() {
                    r.seats.remove(idx);
                } else {
                    r.seats[idx].seen = Instant::now() - Duration::from_secs(10);
                }
                if r.seats.is_empty() {
                    rooms.remove(&code);
                }
                return Ok(Reply {
                    snapshot: None,
                    token: None,
                    error: None,
                });
            }
            _ => unreachable!(),
        }
        Ok(Reply {
            snapshot: Some(r.snapshot(&code, idx)),
            token: None,
            error: None,
        })
    }
    pub async fn tick(&self) {
        let jobs = {
            let mut rooms = self.inner.lock().unwrap();
            let mut jobs = vec![];
            rooms.retain(|_, r| r.touched.elapsed() < Duration::from_secs(24 * 3600));
            for (code, r) in rooms.iter_mut() {
                let Some(g) = r.game.as_ref() else {
                    continue;
                };
                if g.winner() != 0 || r.busy {
                    continue;
                }
                if g.enemy_turn() {
                    r.busy = true;
                    jobs.push((
                        code.clone(),
                        r.revision,
                        g.clone(),
                        r.settings.difficulty,
                        r.settings.threads,
                    ));
                } else if Instant::now() >= r.deadline {
                    let m = Move::Play {
                        card: 0,
                        color: g.player_id,
                    };
                    r.frames = r.game.as_mut().unwrap().apply_with_frames(&m).unwrap();
                    r.reset_clock();
                }
            }
            jobs
        };
        for (code, revision, g, ms, threads) in jobs {
            let app = self.clone();
            tokio::spawn(async move {
                let result = tokio::task::spawn_blocking(move || {
                    let mut s = Search::new(g, Duration::from_millis(ms as u64), 64);
                    s.threads = threads;
                    s.begin_search()
                })
                .await;
                let mut rooms = app.inner.lock().unwrap();
                if let Some(r) = rooms.get_mut(&code) {
                    r.busy = false;
                    if r.revision == revision {
                        if let Ok(found) = result {
                            r.frames = r
                                .game
                                .as_mut()
                                .unwrap()
                                .apply_with_frames(&found.action)
                                .unwrap_or_default();
                            r.reset_clock();
                        }
                    }
                }
            });
        }
    }
}
async fn command(State(app): State<App>, Json(c): Json<Command>) -> Json<Reply> {
    Json(app.command(c))
}
async fn preview(
    State(app): State<App>,
    Json(request): Json<PreviewRequest>,
) -> Json<PreviewReply> {
    Json(app.preview(request))
}
pub fn router(app: App) -> Router {
    let frontend = std::env::var_os("UDDER_WEB_ROOT")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("frontend/dist"));
    Router::new()
        .route("/api/command", post(command))
        .route("/api/preview", post(preview))
        .fallback_service(
            ServeDir::new(&frontend).not_found_service(ServeFile::new(frontend.join("index.html"))),
        )
        .with_state(app)
}

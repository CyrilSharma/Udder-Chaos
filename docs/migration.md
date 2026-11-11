# C++ to Rust migration

The latest C++ source is the reference, including behavior where the old frontend differed. No alternate JavaScript simulator remains. The old C++ and Node executables are replaced rather than retained as a second live engine.

| C++ | Rust |
| --- | --- |
| Game.h / Game.cpp, `Game::SOA` | `game::Game`, `game::Soa` with four per-color contiguous xs/ys/ss/deads vectors |
| `players`, `enemies`, `impassible`, `cows`, `score_tiles` | Same masks backed by `bitset::Bitset` |
| `cow_respawn[turn % cow_regen_rate]` | Same bitset ring and start-of-turn respawn |
| CardManager.h | `game::Deck`, same queue indices, player/enemy hands, cursor and exchange |
| `make_move`, `play_movement`, `play_player_movement`, `play_enemy_movement`, `purge` | Same named movement passes and SoA compaction; Rust ownership instead of raw pointers |
| `is_jover`, `is_enemy_turn` | `winner`, `enemy_turn` |
| Score.cpp | `search::evaluate`, material/cow weights and C++ accumulated heatmap values retained |
| Search.h / Search.cpp | `search::Search`, iterative deepening and alpha-beta; only completed layers replace the best move |
| Cilk spawn/sync | Scoped root workers, selectable 1–16; isolated game clones and deterministic result collection |
| DynamicBitset.cpp | Bounds-checked `Vec<u64>` words and wordwise operations |
| TestGame.cpp | `tests/game.rs`, including all movement subcases |
| TestSearch.cpp | `tests/search.rs`, original input/output files unchanged |
| Jest init/get tests | `tests/agent.rs`, typed process IO and real state assertions; server round-trip coverage in `tests/server.rs` |
| TestGamePerf.cpp / TestBitset.cpp | `bench game` / `bench bitset`; explicit iteration count |
| Arena.cpp | `arena`, arbitrary typed-JSONL engines, alternating sides and divergence checks |

## Preserved rules

Direction values are the C++ internal convention: 0 right, 1 increasing row (visually down), 2 left, 3 decreasing row (visually up). The old frontend direction inversion is gone at runtime. The historical search fixture loader retains its explicit 1/3 conversion, exactly as TestSearch.cpp did.

Alien colors act in order 0, 1, farmers, 2, 3, farmers. All alien safe-zone colors score cows, matching the C++ score_tiles mask. An attack destroys opposite-team pieces in either direction; same-team colors block movement. Playing a card exchanges it through the C++ queue layout, not the old frontend's alternating deal. Rotation consumes a turn. Sacrifice and jet spawning occur after the turn increments at days_per_round × 6.

Default rules match C++ GameConfig: hand 3, sacrifice 5, regen 15 turns, 5 days per round, goal 10. The unused round_length field, unused attacked arrays, unfinished Zobrist hasher and unused score_estimate helper were removed. Search scores retain the C++ initialization of playereval/enemyeval, including its unusual initial heatmap assignment, to preserve the reference decisions.

## Deliberate differences

- Network input is validated before mutation. The C++ low-level make_move path remains available to tests/search, while the server and agent use validated apply methods. Out-of-turn actions, stale revisions, invalid card indices, occupied/foreign spawn purchases, duplicate colors and unauthorized host operations are rejected.
- SIMD shifts saturate at board edges. Collision correction restores each piece's original coordinate rather than subtracting past zero. This fixes unsigned underflow and order-dependent overlapping positions while preserving the reference movement tests. Cow cargo uses signed 32-bit values rather than wrapping bytes.
- NEON on aarch64 and SSE2 on x86/x86_64 use feature checks and full 16-byte chunks. Other targets and short tails use portable scalar code. Occupancy/score masks stay in the engine. No architecture-specific global compiler flag is required. x86 code is present but execution must be checked on x86 hardware; local validation was on Apple Silicon.
- Root parallelism replaces Cilk subtree parallelism. Scoring is represented consistently from the farmers' perspective; max/min follows the actual team, including consecutive alien turns. Move ordering sorts owned child positions, fixing the C++ helper's pass-by-value no-op. Search quality regression is checked against every original answer.
- A no-jet farmer turn exchanges a card and advances time instead of indexing an empty generated move list.
- Map/card creation occurs once on the Rust server. The original three frontend maps and seven card presets remain. Deck generation uses a documented fixed 32-bit LCG plus Fisher–Yates shuffle; a seed is deterministic in the Rust version but does not recreate historical Mersenne Twister sequences. No client supplies authoritative initialization anymore.
- Server defaults: seed 0, map 0, deck 15, timer 30 seconds, AI budget 1000 ms, depth cap 64, one search worker. The AI budget follows Main.cpp's default; the old frontend used 500 ms. Room settings expose budget and workers.
- Shared state uses Serde-tagged JSON requests over HTTP and generated TypeScript types, replacing Socket.IO event argument tuples and the hand-parsed subprocess protocol. Clients poll every 500 ms; rules run only in Rust. Animation frames are produced by the same movement methods, only for committed moves; search doesn't record frames.
- Menus, controls, settings, tutorial, lobby and end screens are HTML/React. The SVG board uses original sprites and has no rule implementation. Solo play is an explicit room mode. Browser persistence uses session storage for reconnect tokens and local storage for name/audio preferences. Pause opens a menu; server clocks continue running.
- Server rooms are in memory, expire after 24 hours without traffic, and do not survive a server restart. Public deployment and persistence were not part of this local port.

## Existing working-tree edit

Before migration, frontend/src/game/Game.ts contained a one-line change: the sacrifice display read cow_sacrifice instead of cow_regen_rate. The new React display reads the Rust cow_sacrifice value. The exact preexisting patch is preserved in `preexisting-frontend-fix.patch`.

## Historical fixture distinction

All ten fixtures consumed by the latest TestSearch.cpp are executable regression tests with unchanged answers. The older `ai-engine/tests/*.txt` command transcripts are preserved under `tests/fixtures/scripts`, along with all nine maps. They target an earlier protocol: map indices and `turn` were ignored by the latest Main.cpp, some piece counts disagree with the listed pieces, several maps omit alien crews that the latest is_jover requires, and the newest INIT expects an inline board instead of `map:`. They were not an executable Jest/C++ suite in the source we found. They remain historical inputs, not silently rewritten search-answer tests.

`Testcases.md` is retained as the original manual acceptance checklist. Not every timing, sound, visual or online-hosting scenario in that historical document is automated.

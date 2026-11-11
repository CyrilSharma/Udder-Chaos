# Udder Chaos · A Cow Caper

Aliens abduct cows, bank them at portals, and evade the farmers. A cooperative card strategy game for four players, with a solo mode that controls all four alien colors.

The C++ engine is the behavioral reference. The game and AI remain Rust. The browser loads the Rust engine as WebAssembly in a background worker, with SIMD and scalar artifacts. React + TypeScript handle presentation and peer networking. The four players connect through a WebRTC mesh; Cloudflare advertises rooms and coordinates signaling, live presence and host leases in memory. Turn commits and game checkpoints travel over WebRTC; Cloudflare neither stores game turns nor runs the simulation or AI.

## Run

Requires stable Rust, the `wasm32-unknown-unknown` target, and Node 22.12+.

```sh
npm ci
npm --prefix frontend ci
rustup target add wasm32-unknown-unknown
npm run build:web
npm run server
```

Open http://127.0.0.1:3000. For frontend development, keep the room service running and start `npm run dev` (http://127.0.0.1:8000). Both use local Cloudflare Durable Objects through Wrangler. No Cloudflare login is required for local development. The browser build currently supports one AI search worker; native tools retain their selectable worker count.

Choose **Create room** to open the lobby directly, or **Join room** to enter a code or select a listed room. The lobby host can enable **Solo** while alone. Names start from the saved custom name or assigned color and are edited inline; your row appears first. Joining uses one room-code form. One disconnected seat is reclaimed automatically; when several are disconnected, the same form asks for the player's name. Matching is trimmed/case-insensitive, connected seats cannot be reclaimed, and successful recovery rotates the old device credential. Another peer must still hold a started game's checkpoint; abandoned games cannot restart from an invented initial state. Connected lobby owners retain their role while their tab is inactive, and stale signaling sockets reconnect when the app returns. Browser reload restores the private session and validated local checkpoint. Peers exchange game commands and checkpoints directly over ordered WebRTC data channels. Moves are prepared by every connected replica, checked using Rust, and committed only after matching hashes are acknowledged. The host publishes commits over WebRTC after the replicas acknowledge matching hashes. A replacement host first reconciles the surviving peers’ committed checkpoints, including a commit received by only one survivor. Previous host generations cannot commit new moves. Cloudflare retains only a live presence/host lease, not the game head. A ten-second in-memory reconnect grace permits quick refreshes; once everyone is gone, the room cannot be resumed as a saved game. Buying a UFO immediately places it at the current player’s sole portal; an occupied portal disables buying.

## Hosting udder-chaos.org

`wrangler.jsonc` deploys one Worker with static frontend/WASM assets, a room Durable Object namespace and a lobby directory namespace. The namespaces remain SQLite-capable for the Workers Free plan, but new rooms make zero SQL calls. Server-owned WebSocket attachments preserve session metadata and hashed authentication across hibernation while connections exist; they are not saved-game database rows. The directory is an expiring in-memory map, refreshed by active lobbies at most once per minute and rebuilt after eviction. Advertisements expire after three minutes. There are no scheduled cleanup writes, cron jobs, paid databases, server-side searches or containers. Existing Route 53 registration can remain in AWS. Workers custom domains require an active Cloudflare DNS zone: preserve existing records before changing registration nameservers. The custom-domain route for `udder-chaos.org` is active; the Workers.dev address remains available.

After Cloudflare authentication:

```sh
npm run deploy
```

Published November 10, 2026: https://udder-chaos.org and https://udder-chaos.curvytron.workers.dev (version 92e006ba-e999-494f-be98-1f5210d1965b). The Workers and DNS plans remain Free. Route 53 remains the registrar, using `kolton.ns.cloudflare.com` and `sreeni.ns.cloudflare.com`. Cloudflare zone activation, the custom-domain binding, and HTTPS delivery have been verified. No paid plan changes or relay key provisioning have been performed.

Media is served from the game origin, including fonts. The frontend's prebuild/predev step runs `scripts/build-media.mjs`: lossless WebP preserves visible image pixels (retaining the original if smaller), music uses 96 kb/s VBR Opus/WebM with MP3 fallback, and versioned URLs receive one-year immutable caching. Used media totals 3.77 MiB versus 6.11 MiB before compression. Menu audio starts downloading when the app module loads; a bounded queue warms remaining audio and the sprites. Playback shares cached Blob URLs, and original beat grids are computed at build time rather than decoding/analyzing music in the browser. Autoplay is attempted as soon as audio is ready; a click or keypress starts it if the browser blocks audible autoplay. Source recordings and artwork remain intact. The media build needs the root dependencies (`sharp` and `ffmpeg-static`) and a current Node version with TypeScript stripping support (Node 22.18+ or 24+).

Cloudflare STUN is configured by default. To support networks requiring TURN, configure `TURN_KEY_ID` and `TURN_API_TOKEN` as Wrangler secrets. Only authenticated room participants can request expiring credentials, with a per-seat issuance limit; long-lived keys never reach browsers. TURN remains unconfigured until its account/free-tier billing policy is chosen. Direct local WebRTC was tested; cross-network TURN connectivity requires configured credentials and a separate check. Keep the Workers account on its Free plan for hard quota failures instead of automatic paid overages. Provider free allowances and TURN billing are separate from the domain registration.

New rooms use transport version 2. Creation, joining, settings, starting, normal gameplay, host replacement, relay authorization and room expiry perform no database writes. Moves/checkpoints/hash acknowledgements and commits go between peers; lightweight presence and a host-generation lease remain in Cloudflare memory. Peer disagreement pauses advancement, and a new host reconciles peer checkpoints before progressing. A broker connection is still needed for presence/host leases; this is not a design that survives every possible signaling outage indefinitely. Existing pre-update connections can read their old authentication state once and keep running with memory-only coordination, without new SQL writes. Old database records are left untouched for compatibility, not used to revive abandoned rooms. Provider request, duration, asset and optional TURN limits still apply independently of row writes.

Monitor actual Cloudflare row-write usage with `npm run monitor:writes`, or sample once per minute for five minutes with `npm run monitor:writes -- --watch 5`. Add `--json` for JSON Lines output, `--since 2026-11-11T01:00:00Z` for a bounded observation window, or `--room FACFC4` for a room filter. Outbound message totals distinguish observed activity from an empty analytics window. This reads analytics only and adds no game-storage writes. It reports UTC-day (or selected-window) totals, per-room totals, and recent minute counts; delayed or revised analytics are explicitly identified. It uses `CLOUDFLARE_API_TOKEN` if set, otherwise the existing Wrangler OAuth login, without printing credentials. Override the default deployment account with `CLOUDFLARE_ACCOUNT_ID`; `WRANGLER_CONFIG_PATH` can select a different Wrangler credentials file. An inaccessible or truncated metrics result fails instead of being presented as zero usage.

Native HTTP/JSON and standalone AI tools remain available through `npm run server:native` / Cargo for debugging and existing integrations; the new web frontend uses the peer room service.

## Check

```sh
cargo test --release -- --test-threads=1
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm --prefix frontend run build
npm run test:animations
npm run test:multiplayer
npm run check:hosting
```

Release mode matters for the original search fixtures' wall-clock deadlines. The ten original input/output pairs retain their exact expected moves, timeout budgets, and depth limits. `cargo run --bin export-types` regenerates the TypeScript protocol from Rust; a test detects stale bindings.

## Code map

- `src/game.rs`: direct port of Game, per-color SoA, CardManager, movement, collision passes, occupancy masks, cow respawn ring, sacrifice and victory logic.
- `src/bitset.rs`: safe `Vec<u64>` replacement for DynamicBitset.
- `src/simd.rs`: 16-byte NEON/SSE2/WebAssembly coordinate shifts; native runtime dispatch and scalar tails/fallback.
- `src/search.rs`: iterative deepening, alpha-beta, C++ scorer, move ordering, selectable scoped workers and custom scorer.
- `src/server.rs`: retained native authoritative HTTP/JSON backend.
- `src/browser.rs`, `src/setup.rs`, `src/clock.rs`: transactional browser engine, shared deterministic setup, platform clock boundary.
- `frontend/src/multiplayer`: WebAssembly worker bridge, WebRTC mesh, replicated commits and recovery.
- `hosting`: Cloudflare room metadata, host lease fencing, signaling and lobby directory.
- `src/protocol.rs`: Serde messages and generated TypeScript declarations.
- `src/agent.rs`, `src/bin/ai.rs`: typed JSONL interface for standalone AI and arena use.
- `frontend/src`: React presentation and network client.

See [migration notes](docs/migration.md) for the C++ mapping and deliberate differences, and [verification](docs/verification.md) for test coverage.

## AI tools

`cargo build --release --bins` builds all tools. The standalone `ai` executable accepts one Serde `agent::Request` JSON object per line and responds with one `agent::Response`. Query returns a move without applying it; send `advance` to every participating engine to commit it. This replaces the INIT/GET/MOVE key/value protocol.

```sh
cargo run --release --bin arena -- target/release/ai target/release/ai 2
cargo run --release --bin bench -- simd 100000
cargo run --release --bin bench -- game 100000
cargo run --release --bin bench -- bitset 100000
```

Arena accepts two executable paths, alternates sides, checks their snapshots against the authoritative engine after every move, and reports wins/draws. It prints its exact configuration before playing. Bench prints the selected kernel configuration and wall-clock timing; its iteration count is explicit. `bench game 10000000` matches the old movement benchmark's iteration count.

## Attribution

Original Udder Chaos artwork, maps, and sound effects are retained. Music by Eric Matyas, [soundimage.org](https://soundimage.org).

Music playback reuses one media element across screens, resumes on foreground/pageshow/focus or the next interaction when required by browser autoplay policy, and recovers stalled decoders without changing explicit pause intent. Persistent decode failures can fall back to the original MP3. The muted music preview includes interruption/app-return controls. Actual iPhone Safari hardware still needs user confirmation; desktop simulated interruption tests are not an iOS certification. The visible footer restores the original Eric Matyas / soundimage.org music credit.

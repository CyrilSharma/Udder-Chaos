# Udder Chaos frontend

React + TypeScript presentation for the authoritative Rust server. The SVG board renders snapshots and per-arrow frames produced by Rust. Menus, lobby, cards, settings and dialogs use HTML controls.

From the repository root:

```sh
npm --prefix frontend ci
cargo run --bin export-types
npm --prefix frontend run build
cargo run --release
```

For hot reload, keep the Rust server on 127.0.0.1:3000 and run `npm run dev`. Open http://127.0.0.1:8000. The generated protocol types live in src/protocol.ts; edit the Rust types and run the export command to regenerate them.

See ../README.md and ../docs/migration.md for rules, SIMD, tests and protocol details.


The UI uses the original bright countryside artwork, Concert One headings, white cards and yellow controls. UI dialogue is user-owned: preserve existing wording unless a wording change is explicitly requested. The current end-state wording changes are limited to the requested sacrifice/farmer outcomes. Cinematic preview and asset-generation details are in ../docs/verification.md and ../docs/generated-assets.md.

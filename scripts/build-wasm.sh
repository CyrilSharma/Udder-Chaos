#!/bin/sh
set -eu
mkdir -p frontend/public/engine
RUSTFLAGS='-C target-feature=-simd128' cargo build --lib --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/udder_chaos.wasm frontend/public/engine/scalar.wasm
RUSTFLAGS='-C target-feature=+simd128' cargo build --lib --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/udder_chaos.wasm frontend/public/engine/simd.wasm

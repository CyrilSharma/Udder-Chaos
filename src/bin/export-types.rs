fn main() {
    let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("frontend/src/protocol.ts");
    std::fs::write(path, udder_chaos::protocol::typescript()).unwrap();
}

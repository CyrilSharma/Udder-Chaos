use udder_chaos::server::{router, App};
#[tokio::main]
async fn main() {
    let app = App::default();
    let worker = app.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(100));
        loop {
            interval.tick().await;
            worker.tick().await;
        }
    });
    let bind = std::env::var("UDDER_BIND").unwrap_or("127.0.0.1:3000".into());
    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .expect("Could not bind UDDER_BIND");
    println!("Udder Chaos listening on http://{bind}");
    axum::serve(listener, router(app)).await.unwrap();
}

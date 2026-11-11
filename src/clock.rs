#[cfg(not(target_arch = "wasm32"))]
pub use std::time::Instant;

#[cfg(target_arch = "wasm32")]
#[derive(Clone, Copy, PartialEq, PartialOrd)]
pub struct Instant(f64);
#[cfg(target_arch = "wasm32")]
#[link(wasm_import_module = "udder")]
extern "C" {
    fn now() -> f64;
}
#[cfg(target_arch = "wasm32")]
impl Instant {
    pub fn now() -> Self {
        // SAFETY: the browser worker provides the monotonic performance.now import.
        Self(unsafe { now() })
    }
    pub fn elapsed(self) -> std::time::Duration {
        std::time::Duration::from_secs_f64(((Self::now().0 - self.0) / 1000.0).max(0.0))
    }
}
#[cfg(target_arch = "wasm32")]
impl std::ops::Add<std::time::Duration> for Instant {
    type Output = Self;
    fn add(self, rhs: std::time::Duration) -> Self {
        Self(self.0 + rhs.as_secs_f64() * 1000.0)
    }
}

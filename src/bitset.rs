//! Replacement for DynamicBitset.cpp. The final word is always masked.
use serde::Serialize;
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Bitset {
    pub blocks: Vec<u64>,
    pub size: usize,
}
impl Bitset {
    pub fn new(size: usize) -> Self {
        Self {
            blocks: vec![0; size.div_ceil(64)],
            size,
        }
    }
    pub fn get(&self, i: usize) -> bool {
        i < self.size && self.blocks[i / 64] >> (i % 64) & 1 != 0
    }
    pub fn set(&mut self, i: usize, value: bool) {
        assert!(i < self.size);
        let mask = 1u64 << (i % 64);
        if value {
            self.blocks[i / 64] |= mask;
        } else {
            self.blocks[i / 64] &= !mask;
        }
    }
    pub fn reset(&mut self) {
        self.blocks.fill(0);
    }
    pub fn count(&self) -> usize {
        self.blocks.iter().map(|v| v.count_ones() as usize).sum()
    }
    pub fn union(&mut self, other: &Self) {
        for (a, b) in self.blocks.iter_mut().zip(&other.blocks) {
            *a |= b;
        }
    }
    pub fn intersection(&self, other: &Self) -> Self {
        let mut out = self.clone();
        for (a, b) in out.blocks.iter_mut().zip(&other.blocks) {
            *a &= b;
        }
        out
    }
    pub fn subtract(&mut self, other: &Self) {
        for (a, b) in self.blocks.iter_mut().zip(&other.blocks) {
            *a &= !b;
        }
    }
}

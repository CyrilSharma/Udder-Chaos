//! Contiguous byte coordinate updates, matching Game.cpp's vectorized shift pass.
//! Safety: only full 16-byte chunks enter intrinsics; tails always use scalar code.
#[inline]
pub fn scalar_step(pos: &mut [u8], positive: bool, bound: u8) {
    for p in pos {
        if positive {
            *p = p.saturating_add(1).min(bound);
        } else {
            *p = p.saturating_sub(1);
        }
    }
}
#[inline]
pub fn step(pos: &mut [u8], positive: bool, bound: u8) {
    #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
    {
        // SAFETY: this artifact requires simd128; the loader validates support first.
        unsafe {
            wasm_step(pos, positive, bound);
        }
        return;
    }
    #[cfg(target_arch = "aarch64")]
    if std::arch::is_aarch64_feature_detected!("neon") {
        // SAFETY: runtime feature check; implementation checks all memory bounds.
        unsafe {
            neon_step(pos, positive, bound);
        }
        return;
    }
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    if std::is_x86_feature_detected!("sse2") {
        // SAFETY: runtime feature check; implementation checks all memory bounds.
        unsafe {
            sse_step(pos, positive, bound);
        }
        return;
    }
    #[cfg(not(all(target_arch = "wasm32", target_feature = "simd128")))]
    scalar_step(pos, positive, bound);
}
#[cfg(target_arch = "aarch64")]
#[target_feature(enable = "neon")]
#[inline]
unsafe fn neon_step(pos: &mut [u8], positive: bool, bound: u8) {
    use std::arch::aarch64::*;
    let mut chunks = pos.chunks_exact_mut(16);
    for c in &mut chunks {
        let v = vld1q_u8(c.as_ptr());
        let out = if positive {
            vminq_u8(vqaddq_u8(v, vdupq_n_u8(1)), vdupq_n_u8(bound))
        } else {
            vqsubq_u8(v, vdupq_n_u8(1))
        };
        vst1q_u8(c.as_mut_ptr(), out);
    }
    scalar_step(chunks.into_remainder(), positive, bound);
}
#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
#[target_feature(enable = "sse2")]
#[inline]
unsafe fn sse_step(pos: &mut [u8], positive: bool, bound: u8) {
    #[cfg(target_arch = "x86")]
    use std::arch::x86::*;
    #[cfg(target_arch = "x86_64")]
    use std::arch::x86_64::*;
    let mut chunks = pos.chunks_exact_mut(16);
    for c in &mut chunks {
        let v = _mm_loadu_si128(c.as_ptr().cast());
        let out = if positive {
            _mm_min_epu8(
                _mm_adds_epu8(v, _mm_set1_epi8(1)),
                _mm_set1_epi8(bound as i8),
            )
        } else {
            _mm_subs_epu8(v, _mm_set1_epi8(1))
        };
        _mm_storeu_si128(c.as_mut_ptr().cast(), out);
    }
    scalar_step(chunks.into_remainder(), positive, bound);
}

#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
unsafe fn wasm_step(pos: &mut [u8], positive: bool, bound: u8) {
    use core::arch::wasm32::*;
    let mut chunks = pos.chunks_exact_mut(16);
    for c in &mut chunks {
        // SAFETY: each chunk contains exactly one complete 16-byte vector.
        let v = v128_load(c.as_ptr().cast());
        let out = if positive {
            u8x16_min(u8x16_add_sat(v, u8x16_splat(1)), u8x16_splat(bound))
        } else {
            u8x16_sub_sat(v, u8x16_splat(1))
        };
        v128_store(c.as_mut_ptr().cast(), out);
    }
    scalar_step(chunks.into_remainder(), positive, bound);
}

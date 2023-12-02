#include "DynamicBitset.h"
#include <iostream>
using namespace std;

#define NBLOCKS ((size + 64ULL - 1ULL) / 64ULL)

dynamic_bitset::dynamic_bitset(): size(0) {}

dynamic_bitset::dynamic_bitset(int32_t size, int64_t val) : size(size) {
  blocks.resize(NBLOCKS);
  blocks[0] = val;
  for (uint32_t i = 1; i < NBLOCKS; i++)
    blocks[i] = 0;
}

dynamic_bitset::dynamic_bitset(const dynamic_bitset& other) {
  size = other.size;
  blocks.resize(NBLOCKS);
  for (size_t i = 0; i < blocks.size(); i++) {
    blocks[i] = other.blocks[i];
  }
}

bool dynamic_bitset::any() const {
  for (size_t i = 0; i < blocks.size(); i++) {
    if (blocks[i]) return true;
  }
  return false;
}

int dynamic_bitset::count() const {
  int sum = 0;
  for (size_t i = 0; i < blocks.size(); i++) {
    sum += __builtin_popcountll(blocks[i]);
  }
  return sum;
}

bool dynamic_bitset::get(int32_t index) const {
  return (blocks[index / 64] >> (index % 64)) & 1;
}

void dynamic_bitset::set(int32_t index, bool b) {
  blocks[index / 64] &= ~(1LL << (index % 64));
  blocks[index / 64] |= ((1LL * b) << (index % 64));
}

void dynamic_bitset::reset() {
  for (size_t i = 0; i < blocks.size(); i++) {
    blocks[i] = 0;
  }
}

/** In-Place Methods **/
dynamic_bitset& dynamic_bitset::operator=(const dynamic_bitset& other) {
  size = other.size;
  blocks = other.blocks;
  for (uint32_t i = 0; i < blocks.size(); i++) {
    blocks[i] = other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator|=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < blocks.size(); i++) {
    blocks[i] |= other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator&=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < blocks.size(); i++) {
    blocks[i] &= other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator^=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < blocks.size(); i++) {
    blocks[i] ^= other.blocks[i];
  }
  return *this;
}

/** Allocating Methods (these don't affect the internal state of bitset) **/
bool dynamic_bitset::operator[](int32_t index) const {
  return (blocks[index / 64] >> (index % 64)) & 1;
}

dynamic_bitset dynamic_bitset::operator&(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < blocks.size(); i++) {
    ret.blocks[i] = (blocks[i] & other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator|(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < blocks.size(); i++) {
    ret.blocks[i] = (blocks[i] | other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator^(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < blocks.size(); i++) {
    ret.blocks[i] = (blocks[i] ^ other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator~() const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < blocks.size(); i++) {
    ret.blocks[i] = ~blocks[i];
  }
  return ret;
}

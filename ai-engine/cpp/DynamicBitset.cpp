#include "DynamicBitset.h"
#include <iostream>
using namespace std;

#define NBLOCKS ((size + sizeof(int64_t) - 1) / sizeof(int64_t))

dynamic_bitset::dynamic_bitset() {}

dynamic_bitset::dynamic_bitset(int32_t size, int64_t val) : size(size) {
  blocks = new int64_t[NBLOCKS];
  reset();
  blocks[0] = val;
}

dynamic_bitset::dynamic_bitset(const dynamic_bitset& other) {
  size = other.size;
  blocks = new int64_t[NBLOCKS];
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] = other.blocks[i];
  }
}

dynamic_bitset::~dynamic_bitset() {
  if (blocks) delete[] blocks;
}

int dynamic_bitset::count() const {
  int sum = 0;
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    sum += __builtin_popcount(blocks[i]);
  }
  return sum;
}

bool dynamic_bitset::get(int32_t index) const {
  return (blocks[index / sizeof(int64_t)] >> (index % sizeof(int64_t))) & 1;
}

void dynamic_bitset::set(int32_t index, bool b) {
  blocks[index / sizeof(int64_t)] &= ~(1 << (index % sizeof(int64_t)));
  blocks[index / sizeof(int64_t)] |= (b << (index % sizeof(int64_t)));
}

void dynamic_bitset::reset() {
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] = 0;
  }
}

/** In-Place Methods **/
dynamic_bitset& dynamic_bitset::operator=(const dynamic_bitset& other) {
  size = other.size;
  blocks = new int64_t[size];
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] = other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator|=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] |= other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator&=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] &= other.blocks[i];
  }
  return *this;
}

dynamic_bitset& dynamic_bitset::operator^=(const dynamic_bitset& other) {
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blocks[i] ^= other.blocks[i];
  }
  return *this;
}

/** Allocating Methods (these don't affect the internal state of bitset) **/
bool dynamic_bitset::operator[](int32_t index) const {
  return (blocks[index / sizeof(int64_t)] >> (index % sizeof(int64_t))) & 1;
}

dynamic_bitset dynamic_bitset::operator&(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    ret.blocks[i] = (blocks[i] & other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator|(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    ret.blocks[i] = (blocks[i] | other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator^(const dynamic_bitset& other) const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    ret.blocks[i] = (blocks[i] ^ other.blocks[i]);
  }
  return ret;
}

dynamic_bitset dynamic_bitset::operator~() const {
  dynamic_bitset ret(size, 0);
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    ret.blocks[i] = ~blocks[i];
  }
  return ret;
}

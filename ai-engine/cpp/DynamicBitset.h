#pragma once
#include <cinttypes>
struct dynamic_bitset {
  int32_t size = 0;
  int64_t *blocks = nullptr;
  dynamic_bitset();
  dynamic_bitset(int32_t size, int64_t val=0);
  dynamic_bitset(const dynamic_bitset& other);
  ~dynamic_bitset();

  int count() const;
  bool get(int32_t index) const;
  void set(int32_t index, bool b);
  void reset();

  dynamic_bitset& operator=(const dynamic_bitset& other);
  dynamic_bitset& operator|=(const dynamic_bitset& other);
  dynamic_bitset& operator&=(const dynamic_bitset& other);
  dynamic_bitset& operator^=(const dynamic_bitset& other);

  bool operator[](int32_t index) const;
  dynamic_bitset operator|(const dynamic_bitset& other) const;
  dynamic_bitset operator&(const dynamic_bitset& other) const;
  dynamic_bitset operator^(const dynamic_bitset& other) const;

  dynamic_bitset operator~() const;
};
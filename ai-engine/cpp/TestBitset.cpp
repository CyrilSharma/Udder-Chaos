#include <assert.h>
#include <bits/stdc++.h>
#include <boost/dynamic_bitset.hpp>
#include "CardQueue.h"
#include "Game.h"
#include "Utils.h"

int func1(int);
int func2(int);
int func3(int);

using dynamic_int = uint64_t;
const int n = 1e8;
const int num_ints = 4;

int main() {
  
  // Measure the execution time of func1
  auto start_time = std::chrono::high_resolution_clock::now();
  func1(n);
  auto end_time = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double> elapsed_time = end_time - start_time;
  std::cout << "integer: " << elapsed_time.count() << " seconds" << std::endl;

  // Measure the execution time of func2
  start_time = std::chrono::high_resolution_clock::now();
  func2(n);
  end_time = std::chrono::high_resolution_clock::now();
  elapsed_time = end_time - start_time;
  std::cout << "stl bitset: " << elapsed_time.count() << " seconds" << std::endl;

  // Measure the execution time of func3
  start_time = std::chrono::high_resolution_clock::now();
  func3(n);
  end_time = std::chrono::high_resolution_clock::now();
  elapsed_time = end_time - start_time;
  std::cout << "boost bitset: " << elapsed_time.count() << " seconds" << std::endl;
}

int func1(int n) {
  uint64_t x = 0; 
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < num_ints; j++) {
      x |= (1 << (rand() % 64));
    }
  }
  return x;
}

int func2(int n) {
  std::bitset<64 * num_ints> x { 0 };
  std::bitset<64 * num_ints> m { 1 };
  for (int i = 0; i < n; i++) {
    x |= m << (rand() % 64);
  }
  return x.to_ulong();
}

int func3(int n) {
  boost::dynamic_bitset<dynamic_int> x(64 * num_ints, 0);
  boost::dynamic_bitset<dynamic_int> m(64 * num_ints, 1);
  for (int i = 0; i < n; i++) {
    x |= m << (rand() % 64);
  }
  return x.to_ulong();
}
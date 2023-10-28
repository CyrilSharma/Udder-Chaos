#pragma once
#include <bitset>
using namespace std;

// This should be in a .cpp file. 
template <int64_t elements, int64_t bits_per>
struct CardQueue {
  static constexpr int queue_length() { return bits_per * elements; }
  static constexpr bitset<queue_length()> top_mask() {
    return bitset<queue_length()> { (1ULL << bits_per) - 1};
  }
  int reserve = 0;
  bitset<queue_length()> queue = { 0 };
  CardQueue(int r): reserve(r) {}

  /*
   * Send an element from the reserve back.
   */

  int choose(int choice) {
    int used_idx = get(choice);
    int new_idx = get(reserve);
    bitset<queue_length()> m { (1ULL << reserve) - 1 };
    queue = ((queue >> bits_per) & ~m) | (queue & m);
    set(choice, new_idx);
    set(elements - 1, used_idx);
    return used_idx;
  } /* choose() */

  /*
   * finds the card index corresponding 
   * to your choice in the queue.
   */

  int get(int choice) {
    auto m = (queue >> (choice * bits_per) & top_mask());
    return m.to_ullong();
  } /* get() */

  /*
   * sets the specified index in the queue.
   * assume the value is in range.
   */

  void set(int choice, uint64_t value) {
    bitset<queue_length()> b { value };
    queue &= ~(top_mask() << (choice * bits_per));
    queue |= (b << (choice * bits_per));
  } /* set() */
};
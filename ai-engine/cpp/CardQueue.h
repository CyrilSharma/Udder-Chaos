#pragma once
#include <boost/dynamic_bitset.hpp>
using dynamic_bitset = boost::dynamic_bitset<>;

struct CardQueue {
  int queue_length() {
    return bits_per * elements;
  }

  const dynamic_bitset top_mask() {
    return dynamic_bitset(
      queue_length(),
      (1ULL << bits_per) - 1
    );
  }

  dynamic_bitset queue;
  int elements, bits_per, reserve;
  CardQueue(int nel, int nbits, int reserve):
    elements(nel), bits_per(nbits),
    reserve(reserve) {
    queue = dynamic_bitset(queue_length());
  }

  /*
   * Send an element from the reserve back.
   */

  int choose(int choice) {
    int used_idx = get(choice);
    int new_idx = get(reserve);
    dynamic_bitset m(queue_length(), (1ULL << (reserve * bits_per)) - 1);
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
    return m.to_ulong();
  } /* get() */

  /*
   * sets the specified index in the queue.
   * assume the value is in range.
   */

  void set(int choice, uint64_t value) {
    dynamic_bitset b(queue_length(), value);
    queue &= ~(top_mask() << (choice * bits_per));
    queue |= (b << (choice * bits_per));
  } /* set() */
};
#pragma once
#include "Helpers.h"

#define QSIZE ((int) (cards.size() - 2 * handsize))

struct CardManager {
  vector<Card> cards;
  vector<int> queue, phand, ehand;
  int handsize, cur;
  CardManager(vector<Card> cards, int handsize):
    cards(cards), handsize(handsize) {
    queue.resize(QSIZE);
    phand.resize(handsize);
    ehand.resize(handsize);
    for (int i = 0; i < QSIZE; i++) queue[i] = i;
    for (int i = 0; i < handsize; i++) {
      phand[i] = (i + QSIZE);
      ehand[i] = (i + QSIZE + handsize);
    }
    cur = 0;
  }

  Card pchoose(int choice) {
    int temp = phand[choice];
    phand[choice] = queue[cur];
    queue[cur] = temp;
    cur = (cur + 1) % QSIZE;
    return cards[temp];
  }

  Card echoose(int choice) {
    int temp = ehand[choice];
    ehand[choice] = queue[cur];
    queue[cur] = temp;
    cur = (cur + 1) % QSIZE;
    return cards[temp];
  }

  Card pview(int choice) {
    return cards[phand[choice]];
  }
  
  Card eview(int choice) {
    return cards[ehand[choice]];
  }

  // Need to validate with frontend.
  void rotate(int choice, int rotation) {
    vector<Direction> dirs = {
      Direction::RIGHT, Direction::UP,
      Direction::LEFT, Direction::DOWN,
    };
    int index = phand[choice];
    for (Direction &move: cards[index].moves) {
      move = dirs[(4 + move - rotation) & 0b11];
    }
  }
};
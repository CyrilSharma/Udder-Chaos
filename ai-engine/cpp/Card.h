#pragma once
#include <vector>

using namespace std;

enum Direction {
  RIGHT = 0,
  UP = 1,
  LEFT = 2,
  DOWN = 3
};

struct Card {
  vector<Direction> moves;
}
#pragma once
#include <bitset>
#include <vector>
using namespace std;

// Don't mess with the values here.
enum Direction {
  RIGHT = 0,
  UP = 1,
  LEFT = 2,
  DOWN = 3
};

struct Card {
  std::vector<Direction> moves;
  bool operator==(const Card& other) const {
    return moves == other.moves;
  }
  bool operator!=(const Card& other) const {
    return moves != other.moves;
  }
};
ostream& operator<<(ostream& os, const Card& card) {
  os << "Card: ";
  for (auto move: card.moves) {
    switch (move) {
      case RIGHT: { os << 'R'; break; }
      case UP:    { os << 'U'; break; }
      case LEFT:  { os << 'L'; break; }
      case DOWN:  { os << 'D'; break; }
    }
  }
  os << '\n';
  return os;
}

struct Piece {
  int i, j, tp;
  bool operator==(const Piece& other) const {
    return i == other.i && j == other.j
      && tp == other.tp;
  }
  bool operator!=(const Piece& other) const {
    return !(*this == other);
  }
};
ostream& operator<<(ostream& os, const Piece& p) {
  os << "Piece: ( " << p.i << ", " << p.j << ", " << p.tp << " )\n";
  return os;
}

struct GameConfig {
  vector<vector<int>> board;
  vector<Piece> pieces;
  vector<Card> cards;
};
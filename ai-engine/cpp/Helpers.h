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
  int i, j, tp, score;
  Piece(): i(0), j(0), tp(0), score(0) {}
  Piece(int i, int j, int tp, int score = 0) :
    i(i), j(j), tp(tp), score(score) {}
  bool operator==(const Piece& other) const {
    return i == other.i && j == other.j
      && tp == other.tp && score == other.score;
  }
  bool operator!=(const Piece& other) const {
    return !(*this == other);
  }
};
ostream& operator<<(ostream& os, const Piece& p) {
  os << "Piece: ( " << p.i << ", " << p.j << ", "
    << p.tp << ", " << p.score << " )\n";
  return os;
}

struct GameConfig {
  vector<vector<int>> board;
  vector<Piece> pieces;
  vector<Card> cards;
};
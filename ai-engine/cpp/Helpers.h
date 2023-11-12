#pragma once
#include <vector>
using namespace std;

// Don't mess with the values here.
enum Direction {
  RIGHT = 0,
  UP = 1,
  LEFT = 2,
  DOWN = 3
};

enum TileType {
  PLAIN = 0,
  COW = 1,
  IMPASSIBLE = 2,
  SCORE = 3
};

struct Card {
  std::vector<Direction> moves;
  bool operator==(const Card& other) const {
    return moves == other.moves;
  }
  bool operator!=(const Card& other) const {
    return moves != other.moves;
  }
  bool operator<(const Card& other) const {
    return moves < other.moves;
  }
  
  // Get 'hash' of card, based on the moves it does
  // assumes cards have less than 32 moves in them, and that all cards have the same length.
  // oh and also that directions are just 0-3
  uint64_t getID() {
    uint64_t val = 0, pow = 1;
    for (auto move : moves) {
      val += move * pow;
      pow *= 4;
    }
    return val;
  }

  // Helper for hashing to know max possible id of a card
  // Assumes cards have less than 32 moves again
  uint64_t getMaxID() {
    return 1ULL << (2 * moves.size());
  }
};

ostream& operator<<(ostream& os, const Card& card) {
  os << "Card: ";
  for (auto move: card.moves) {
    switch (move) {
      // Reverse down and up for consistency with clientside o.o
      case RIGHT: { os << 'R'; break; }
      case UP:    { os << 'D'; break; }
      case LEFT:  { os << 'L'; break; }
      case DOWN:  { os << 'U'; break; }
    }
  }
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

struct Move {
  int card;
  int color;
};

struct GameConfig {
  vector<vector<int>> board;
  vector<Piece> pieces;
  vector<Card> cards;
  int hand_size;
  int round_length;
  GameConfig(
    vector<vector<int>> board,
    vector<Piece> pieces,
    vector<Card> cards,
    int hand_size = 3,
    int round_length = 6
  ): board(board), pieces(pieces),
     cards(cards), hand_size(hand_size),
     round_length(round_length) {}
};

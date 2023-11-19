#include "Helpers.h"


std::vector<Direction> moves;
bool Card::operator==(const Card& other) const {
  return moves == other.moves;
}
bool Card::operator!=(const Card& other) const {
  return moves != other.moves;
}
bool Card::operator<(const Card& other) const {
  return moves < other.moves;
}

// Get 'hash' of card, based on the moves it does
// assumes cards have less than 32 moves in them, and that all cards have the same length.
// oh and also that directions are just 0-3
uint64_t Card::getID() {
  uint64_t val = 0, pow = 1;
  for (auto move : moves) {
    val += move * pow;
    pow *= 4;
  }
  return val;
}

// Helper for hashing to know max possible id of a card
// Assumes cards have less than 32 moves again
uint64_t Card::getMaxID() {
  return 1ULL << (2 * moves.size());
}


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


Piece::Piece(): i(0), j(0), tp(0), score(0) {}
Piece::Piece(int i, int j, int tp, int score) :
  i(i), j(j), tp(tp), score(score) {}
bool Piece::operator==(const Piece& other) const {
  return i == other.i && j == other.j
    && tp == other.tp && score == other.score;
}
bool Piece::operator!=(const Piece& other) const {
  return !(*this == other);
}

ostream& operator<<(ostream& os, const Piece& p) {
  os << "Piece: ( " << p.i << ", " << p.j << ", "
    << p.tp << ", " << p.score << " )\n";
  return os;
}


Move::Move(int card, int color):
  card(card), color(color) {}

GameConfig::GameConfig(
  vector<vector<int>> board,
  vector<Piece> pieces,
  vector<Card> cards,
  int hand_size,
  int round_length
): board(board), pieces(pieces),
    cards(cards), hand_size(hand_size),
    round_length(round_length) {}

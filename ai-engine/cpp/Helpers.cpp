#include "Helpers.h"

Tile::Tile(): category(TileType::PLAIN), player(0), color(0) {}
Tile::Tile(TileType cat, int player, int color):
  category(cat), player(player), color(color) {}
Tile Tile::from(int value) {
  using T = TileType;
  switch (value) {
    case 0:  return Tile(T::PLAIN);
    case 1:  return Tile(T::COW);
    case 2:  return Tile(T::IMPASSIBLE);
    case 3:  return Tile(T::SPAWN, 1, 0);
    case 4:  return Tile(T::SPAWN, 1, 1);
    case 5:  return Tile(T::SPAWN, 1, 2);
    case 6:  return Tile(T::SPAWN, 1, 3);
    case 7:  return Tile(T::SPAWN, 1, 0);
    case 8:  return Tile(T::SPAWN, 1, 1);
    case 9:  return Tile(T::SPAWN, 1, 2);
    case 10: return Tile(T::SPAWN, 1, 3);
    case 11: return Tile(T::SPAWN, 0, 0);
    case 12: return Tile(T::SPAWN, 0, 1);
    case 13: return Tile(T::SPAWN, 0, 2);
    case 14: return Tile(T::SPAWN, 0, 3);
    default: 
      cerr << "Unknown Tile, exiting\n";
      exit(1);
  };
}
bool Tile::operator==(const Tile& other) const {
  return (category == other.category)
         && (player == other.player)
         && (color == other.color);
}
bool Tile::operator!=(const Tile& other) const {
   return !(*this == other);
}


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


Move::Move(MoveType type, int arg1, int arg2):
  type(type), card(arg1), color(arg2),
  x(arg1), y(arg2), angle(arg2) {}

string typeOfMove(MoveType t) {
  switch(t) {
    case NONE:   return "No move";
    case NORMAL: return "Normal";
    case ROTATE: return "Rotate";
    case BUY:    return "Buy";
    default:     return "Unknown Type";
  }
}


GameConfig::GameConfig(
  vector<vector<Tile>> board,
  vector<Piece> pieces,
  vector<Card> cards,
  int hand_size,
  int round_length,
  string id
): board(board), pieces(pieces),
   cards(cards), hand_size(hand_size),
   round_length(round_length), id(id)  {}

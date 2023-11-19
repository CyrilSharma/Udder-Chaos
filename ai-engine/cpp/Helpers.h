#pragma once
#include <vector>
#include <iostream>
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

enum MoveType {
  NONE = -1,
  NORMAL = 0,
  ROTATE = 1,
  BUY = 2
};

struct Card {
  std::vector<Direction> moves;
  bool operator==(const Card& other) const;
  bool operator!=(const Card& other) const;
  bool operator<(const Card& other) const;
  uint64_t getID();
  uint64_t getMaxID();
};
ostream& operator<<(ostream& os, const Card& card);

struct Piece {
  int i, j, tp, score;
  Piece();
  Piece(int i, int j, int tp, int score = 0);
  bool operator==(const Piece& other) const;
  bool operator!=(const Piece& other) const;
};
ostream& operator<<(ostream& os, const Piece& p);


struct Move {
  MoveType type;
  int card, color, x, y, angle;
  Move(MoveType type, int arg1=-1, int arg2=-1);
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
  );
};

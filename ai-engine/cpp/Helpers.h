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
  unsigned int card: 2;
  unsigned int color: 2;
  unsigned int x: 8;
  unsigned int y: 8;
  unsigned int angle: 2;
  Move(MoveType type, int arg1=0, int arg2=0);
};

string typeOfMove(MoveType t);

struct GameConfig {
  vector<vector<int>> board;
  vector<Piece> pieces;
  vector<Card> cards;
  int hand_size;
  int round_length;
  string id;
  GameConfig(
    vector<vector<int>> board,
    vector<Piece> pieces,
    vector<Card> cards,
    int hand_size = 3,
    int round_length = 6,
    string id = ""
  );
};

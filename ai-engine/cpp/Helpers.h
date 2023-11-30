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
  PLAIN, COW,
  IMPASSIBLE, SPAWN
};
struct Tile {
  TileType category;
  unsigned int player: 1;
  unsigned int color: 2;
  bool operator==(const Tile& other) const;
  bool operator!=(const Tile& other) const;
  Tile(TileType cat, int player = 0, int color = 0);
  static Tile from(int value);
  Tile();
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


// Uses 1-indexing... for some reason
struct Piece {
  int i, j, tp, score;
  Piece();
  Piece(int i, int j, int tp, int score = 0);
  bool operator==(const Piece& other) const;
  bool operator!=(const Piece& other) const;
};
ostream& operator<<(ostream& os, const Piece& p);


enum MoveType {
  NONE = -1,
  NORMAL = 0,
  ROTATE = 1,
  BUY = 2
};

string typeOfMove(MoveType t);

struct Move {
  MoveType type;
  unsigned int card: 2;
  unsigned int color: 2;
  unsigned int x: 8;
  unsigned int y: 8;
  unsigned int angle: 2;
  Move(MoveType type, int arg1=0, int arg2=0);
};

struct GameConfig {
  vector<vector<Tile>> board;
  vector<Piece> pieces;
  vector<Card> cards;
  int hand_size;
  int round_length;
  int cow_sacrifice;
  int cow_regen_rate;
  int days_per_round;
  int score_goal;
  string id;
  GameConfig(
    vector<vector<Tile>> board,
    vector<Piece> pieces,
    vector<Card> cards,
    int hand_size = 3,
    int round_length = 6,
    int cow_sacrifice = 5,
    int cow_regen_rate = 15,
    int days_per_round = 5,
    int score_goal = 10,
    string id = ""
  );
};

#include "Utils.h"

#include <bits/stdc++.h>
#include <filesystem>
#include "Helpers.h"

namespace fs = std::filesystem;
using namespace std;

/*--- Generation Utilities ------*/
vector<vector<Tile>> random_board(int width, int height) {
  vector<vector<Tile>> board(width, vector<Tile>(height));
  TileType types[] = {
    TileType::PLAIN,
    TileType::IMPASSIBLE,
    TileType::COW
  };
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      board[i][j] = Tile(types[rand() % 3]);
    }
  }
  return board;
}

vector<Piece> random_pieces(int npieces, int width, int height) {
  vector<Piece> pieces(npieces);
  for (int i = 0; i < npieces; i++) {
    pieces[i] = Piece(
      rand() % width,
      rand() % height,
      (rand() % 9) + 1
    );
  }
  return pieces;
}

vector<Card> random_cards(int ndirs, int ncards) {
  vector<Card> cards(ncards);
  for (int i = 0; i < ncards; i++) {
    vector<Direction> moves(ndirs);
    vector<Direction> dirs = {
      Direction::RIGHT, Direction::UP,
      Direction::LEFT, Direction::DOWN
    };
    for (int i = 0; i < ndirs; i++) {
      moves[i] = dirs[rand() % 4];
    }
    cards[i] = Card { moves };
  }
  return cards;
}


/*
 * loads board + pieces based on the random seed.
 */

tuple<vector<vector<Tile>>, vector<Piece>> load_setup(ifstream &file) {
  int h, w; file >> h >> w;
  vector<Piece> pieces;
  vector<vector<Tile>> board(h, vector<Tile>(w));
  for (int i = 0; i < h; i++) {
    for (int j = 0; j < w; j++) {
      int v; file >> v;
      board[i][j] = Tile::from(v);
      if (v >= 7) pieces.push_back(
        Piece(i, j, !board[i][j].player * 4 + board[i][j].color)
      );
    }
  }

  file.close();
  return { board, pieces };
} /* load_setup() */

/*
 * loads board + pieces based on the provided index.
 */

tuple<vector<vector<Tile>>, vector<Piece>> load_setup(int idx) {
  ifstream file ("Maps/map" + to_string(idx) + ".txt");
  if (!file.is_open()) {
    cerr << "FAILURE: Invalid Map Index: " << idx << endl;
    exit(1);
  }
  return load_setup(file);
} /* load_setup() */

/*
 * read in cards sent from the frontend.
 */

vector<Card> load_cards(int ncards) {
  // We reverse UP and DOWN because our board
  // Is represented differently.
  Direction directions[4] = {
    Direction::RIGHT, Direction::DOWN,
    Direction::LEFT, Direction::UP
  };

  vector<Card> cards(ncards);
  for (int i = 0; i < ncards; i++) {
    int d1, d2, d3; cin >> d1 >> d2 >> d3;
    vector<Direction> moves {
      directions[d1],
      directions[d2],
      directions[d3]
    };
    cards[i] = Card { moves };
  }
  return cards;
} /* load_cards() */


/*--- Timing ---*/
// Returns current time in milliseconds
// From https://stackoverflow.com/questions/19555121/how-to-get-current-timestamp-in-milliseconds-since-1970-just-the-way-java-gets
uint64_t curTime() {
  using namespace std::chrono;
  return duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
}
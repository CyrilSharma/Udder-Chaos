#pragma once
#include <bits/stdc++.h> // Forgive me for my lazyness. :(
#include <filesystem>
#include "Helpers.h"

namespace fs = std::filesystem;
using namespace std; // part 2

/*--- Printers ----*/
template <typename T>
void printv(vector<T> v) {
  for (uint32_t i = 0; i < v.size(); i++) {
    cerr << v[i] << "";
  }
  cerr << "\n";
}

template <typename T>
void printvv(vector<vector<T>> v) {
  for (uint32_t i = 0; i < v.size(); i++) {
    printv(v[i]);
  }
}

// https://stackoverflow.com/questions/2616906/how-do-i-output-coloured-text-to-a-linux-terminal
namespace Color {
  enum Code {
    FG_RED      = 31,
    FG_GREEN    = 32,
    FG_BLUE     = 34,
    FG_BLACK    = 30,
    FG_DEFAULT  = 39,
    BG_BLACK    = 40,
    BG_RED      = 41,
    BG_GREEN    = 42,
    BG_BLUE     = 44,
    BG_DEFAULT  = 49,
    BG_YELLOW   = 103,
    BG_PURPLE   = 105,
  };
  class Modifier {
    Code code;
    public:
      Modifier(Code pCode) : code(pCode) {}
      friend std::ostream&
      operator<<(std::ostream& os, const Modifier& mod) {
        return os << "\033[" << mod.code << "m";
      }
  };
}


/*--- Verifiers ----*/
template <typename T>
bool checkv(vector<T> a, vector<T> b) {
  if (a.size() != b.size()) return false;
  for (uint32_t i = 0; i < a.size(); i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

template <typename T>
bool checkvv(vector<vector<T>> a, vector<vector<T>> b) {
  if (a.size() != b.size()) return false;
  for (uint32_t i = 0; i < a.size(); i++) {
    if (!checkv(a[i], b[i])) return false;
  }
  return true;
}

/*--- Generation Utilities ------*/
vector<vector<int>> random_board(int width, int height) {
  vector<vector<int>> board(16, vector<int>(16));
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      board[i][j] = rand() % 3;
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
 * initialize the seed.
 */

mt19937 rng;
void init_seed(uint64_t seed) {
  rng = mt19937(seed);
} /* init_seed() */

/*
 * loads board + pieces based on the random seed.
 */

tuple<vector<vector<int>>, vector<Piece>> load_setup(int idx = 0) {
  int count = 0;
  for (const auto &_ : fs::directory_iterator("Maps")) {
    (void) _;
    count += 1;
  }
  uniform_real_distribution<double> dist { 0.0, 1.0 };

  // I am using this for test cases in the search <3
  ifstream file ("Maps/map" + to_string(idx) + ".txt");
  // ifstream file ("Maps/map0.txt");
  if (!file.is_open()) {
    cerr << "FAILURE: Invalid Map Index: " << idx << endl;
    exit(1);
  }

  int h, w, n; file >> h >> w >> n;
  vector<vector<int>> board(h, vector<int>(w));
  for (int i = 0; i < h; i++) {
    for (int j = 0; j < w; j++) {
      file >> board[i][j];
    }
  }

  vector<Piece> pieces(n);
  for (int i = 0; i < n; i++) {
    int x, y, tp; file >> x >> y >> tp;
    pieces[i] = (Piece(y, x, tp));
  }

  file.close();
  return { board, pieces };
} /* load_setup() */

/*
 * load_cards based on a seed
 * this method is kept in sync with the frontend.
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
    // cerr << d1 << " " << d2 << " " << d3 << endl;
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
#pragma once
#include <bits/stdc++.h>
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

vector<vector<Tile>> random_board(int width, int height);
vector<Piece> random_pieces(int npieces, int width, int height);
vector<Card> random_cards(int ndirs, int ncards);
tuple<vector<vector<Tile>>, vector<Piece>> load_setup(istream &file);
tuple<vector<vector<Tile>>, vector<Piece>> load_setup(int idx = 0);
vector<Card> load_cards(int ncards);
uint64_t curTime();
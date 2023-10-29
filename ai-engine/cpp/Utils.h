#pragma once
#include <bits/stdc++.h> // Forgive me for my lazyness.
#include "Helpers.h"
using namespace std;

/*--- Printers ----*/
template <typename T>
void printv(vector<T> v) {
  for (uint32_t i = 0; i < v.size(); i++) {
    cout<<v[i]<<"";
  }
  cout<<"\n";
}

template <typename T>
void printvv(vector<vector<T>> v) {
  for (int i = 0; i < v.size(); i++) {
    printv(v[i]);
  }
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
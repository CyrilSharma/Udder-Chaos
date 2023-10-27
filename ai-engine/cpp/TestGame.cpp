#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"
#include <bits/stdc++.h>
#include "Game.h"

using namespace std;

TEST_CASE("Testing the Creation Function") {
  const int width = 16;
  const int height = 16;
  vector<vector<int>> board(16, vector<int>(16));
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      board[i][j] = rand() % 3;
    }
  }
  int npieces = 5;
  vector<tuple<int,int,int>> pieces(npieces);
  for (int i = 0; i < npieces; i++) {
    pieces[i] = {
      rand() % width,
      rand() % height,
      rand() % 9
    };
  }
  const int ncards = 16;
  int ndirs = 3;
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
  GameConfig config = {
    board, pieces, cards
  };
  const int hand_size = 3;
  auto game = Game<width, height, ncards, hand_size>(config);
  game.render();
}
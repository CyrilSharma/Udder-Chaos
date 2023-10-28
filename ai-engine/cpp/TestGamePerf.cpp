#include <assert.h>
#include <bits/stdc++.h>
#include <boost/dynamic_bitset.hpp>
#include "CardQueue.h"
#include "Game.h"
#include "Utils.h"

int main() {
  // int x = 0; 
  boost::dynamic_bitset<uint64_t> t(64, 0);
  // bitset<64> s { 0 };
  for (int i = 0; i < 1e8; i++) {
    // x |= (x >> 1) & x;
    t |= (t >> 1) & t;
    // s |= (s >> 1) & s;
  }
  return 0 ;

  const int width = 16, height = 16;
  vector<vector<int>> board(height, vector<int>(width));
  for (int i = 0; i < height; i++) {
    for (int j = 0; j < width; j++) {
      board[i][j] = rand() % 2;
    }
  }

  const int npieces = 4;
  vector<Piece> player_pieces(npieces);

  int lx[npieces] = { 0, 1, 2, 3 };
  int ly[npieces] = { 0, 1, 2, 3 };
  for (int i = 0; i < npieces; i++) {
    player_pieces[i] = Piece(ly[i], lx[i], 1);
  }

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  auto config = GameConfig(board, player_pieces, cards);
  auto game = Game(config);
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };
}
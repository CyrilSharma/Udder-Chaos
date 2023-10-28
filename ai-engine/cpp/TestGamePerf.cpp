#include <assert.h>
#include <bits/stdc++.h>
#include <boost/dynamic_bitset.hpp>
#include "CardQueue.h"
#include "Game.h"
#include "Utils.h"

int main() {
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

  // int x = 1982;
  // boost::dynamic_bitset<uint64_t> thing(64, 0);
  // std::bitset<64> y { 0 };
  for (int i = 0; i < 1e8; i++) {
    // auto d = dirs[i % 4];
    // if (rand()) x = ~x;
    // if (rand()) y = ~y; 
    // if (rand()) thing = ~thing; // 50 TIMES SLOWER.
  }
}
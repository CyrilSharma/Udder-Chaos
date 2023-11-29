#include <assert.h>
#include <bits/stdc++.h>
#include "Game.h"
#include "Utils.h"


int main() {
  const int width = 16, height = 16;
  auto board = random_board(width, height);

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

  // Measure the execution time of func3
  auto start_time = std::chrono::high_resolution_clock::now();
  for (int i = 0; i < 1e7; i++) {
    game.play_player_movement(dirs[rand() % 4]);
  }
  auto end_time = std::chrono::high_resolution_clock::now();
  auto elapsed_time = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
  std::cout << "time: " << elapsed_time.count() << " ms" << std::endl;
}
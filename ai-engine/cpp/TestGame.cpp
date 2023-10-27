#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"
#include <bits/stdc++.h>
#include "Game.h"
#include "Utils.h"

using namespace std;

/*
 * Ensure creation function faithfully transcribes
 * The board, players, and cards.
 */

TEST_CASE("Testing the Creation Function") {
  const int width = 16;
  const int height = 16;
  auto board = random_board(width, height);

  const int npieces = 5;
  auto pieces = random_pieces(npieces, width, height);

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  GameConfig config = {
    board, pieces, cards
  };
  const int hand_size = 3;
  auto game = Game<width, height, ncards, hand_size>(config);

  CHECK_MESSAGE(
    checkvv(game.viewBoard(), board),
    "Game Board does not match Input!"
  );

  // Pieces need to be sorted to properly check for eq.
  sort(pieces.begin(), pieces.end(), [](Piece &a, Piece &b) {
    if (a.i != b.i) return a.i < b.i;
    if (a.j != b.j) return a.j < b.j;
    return a.tp < b.tp;
  });

  CHECK_MESSAGE(
    checkv(game.viewPieces(), pieces),
    "Pieces do not match Input!"
  );

  CHECK_MESSAGE(
    checkv(game.viewCards(), cards),
    "Cards do not match Input!"
  );
}


/*
 * Ensure synchronized movement works
 * when there's no collisions or walls.
 */

TEST_CASE("Testing Basic Movement (no player collisions, no walls)") {
  const int width = 16, height = 16;
  vector<vector<int>> board(height, vector<int>(width));

  vector<Piece> pieces = {
    Piece { 5, 5, 1 },
    Piece { 5, 11, 1 },
    Piece { 11, 5, 1 },
    Piece { 11, 11, 1 },
  };

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  GameConfig config = { board, pieces, cards };
  auto game = Game<width, height>(config);
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };

  for (int i = 0; i < 5; i++) {
    auto dir = dirs[rand() % 4];
    game.play_player_movement(dir);
    for (Piece &p: pieces) {
      // Valid so long as nothing collides, and nothing will
      // Since everything is too far apart.
      switch (dir) {
        case Direction::RIGHT: { p.j = min(p.j + 1, width - 1);  break; }
        case Direction::UP:    { p.i = min(p.i + 1, height - 1); break; }
        case Direction::LEFT:  { p.j = max(p.j - 1, 0);          break; }
        case Direction::DOWN:  { p.i = max(p.i - 1, 0);          break; }
      }
    }
    if (!checkv(game.viewPieces(), pieces)) {
      printv(game.viewPieces());
      cout<<"\n";
      printv(pieces);
      cout<<"\n";

      auto print_bitmask = [](bitset<game.area()> b) {
        for (int i = height - 1; i >= 0; i--) {
          for (int j = 0; j < width; j++) {
            cout<<b[i * width + j];
          }
          cout<<'\n';
        }
        cout<<"\n\n";
      };
      print_bitmask(game.right_edge_mask());
      print_bitmask(game.up_edge_mask());
      print_bitmask(game.left_edge_mask());
      print_bitmask(game.down_edge_mask());
      FAIL("Pieces were not updated properly!");
    }
  }
}

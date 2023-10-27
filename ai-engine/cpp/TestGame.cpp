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

TEST_CASE("Testing Player Movement") {
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

  // Valid so long as nothing collides, and there aren't walls.
  auto easy_update = [&](Direction dir) {
    for (Piece &p: pieces) {
      switch (dir) {
        case Direction::RIGHT: { p.j = min(p.j + 1, width - 1);  break; }
        case Direction::UP:    { p.i = min(p.i + 1, height - 1); break; }
        case Direction::LEFT:  { p.j = max(p.j - 1, 0);          break; }
        case Direction::DOWN:  { p.i = max(p.i - 1, 0);          break; }
      }
    }
  };

  auto verify = [&]() {
    if (checkv(game.viewPieces(), pieces)) return;
    cout<<"Expected - \n";
    printv(pieces);
    cout<<"\n";

    cout<<"Got - \n";
    printv(game.viewPieces());
    cout<<"\n";

    FAIL("Pieces were not updated properly!");
  };

  SUBCASE("No walls, edges, collisions") {
    for (int i = 0; i < 5; i++) {
      auto dir = dirs[rand() % 4];
      game.play_player_movement(dir);
      easy_update(dir);
      verify();
    }
  }

  SUBCASE("Just Edges") {
    int xs[4] = { 0, 15, 0, 15 };
    int ys[4] = { 0, 0, 15, 15 };
    for (int i = 0; i < 4; i++) {
      pieces[i].i = ys[i];
      pieces[i].j = xs[i];
    }
    config = { board, pieces, cards };
    game = Game<width, height>(config);
    for (int i = 0; i < 12; i++) {
      auto dir = dirs[rand() % 4];
      game.play_player_movement(dir);
      easy_update(dir);
      verify();
    }
  }

  // Presume walls are on checkerboard tiles.
  auto wall_update = [&](Direction dir) {
    for (Piece &p: pieces) {
      auto ti = p.i;
      auto tj = p.j;
      switch (dir) {
        case Direction::RIGHT: { p.j = min(p.j + 1, width - 1);  break; }
        case Direction::UP:    { p.i = min(p.i + 1, height - 1); break; }
        case Direction::LEFT:  { p.j = max(p.j - 1, 0);          break; }
        case Direction::DOWN:  { p.i = max(p.i - 1, 0);          break; }
      }
      if ((p.i + p.j) % 2 == 0) {
        p.i = ti, p.j = tj;
      }
    }
  };

  SUBCASE("Just Walls") {
    int xs[4] = { 1, 15, 15, 10 };
    int ys[4] = { 0, 0, 14, 15 };
    for (int i = 0; i < 4; i++) {
      pieces[i].i = ys[i];
      pieces[i].j = xs[i];
    }
    vector<vector<int>> checkers(height, vector<int>(width));
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        checkers[i][j] = ((i + j) % 2) == 0;
      }
    }
    config = { checkers, pieces, cards };
    game = Game<width, height>(config);
    for (int i = 0; i < 12; i++) {
      auto dir = dirs[rand() % 4];
      game.play_player_movement(dir);
      wall_update(dir);
      verify();
    }
  }

  SUBCASE("Collision Test") {
    int xs[4] = { 0, 1, 0, 1 };
    int ys[4] = { 0, 0, 1, 1 };
    for (int i = 0; i < 4; i++) {
      pieces[i].i = ys[i];
      pieces[i].j = xs[i];
    }
    config = { board, pieces, cards };
    game = Game<width, height>(config);
    /* for (int d = 0; d < 4; d++) {
      for (int i = 0; i < 25; i++) {
        game.play_player_movement(dirs[d]);
        printv(game.viewPieces());
        cout<<"\n";
      }
    } */
    game.play_player_movement(Direction::LEFT);
    verify();
  }
}
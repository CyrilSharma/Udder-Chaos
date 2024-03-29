#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"
#include <bits/stdc++.h>
#include "CardManager.h"
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

  auto config = GameConfig(board, pieces, cards);
  auto game = Game(config);
  cout << game << endl;

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
    "Pieces do not match Input!",
    printv(game.viewPieces()),
    printv(pieces)
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
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };
  const int width = 16, height = 16;
  vector<vector<Tile>> board(height, vector<Tile>(width));

  const int ndirs = 3, ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  vector<Piece> pieces = {
    Piece(5, 5, 1),
    Piece(5, 11, 1),
    Piece(11, 5, 1),
    Piece(11, 11, 1),
  };

  auto config = GameConfig(board, pieces, cards);

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

  auto verify = [&](Game &g) {
    if (checkv(g.viewPieces(), pieces)) return;
    cout<<"Expected - \n";
    printv(pieces);
    cout<<"\n";

    cout<<"Got - \n";
    printv(g.viewPieces());
    cout<<"\n";

    FAIL("Pieces were not updated properly!");
  };

  SUBCASE("No walls, edges, collisions") {
    auto g0 = Game(config);
    cout << g0 << endl;
    for (int i = 0; i < 5; i++) {
      auto dir = dirs[rand() % 4];
      g0.play_player_movement(dir);
      easy_update(dir);
      verify(g0);
    }
    cout << g0 << endl;
  }

  SUBCASE("Just Edges") {
    int xs[4] = { 0, 15, 0, 15 };
    int ys[4] = { 0, 0, 15, 15 };
    for (int i = 0; i < 4; i++) {
      pieces[i].i = ys[i];
      pieces[i].j = xs[i];
    }
    config = { board, pieces, cards };
    auto g1 = Game(config);
    for (int i = 0; i < 12; i++) {
      auto dir = dirs[rand() % 4];
      g1.play_player_movement(dir);
      easy_update(dir);
      verify(g1);
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

    vector<vector<Tile>> checkers(height, vector<Tile>(width));
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        checkers[i][j] = (((i + j) % 2) == 0) 
          ? TileType::IMPASSIBLE : TileType::PLAIN;
      }
    }

    config = { checkers, pieces, cards };
    auto g2 = Game(config);
    cout << g2 << endl;
    for (int i = 0; i < 12; i++) {
      auto dir = dirs[rand() % 4];
      g2.play_player_movement(dir);
      wall_update(dir);
      verify(g2);
    }
  }

  SUBCASE("Self-Collision Test") {
    int xs[4] = { 0, 1, 0, 1 };
    int ys[4] = { 0, 0, 1, 1 };
    for (int i = 0; i < 4; i++) {
      pieces[i].i = ys[i];
      pieces[i].j = xs[i];
    }
    config = { board, pieces, cards };
    auto g3 = Game(config);
    cout << g3 << endl;
    printv(pieces);
    printv(g3.viewPieces());
    for (int d = 0; d < 4; d++) {
      for (int i = 0; i < 25; i++) {
        g3.play_player_movement(dirs[d]);
      }
    }
    verify(g3);
  }

  SUBCASE("Other-Collision Test") {
    /*
     * 11 ======= 2
     * 11 ======= 2
     * ============
     * ============
     * ============
     * 22 ==== 22 =
     */
    pieces.clear();
    pieces.push_back( Piece(0, 0, 1) );
    pieces.push_back( Piece(0, 1, 1) );
    pieces.push_back( Piece(0, 10, 2) );
    pieces.push_back( Piece(1, 0, 1) );
    pieces.push_back( Piece(1, 1, 1 ) );
    pieces.push_back( Piece(1, 10, 2) );
    pieces.push_back( Piece(2, 0, 2) );
    pieces.push_back( Piece(2, 1, 2) );
    pieces.push_back( Piece(2, 8, 2) );
    pieces.push_back( Piece(2, 9, 2) );
    config = { board, pieces, cards };
    auto g4 = Game(config);
    for (int d = 0; d < 4; d++) {
      for (int i = 0; i < 25; i++) {
        g4.play_player_movement(dirs[d]);
      }
    }
    verify(g4);
  }
}

/*
 * Ensure cows are removed from the mask,
 * And the score mask is correctly updated.
 */

TEST_CASE("Test Cow Capturing") {
  const int width = 16, height = 16;

  vector<vector<Tile>> board(height, vector<Tile>(width));
  // Lazy way to make cows not spawn where units already are.
  for (int i = 1; i < 11; i++) {
    for (int j = 1; j < 11; j++) {
      if (rand() % 4 == 0) {
        board[i][j].category = TileType::COW;
      }
    }
  }

  vector<Piece> pieces = {
    Piece(0, 0, 1),
    Piece(0, 11, 1),
    Piece(11, 0, 1),
    Piece(11, 11, 1),
  };

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  auto config = GameConfig(board, pieces, cards);
  auto game = Game(config);
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };

  auto easy_update = [&](Direction dir) {
    int dx[4] = { 1, 0, -1, 0 };
    int dy[4] = { 0, 1, 0, -1 };
    for (uint32_t i = 0; i < pieces.size(); i++) {
      auto &p = pieces[i];
      auto ni = p.i + dy[dir];
      auto nj = p.j + dx[dir];
      if (ni < 0 || ni >= height || nj < 0 || nj >= width)
        continue;
      p.i = ni, p.j = nj;
      if (board[ni][nj] == TileType::COW) {
        // sus way to say the cow is gone now.
        board[ni][nj].category = TileType::PLAIN;
        pieces[i].score += 1;
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

  for (int i = 0; i < 10; i++) {
    auto d = dirs[rand() % 4];
    game.play_player_movement(d);
    easy_update(d);
    verify();
  }

  int total_score = 0;
  for (auto &p: pieces) {
    total_score += p.score;
  }

  int game_cows = 0;
  for (auto &p : game.viewPieces()) {
    game_cows += p.score;
  }
  REQUIRE(game_cows == total_score);
}

/*
 * Test Unit Killing.
 * Ensure enemies are removed from their corresponding masks.
 */

TEST_CASE("Test Unit Killing") {
  const int width = 16, height = 16;
  vector<vector<Tile>> board(height, vector<Tile>(width));

  vector<Piece> pieces = {
    Piece(5, 5, 1),
    Piece(5, 6, 5),
    Piece(5, 4, 6),
    Piece(4, 5, 7),
    Piece(6, 5, 8),
  };

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  auto config = GameConfig(board, pieces, cards);
  auto game = Game(config);

  cerr << game << endl;
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };

  for (int i = 0; i < 4; i++) {
    game.play_player_movement(dirs[i]);
    game.play_player_movement(dirs[(i + 2) & 0b11]);
    CHECK(game.viewPieces().size() == 4 - i);
  }

  CHECK(game.viewPieces()[0].tp == 1);
}

/*
 * Test Enemies.
 * Enemy Movement / Kill Logic is identical to player Logic.
 * Hence, I'm going to run two games, and ensure they match.
 */

TEST_CASE("Test Enemy Movement / Logic") {
  const int width = 16, height = 16;
  auto board = random_board(width, height);

  const int npieces = 4;
  vector<Piece> player_pieces(npieces);
  vector<Piece> enemy_pieces(npieces);

  const int enemy_tp = 5;
  int lx[npieces] = { 0, 1, 2, 3 };
  int ly[npieces] = { 0, 1, 2, 3 };
  for (int i = 0; i < npieces; i++) {
    player_pieces[i] = Piece(ly[i], lx[i], 1);
    enemy_pieces[i] = Piece(ly[i], lx[i], enemy_tp);
  }

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);

  auto config_p = GameConfig(board, player_pieces, cards);
  auto config_e = GameConfig(board, enemy_pieces, cards);
  auto game_p = Game(config_p);
  auto game_e = Game(config_e);
  Direction dirs[4] = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN,
  };

  for (int i = 0; i < 1000; i++) {
    auto d = dirs[rand() % 4];
    game_p.play_player_movement(d);
    game_e.play_enemy_movement(d, enemy_tp - 5);
  }

  auto cur_pieces1 = game_p.viewPieces();
  auto cur_pieces2 = game_e.viewPieces();
  for (int j = 0; j < npieces; j++) {
    REQUIRE((
      (cur_pieces1[j].i == cur_pieces2[j].i) &&
      (cur_pieces1[j].j == cur_pieces2[j].j)
    ));
  }
  cout << game_p << endl;
  cout << game_e << endl;
}

/*
 * Test Scoring.
 * Ensure Pieces can actually score.
 * 
 */

TEST_CASE("Test Scoring") {
  const int width = 16, height = 16;
  vector<vector<Tile>> board(height, vector<Tile>(width));
  board[0][0] = Tile(TileType::SPAWN, 1, 1);
  board[7][0] = Tile(TileType::COW);
  board[8][0] = Tile(TileType::IMPASSIBLE);

  vector<Piece> player_pieces = { Piece(1, 0, 1) };

  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);
  auto config_p = GameConfig(board, player_pieces, cards);
  auto game = Game(config_p);
  cout << game << endl;

  auto game_p = Game(config_p);
  for (int i = 0; i < 10; i++) {
    game.play_player_movement(Direction::UP);
    cout << player_pieces[0] << endl;
    cout << game << endl;
  }

  CHECK(game.viewPieces()[0].score == 1);
  CHECK(game.cows_collected == 0);
  for (int i = 0; i < 10; i++) {
    game.play_player_movement(Direction::DOWN);
  }

  CHECK(game.cows_collected == 1);
}

/*
 * Test Game Jover.
 * Ensure Game Actually can end.
 */

TEST_CASE("Test Game JOVER") {
  const int width = 16, height = 16;
  vector<vector<Tile>> board(height, vector<Tile>(width));

  vector<Piece> pieces1 = { };
  const int ndirs = 3;
  const int ncards = 16;
  auto cards = random_cards(ndirs, ncards);
  auto config1 = GameConfig(board, pieces1, cards);

  auto game1 = Game(config1);
  CHECK(game1.is_jover() == -1);

  vector<Piece> pieces2 = {
    Piece(0, 0, 1), Piece(0, 1, 2),
    Piece(1, 0 , 3), Piece(1, 1, 4)
  };
  auto config2 = GameConfig(board, pieces2, cards);
  auto game2 = Game(config2);
  game2.cows_collected = 1e9;
  CHECK(game2.is_jover() == 1);

  auto game3 = Game(config2);
  game3.cows_collected = game3.cow_sacrifice;
  game3.turn = (game3.days_per_round * 6 - 1);
  game3.make_move(Move(MoveType::NORMAL, 0, game3.player_id));
  CHECK(game3.is_jover() == 0);

  auto game4 = Game(config2);
  game4.cows_collected = game4.cow_sacrifice - 1;
  game4.turn = (game4.days_per_round * 6 - 1);
  game4.make_move(Move(MoveType::NORMAL, 0, game4.player_id));
  CHECK(game4.is_jover() == -1);
}

/*
 * Ensure the card manager works as intended
 */

TEST_CASE("Test CardManager") {
  const int handsize = 3, ndirs = 3, ncards = 16;
  auto cards = random_cards(ndirs, ncards);
  CardManager cm(cards, handsize);
  SUBCASE("Test Choose") {
    int qsize = (ncards - 2 * handsize);
    cm.pchoose(0);
    for (int i = 0; i < qsize; i++) {
      CHECK(cm.pchoose(0) == cm.cards[i]);
    }
    cm.echoose(0);
    for (int i = 0; i < qsize; i++) {
      CHECK(cm.echoose(0) == cm.cards[i]);
    }
  }
}
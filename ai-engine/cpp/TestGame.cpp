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
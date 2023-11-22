#include "Score.h"

#include <queue>
using namespace std;

Scorer::Scorer (GameConfig gc, function<int(Game &)> f) {
  // May be useful one day.
  (void) gc;
  if (f != nullptr) eval = f;
  else              eval = [this](Game& game) { return evaluator(game); };
}

/*
 * Wrapper for the evaluator.
 */

int Scorer::score(Game &game) {
  return eval(game);
} /* score() */

/*
 * Our default heuristic for evaluating a game state.
 * This should probably be changed to accept a move.
 */

int Scorer::evaluator(Game &game) {
    int e = game.is_enemy_turn();
    int ppct = game.count_players();
    int epct = game.count_enemies();
    int ppscore = ppwt * ppct;
    int epscore = epwt * epct;
    int scoreSum = ppscore + epscore;

    // This is kind of a stupid way to do this.
    // Instead, this can easily be maintained dynamically,
    // Just use MOVEs to update, and add the ability to regress the boardeval.
    // Upon checking this makes it a LOT slower.

    // int boardeval = 0;
    // int npieces = 0;
    // for (int c = 0; c < 4; c++) {
    //   npieces += game.enemy.deads[c].size();
    //   for (size_t i = 0; i < game.enemy.deads[c].size(); i++) {
    //     int x = game.enemy.xs[c][i];
    //     int y = game.enemy.ys[c][i];
    //     boardeval += (-1 + 2 * e) * enemyhm[y * game.width + x];
    //   }
    // }
    // for (int c = 0; c < 4; c++) {
    //   npieces += game.player.deads[c].size();
    //   for (size_t i = 0; i < game.player.deads[c].size(); i++) {
    //     int x = game.player.xs[c][i];
    //     int y = game.player.ys[c][i];
    //     boardeval += (1 - 2 * e) * playerhm[y * game.width + x];
    //   }
    // }

    // scoreSum += (bwt * boardeval) / (npieces * 10);
    scoreSum *= (-1 + 2 * e);
    return scoreSum;
} /* evaluator() */
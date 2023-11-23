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
    // I dislike not knowing what the weight is
    // Just by looking at the code
    // int ppscore = ppwt * ppct;
    // int epscore = epwt * epct;
    int ppscore = -10 * ppct;
    int epscore = 10 * epct;
    int scoreSum = ppscore + epscore;
    int ebeval = (epct) ? (game.enemyeval / (epct)) : 0;
    int pbeval = (ppct) ? (game.playereval / (ppct)) : 0;
    scoreSum += (ebeval - pbeval);
    scoreSum *= (-1 + 2 * e);
    return scoreSum;
} /* evaluator() */
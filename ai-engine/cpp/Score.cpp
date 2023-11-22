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
    int boardeval = ((2 * game.hmeval) / (10 * (ppct + epct)));
    scoreSum += boardeval;
    scoreSum *= (-1 + 2 * e);
    return scoreSum;
} /* evaluator() */
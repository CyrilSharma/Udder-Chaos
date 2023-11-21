#include "Score.h"
Scorer::Scorer (function<int(Game &)> f) {
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
 */

int Scorer::evaluator(Game &game) {
    int ppct = game.count_players();
    int epct = game.count_enemies();
    int ppscore = ppwt * ppct;
    int epscore = epwt * epct;
    return ppscore + epscore;
} /* evaluator() */
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
    int scoreSum = 0;
    int e = game.is_enemy_turn();
    int ppct = game.count_players();
    int epct = game.count_enemies();
    int scale = (game.width + game.height);
    int ppscore = -5 * ppct * scale;
    int epscore = 5 * epct * scale;
    scoreSum += (ppscore + epscore);
    scoreSum += -1 * (game.count_held_cows());
    scoreSum += -2 * (game.cows_collected);
    int ebeval = (epct) ? (game.enemyeval / (epct)) : 0;
    int pbeval = (ppct) ? (game.playereval / (ppct)) : 0;
    scoreSum += (ebeval - pbeval);
    if (!e) scoreSum *= -1;
    return scoreSum;
} /* evaluator() */
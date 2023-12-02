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

    // Default value is -6 because initially
    // Getting more cows is more important then buying a piece.
    // Once we've ensured that we'll survive the sacrifice,
    // Buying becomes more practical, so cows are valued less.
    int held_cows = game.count_held_cows();
    if (held_cows < (int64_t) game.cow_sacrifice) {
      scoreSum += -6 * held_cows * scale;
    } else {
      scoreSum += -6 * game.cow_sacrifice * scale;
      scoreSum += -3 * (held_cows - game.cow_sacrifice) * scale;
    }

    // Trading in cows gives a HUGE reward.
    scoreSum += -8 * (game.cows_collected) * scale;

    // This is already scaled; as dists are in [0, W + H]
    int ebeval = (epct) ? (game.enemyeval / (epct)) : 0;
    int pbeval = (ppct) ? (game.playereval / (ppct)) : 0;
    scoreSum += (ebeval - pbeval);
    if (!e) scoreSum *= -1;
    return scoreSum;
} /* evaluator() */
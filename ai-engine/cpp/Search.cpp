#include "Search.h"
#include <cilk/cilk.h>

#define debug(x) std::cerr << #x << ": " << x << std::endl

Search::Search(GameConfig gc, uint64_t to, int md):
    game(gc), scorer(gc), timeout(to), max_depth(md) {}
  
Search::Search(GameConfig gc, Scorer sc, uint64_t to, int md):
    game(gc), scorer(sc), timeout(to), max_depth(md) {}

// Wrapper method to advance the internal state of the game.
void Search::make_move(Move move) {
    game.make_move(move);
}

/*
 * brand new search function that will work in the _future_ !
 * structure from https://github.com/SebLague/Chess-Coding-Adventure/blob/Chess-V2-Unity
 * set timeout and max_depth before running, defaults to timeout = 1000 and max_depth = inf
 * dbg is debug print verbosity
 * 0 - no prints
 * 1 - a few prints (unimpl.)
 * 2 - printing depth 0 evals and best move chains
 * 3 - all previous and every move eval
 * 4 - all previous and every game state (unimpl.)
 */

Move Search::beginSearch(int dbg, bool fixedDepth) {
    dbgVerbosity = dbg;
    begin_time = curTime();
    std::vector<Move> moves; moves.reserve(16);
    gen_moves(game, moves, !game.is_enemy_turn());
    moveOrderer.order(game, moves);
    Move best_move = moves[0];
    
    if (fixedDepth && dbg) cerr << "Doing fixed depth search of depth " << max_depth << endl;

    int sign = 1;
    int turn = game.turn;
    if (game.is_enemy_turn(turn) != game.is_enemy_turn(turn + 1)) {
      sign = -1;
    }

    vector<int> score(moves.size());
    int depth = (fixedDepth) ? max_depth : 1;
    for (; depth <= max_depth; depth++) {
      if (curTime() > begin_time + timeout) break;
      int best_score_d = -inf;
      Move best_move_d = moves[0];
      if (dbg >= 2) cerr << "Initiating search of depth " << depth << endl;
      Position p = { game, inf * sign, -inf * sign };
      for (size_t i = 0; i < moves.size(); i++) {
        auto move = moves[i];
        p.alpha = best_score_d;
        int sc = sign * alphaBeta(p, move, depth - 1);
        score[i] = sc;
        if (sc > best_score_d) {
          best_score_d = sc;
          best_move_d = move;
        }
        if (dbg >= 2) {
          cerr << "--------EVAL---------" << endl;
          cerr << "Move: " << typeOfMove(move.type) << " " << move.card << " " << move.color << endl;
          cerr << "Eval: " << " " << sc << endl;
        }
      }

      
      for (size_t i = 1; i < moves.size(); i++) {
        for (size_t j = i; j > 0; --j) {
          if (score[j] > score[j-1]) {
            std::swap(score[j], score[j-1]);
            std::swap(moves[j], moves[j-1]);
          }
        }
      }
      if (curTime() < begin_time + timeout) {
        best_move = best_move_d;
      }
      if (dbg >= 1) cerr << "Depth " << depth << " done." << endl;
    }

    if (dbg >= 1) {
        cerr << "Reached depth: " << depth - 1 << endl;
        cerr << "Time Elapsed (ms): " << curTime() - begin_time << endl;
    }
    return best_move;
}


/*
 * easiest way I could think of to prune in a parallel setting.
 * ideally we would kill the children of useless searches but I don't know how to 
 * do that.
 */

void Search::wrapper(Position &cur, Move move, int depth,
            int &sign, int &best_score, bool &cutoff, std::mutex &mutex) {
  int child_sc = sign * alphaBeta(cur, move, depth);
  mutex.lock();
  if (child_sc > best_score) {
    best_score = child_sc;
    if (child_sc > cur.alpha) {
      cur.alpha = child_sc;
      if (child_sc >= cur.beta) {
        cutoff = true;
      }
    }
  }
  mutex.unlock();
}

/* 
 * This accepts a move now to allow the simulation of the
 * move to be done in parallel.
 */

int Search::alphaBeta(Position &prev, Move move, int depth) {
    if (curTime() > begin_time + timeout) return -inf;

    bool cutoff = false;
    Position cur = { prev.game, prev.alpha, prev.beta };
    cur.game.make_move(move);

    // This is taking too long to get working :/
    int status = cur.game.is_jover();
    if (status != 0) {
      int e = cur.game.is_enemy_turn();
      int ewin = (status == -1);
      int sign = (e == ewin) ? 1 : -1;
      return 1e6 * sign;
    }

    if (depth <= 0) return scorer.score(cur.game);
    if (cur.game.is_enemy_turn() != prev.game.is_enemy_turn()) {
      cur.alpha = -prev.beta;
      cur.beta = -prev.alpha;
    }

    // Clunky way of checking, should I negate my child or no.
    int sign = 1;
    int turn = cur.game.turn;
    if (cur.game.is_enemy_turn(turn) != cur.game.is_enemy_turn(turn + 1)) {
      sign = -1;
    }

    int best_score = -inf;
    std::vector<Move> moves; moves.reserve(16);
    gen_moves(cur.game, moves, !cur.game.is_enemy_turn());
    moveOrderer.order(cur.game, moves);

    std::mutex mutex;
    if (moves.size() > 0) {
      wrapper(
        cur, moves[0], depth - 1,
        sign, best_score, cutoff, mutex
      );
    }

    cilk_scope {
      for (size_t i = 1; i < moves.size() && !cutoff; i++) {
        cilk_spawn wrapper(
          cur, moves[i], depth - 1,
          sign, best_score, cutoff, mutex
        );
      }
    }

    // Incomplete searches are garbage to us.
    if (curTime() > begin_time + timeout) return -inf;
    else return best_score;
}

void Search::gen_moves(Game &g, vector<Move> &moves, int player) {
  if (player) {
    for (int card = 0; card < (int) g.cm.handsize; ++card) {
      moves.push_back(Move(MoveType::NORMAL, card, g.player_id));
      for (int angle = 1; angle <= 3; ++angle)
        moves.push_back(Move(MoveType::ROTATE, card, angle));
    }
    if (g.cows_collected > 0) {
      for (auto [x, y]: g.player_spawns[g.player_id]) {
        moves.push_back(Move(MoveType::BUY, x, y));
      }
    }
  } else {
    for (int card = 0; card < (int) g.cm.handsize; ++card) {
      for (int color = 0; color < 4; ++color) {
          if (!g.enemy.deads[color].size()) continue;
          moves.push_back(Move(MoveType::NORMAL, card, color));
      }
    }
  }
}
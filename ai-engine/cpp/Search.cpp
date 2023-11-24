#include "Search.h"

#define debug(x) std::cerr << #x << ": " << x << std::endl

Search::Search(GameConfig gc, uint64_t to, int md):
    game(gc), scorer(gc), timeout(to), max_depth(md) {}
  
Search::Search(GameConfig gc, Scorer sc, uint64_t to, int md):
    game(gc), scorer(sc), timeout(to), max_depth(md) {}


// In the future making moves may also update the internal state of the search.
// Hence, we make wrapper methods.
void Search::makePlayerMove(int move) {
    game.player_move(move);
}

void Search::rotatePlayerCard(int index, int rotation) {
    game.player_rotate_card(index, rotation);
}

void Search::purchaseUFO(int row, int column) {
    game.player_buy(column, row);
}

void Search::makeAIMove(int move, int color) {
    game.enemy_move(move, color);
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
    gen_moves(moves, !game.is_enemy_turn());
    moveOrderer.order(game, moves);
    Move best_move = moves[0];
    int best_sc = -inf;
    
    if (fixedDepth && dbg) cerr << "Doing fixed depth search of depth " << max_depth << endl;

    int depth = (fixedDepth) ? max_depth : 1;
    for (; depth <= max_depth; depth++) {
      if (curTime() > begin_time + timeout) break;        
      if (dbg >= 2) cerr << "Initiating search of depth " << depth << endl;
      Position p = { game, -inf, inf };
      for (auto move : moves) {
        // This works IFF it is the AIs turn.
        int sc = -alphaBeta(p, move, depth - 1);
        if (sc > best_sc) {
          best_sc = sc;
          best_move = move;
        }
        if (dbg) {
          cerr << "--------EVAL---------" << endl;
          cerr << "Move: " << typeOfMove(move.type) << " " << move.card << " " << move.color << endl;
          cerr << "Eval: " << " " << sc << endl;
        }
      }
    }

    if (dbg) {
        cerr << "Reached depth: " << depth - 1 << endl;
        cerr << "Time Elapsed (ms): " << curTime() - begin_time << endl;
    }
    return best_move;
}

/* 
 * This accepts a move now to allow the simulation of the
 * move to be done in parallel.
 */

int Search::alphaBeta(Position &prev, Move move, int depth) {
    Position cur = { prev.game, prev.alpha, prev.beta };
    cur.game.make_move(move);
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
    gen_moves(moves, !game.is_enemy_turn());
    moveOrderer.order(game, moves);

    for (Move move : moves) {
      if (curTime() > begin_time + timeout) return -inf;
      int child_sc = sign * alphaBeta(cur, move, depth - 1);
      if (child_sc > best_score) {
        best_score = child_sc;
        if (child_sc > cur.alpha) {
          cur.alpha = child_sc;
          if (child_sc >= cur.beta) {
            return best_score;
          }
        }
      }
    }

    // Incomplete searches are garbage to us.
    if (curTime() > begin_time + timeout) return -inf;
    else return best_score;
}

// I'm just going to assume the spawn locations are fixed because I don't want to generate them right now
const int spawnPos[4][4][2] = {{{0, 0}, {0, 1}, {1, 0}, {1, 1}}, {{0, 14}, {0, 15}, {1, 14}, {1, 15}}, 
                                {{14, 0}, {14, 1}, {15, 0}, {15, 1}}, {{14, 14}, {14, 15}, {15, 14}, {15, 15}}};

void Search::gen_moves(vector<Move> &moves, int player) {
  if (player) {
    for (int card = 0; card < (int) game.cm.handsize; ++card) {
      moves.push_back(Move(MoveType::NORMAL, card, game.player_id));
      for (int angle = 1; angle <= 3; ++angle)
        moves.push_back(Move(MoveType::ROTATE, card, angle));
    }
    if (game.total_score > 0)
      for (auto xy : spawnPos[game.player_id])
        moves.push_back(Move(MoveType::BUY, xy[0], xy[1]));
  } else {
    for (int card = 0; card < (int) game.cm.handsize; ++card) {
      for (int color = 0; color < 4; ++color) {
          if (!game.enemy.deads[color].size()) continue;
          moves.push_back(Move(MoveType::NORMAL, card, color));
      }
    }
  }
}

/* todo list
# INCLUDE SCORING AND WINNING IN SEARCH
We don't do quiescence search for now because this game 
doesn't really have "capture-backs" like chess
in the future might add some adapted version.

improve move ordering heuristic
    if a move increases player banked score search it first
    rotations and buying are...
improve move evaluation heuristic
    if a side wins it's +- inf and shortcircuit
    otherwise
    piece count score - ~100
    piece cow score - ~30
    piece location from center - ~5 per tile
    player actual score - ~50 
    player score from win target - 10 * piece value * banked score / (target score squared * (target score - banked score))
        Function that is 0 at 0 score and ~infinite at target score 
        https://www.desmos.com/calculator/g33apvmq8c
probably not quiescence searching because our game is a bit complex
order the previous best move first such that we can use partial results
look into transposition table possible usages
look into search extensions (perhaps for piece capture possibilities)
*/
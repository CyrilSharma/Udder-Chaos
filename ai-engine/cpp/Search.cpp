#include "Search.h"

#define debug(x) std::cerr << #x << ": " << x << std::endl

Search::Search(GameConfig gc, uint64_t to, int md, Scorer sc):
  game(gc), scorer(sc), hasher(game),
  timeout(to), max_depth(md) {}

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

// brand new search function that will work in the _future_ !
// structure from https://github.com/SebLague/Chess-Coding-Adventure/blob/Chess-V2-Unity
// set timeout and max_depth before running, defaults to timeout = 1000 and max_depth = inf
//
// dbg is debug print verbosity
// 0 - no prints
// 1 - a few prints (unimpl.)
// 2 - printing depth 0 evals and best move chains
// 3 - all previous and every move eval
// 4 - all previous and every game state (unimpl.)

Move Search::beginSearch(int dbg, bool fixedDepth) {
    // Fixed depth search for debugging
    if (fixedDepth) {
      if (dbg) cerr << "Doing fixed depth search of depth " << max_depth << endl;
      alphaBeta(game, 0, max_depth, -inf, inf, dbg);
      return newBestMove;
    }
    
    begin_time = curTime();

    // might need a nullmove member in the future
    Move bestMove = Move(MoveType::NONE, -1, -1);
    int bestEval = -1;
    
    int curDepth = 1;
    while (curDepth <= max_depth) {
        if (curTime() > begin_time + timeout) break;
        
        if (dbg >= 2) cerr << "Initiating search of depth " << curDepth << endl;

        // Recursive tree search to curDepth
        alphaBeta(game, 0, curDepth, -inf, inf, dbg);

        if (dbg >= 2) {
          // for (int i =)
        }

        // only use new move if search completed
        if (searchCompleted) {
            bestMove = newBestMove, bestEval = newBestEval;
        }
        curDepth++;
    }

    if (dbg) {
        cerr << "Reached depth: " << curDepth-1 << endl;
        cerr << "Time Elapsed (ms): " << curTime() - begin_time << endl;
    }
    return bestMove;
}

// I'm just going to assume the spawn locations are fixed because I don't want to generate them right now
const int spawnPos[4][4][2] = {{{0, 0}, {0, 1}, {1, 0}, {1, 1}}, {{0, 14}, {0, 15}, {1, 14}, {1, 15}}, 
                                {{14, 0}, {14, 1}, {15, 0}, {15, 1}}, {{14, 14}, {14, 15}, {15, 14}, {15, 15}}};
// Alpha-beta pruning negamax search
// Except there's no pruning right now because the heuristic is bad
int Search::alphaBeta(Game& game, int depth, int stopDepth,
                      int alpha, int beta, int dbgVerbosity) {
    // Timeout
    if (curTime() > begin_time + timeout) {
      return scorer.score(game);
    } 

    // We'll check if the game is over later, idk how to do it yet

    // Reached search depth limit, return static evaluation
    // We don't do quiescence search for now because this game 
    // doesn't really have "capture-backs" like chess
    // So it's hard to really measure 
    // In the future we might for instance check if any of the next 2
    // Player moves can take an enemy piece
    if (depth == stopDepth) {
      return scorer.score(game);
    }

    // We perform recursive search.
    // To begin, we generate moves
    std::vector<Move> moves;
    
    // Enemy can move any color
    if (game.is_enemy_turn()) {
        for (int card = 0; card < (int) game.hand_size; ++card) {
            for (int color = 0; color < 4; ++color) {
                // Make sure enemy actually has this color
                if (game.enemies[color].count())
                    moves.push_back(Move(MoveType::NORMAL, card, color+4));
            }
        }
    } 
    // Player can only move current color
    else {
        for (int card = 0; card < (int) game.hand_size; ++card) {
            // I'm going to go ahead and assume player_id stores the player's whose turn it is to move color
            moves.push_back(Move(MoveType::NORMAL, card, game.player_id));
            
            // Player rotate card
            // for (int angle = 1; angle <= 3; ++angle)
                // moves.push_back(Move(MoveType::ROTATE, card, angle));
        }

        if (game.total_score > 0)
            for (auto xy : spawnPos[game.player_id])
                moves.push_back(Move(MoveType::BUY, xy[0], xy[1]));
    }


    // Order the moves.
    moveOrderer.order(game, moves);
 
    // Recursively search each of them, updating alpha as needed
    for (Move move : moves) {
        // Can only copy game for now, no undo :(
        Game tmp = game; 
        tmp.make_move(move);
        // Get evaluation with modified negamax due to wonky turn rules
        int eval;
        // flip eval if next search was with opposite team
        if (tmp.is_enemy_turn() != game.is_enemy_turn()) 
            eval = -alphaBeta(tmp, depth+1, stopDepth, -beta, -alpha, dbgVerbosity);
        else
            eval = alphaBeta(tmp, depth+1, stopDepth, alpha, beta, dbgVerbosity);
        // tmp.undo_move(move);

        if (dbgVerbosity >= 2)

        if (dbgVerbosity >= 3) {
        // if (depth == 0) {
          cerr << "--------EVAL---------" << endl;
          // cerr << tmp << "\n";
          // cerr << "GameIsEnemyTurn: " << game.is_enemy_turn() << endl;
          // cerr << "Depth: " << depth << endl;
          cerr << "Move: " << typeOfMove(move.type) << " " << move.card << " " << move.color << endl;
          cerr << "Eval: " << " " << eval << endl;
          // if (eval > 0) cerr << tmp << endl;
        }

        // beta prune.
        // beta is the best we could do in an earlier branch, so opponent will never play this move
        if (eval >= beta) {
            // cerr << "Beta prune - eval=" << eval << ", beta=" << beta << endl;
            // Fail-low
            return eval;
        }

        // new best move
        if (eval > alpha) {
            alpha = eval;

            // Update first move to be made if this search is the root
            if (depth == 0) {
                newBestMove = move;
                newBestEval = eval;
            }
        }
    }

    if (curTime() > begin_time + timeout) return 0;

    if (depth == 0) {
        searchCompleted = true;
    }
    return alpha;
}
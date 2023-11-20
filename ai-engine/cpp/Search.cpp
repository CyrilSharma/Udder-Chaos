#include "Search.h"

#define debug(x) std::cerr << #x << ": " << x << std::endl

Search::Search(GameConfig gc, int sc, uint64_t to, int md):
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
Move Search::beginSearch(int dbg) {
    begin_time = curTime();

    // might need a nullmove member in the future
    Move bestMove = Move(MoveType::NONE, -1, -1);
    int bestEval = -1;
    

    int curDepth = 1;
    while (curDepth <= max_depth) {
        if (curTime() > begin_time + timeout) break;
        
        if (dbg) cerr << "Initiating search of depth " << curDepth << endl;

        // Recursive tree search to curDepth
        alphaBeta(game, 0, curDepth, -inf, inf, dbg);

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
        int eval = -alphaBeta(tmp, depth+1, stopDepth, -beta, -alpha);

        if (dbgVerbosity > 3) {
          cerr << tmp << "\n";
          cerr << "Move: " << move.card << " " << move.color << "\n";
          cerr << "Eval: " << " " << eval << "\n";
        }

        // beta prune.
        // beta is the best we could do in an earlier branch, so opponent will never play this move
        if (eval >= beta) {
            // cerr << "Beta prune - eval=" << eval << ", beta=" << beta << endl;
            // Fail-high
            return beta;
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
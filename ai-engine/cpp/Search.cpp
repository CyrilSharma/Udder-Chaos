#pragma once
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
Move Search::beginSearch(int dbgVerbosity) {
    begin_time = curTime();

    // might need a nullmove member in the future
    Move bestMove = Move(-1, -1);
    int bestEval = -1;
    
    int curDepth = 1;
    while (curDepth < max_depth) {
        if (curTime() > begin_time + timeout) break;

        // Recursive tree search to curDepth
        alphaBeta(game, 0, curDepth, -inf, inf);

        if (searchCompleted) {
            bestMove = newBestMove, bestEval = newBestEval;
            curDepth++;
        }
    }

    return bestMove;
}

// Alpha-beta pruning negamax search
// Except there's no pruning right now because the heuristic is bad
int Search::alphaBeta(Game& game, int depth, int stopDepth, int alpha, int beta) {
    // Timeout
    if (curTime() > begin_time + timeout) { return 0; } 

    // We'll check if the game is over later, idk how to do it yet

    // Reached search depth limit, return static evaluation
    // We don't do quiescence search for now because this game 
    // doesn't really have "capture-backs" like chess
    // So it's hard to really measure 
    // In the future we might for instance check if any of the next 2
    // Player moves can take an enemy piece
    if (depth == stopDepth) { return scorer.score(game); }

    // We perform recursive search.
    // To begin, we generate moves
    std::vector<Move> moves;
    for (int card = 0; card < (int) game.hand_size; ++card) {
        // Enemy can move any color
        if (game.is_enemy_turn()) {
            for (int color = 0; color < 4; ++color) {
                // Make sure enemy actually has this color
                if (game.enemies[color].count())
                    moves.push_back(Move(card, color+4));
            }
        } 
        // Player can only move current color
        else {
            // I'm going to go ahead and assume player_id stores the player's whose turn it is to move color
            moves.push_back(Move(card, game.player_id));
        }
    }

    // Order the moves.
    moveOrderer.order(game, moves);

    // Recursively search each of them, updating alpha as needed
    for (Move move : moves) {
        // Can only copy game for now, no undo :(
        Game tmp = game;
        tmp.make_move(move);
        int eval = -alphaBeta(tmp, depth+1, stopDepth, -beta, -alpha);

        cerr << "Move: " << move.card << " " << move.color << endl;
        cerr << "Eval: " << " " << eval << endl;

        // beta prune.
        
        // beta is the best we could do in an earlier branch, so opponent will never play this move
        if (eval >= beta) {
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

    if (depth == 0) {
        searchCompleted = true;
    }
    return alpha;
}
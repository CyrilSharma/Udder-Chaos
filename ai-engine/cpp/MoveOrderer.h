#include "Game.h"
#include "Utils.h"
#include <vector>

// Move orderer orders moves for alpha beta pruning to be more effective
struct MoveOrderer {
    // as a heuristic, prioritize moves which capture pieces
    // TODO more heuristics
    void order(Game game, std::vector<Move> moves) {
        int num_moves = moves.size();
        vector<int> score(num_moves);
        // simulate each move and update score
        for (int i = 0; i < num_moves; i++) {
            // There are 12 ROTATE moves.
            // Most are probably useless.
            if (moves[i].type == ROTATE) score[i] = 0;
            else if (moves[i].type == BUY) score[i] = 1;
            else score[i] += game.score_estimate(moves[i]);
        }

        // Simply insertion sort since small list
        for (int i = 1; i < num_moves; i++) {
            for (int j = i; j > 0; --j) {
                if (score[j] < score[j-1]) {
                    std::swap(score[j], score[j-1]);
                    std::swap(moves[j], moves[j-1]);
                }
            }
        }
        
        return;
    }
};
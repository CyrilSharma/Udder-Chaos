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

        int start_count = game.count_pieces();

        // simulate each move and update score
        for (int i = 0; i < num_moves; i++) {
            Game tmp = game;
            tmp.make_move(moves[i]);
            // Score is equal to how many pieces got removed in this turn
            // obviously flawed heuristic but idc
            score[i] += (start_count - tmp.count_pieces());
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
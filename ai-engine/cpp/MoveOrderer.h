#include "Game.h"
#include "Utils.h"
#include <vector>

// Move orderer orders moves for alpha beta pruning to be more effective
struct MoveOrderer {
    // Literally doesn't do anything right now
    // maybe add logic here later
    void order(Game game, std::vector<Move> moves) {
        // some garbage to get rid of warnings for now
        game.area();
        moves[0];
        return;
    }
};
#pragma once
#include <boost/dynamic_bitset.hpp>
#include <vector>
#include <chrono>
#include "CardQueue.h"
#include "Utils.h"
#include "Helpers.h"
#include "Game.h"

using dynamic_bitset = boost::dynamic_bitset<>;

/**
 * Search tree algos
 * TODO?
*/

struct Search {

    const Game game;
    Search(GameConfig gc) : game(gc) {
        // ?
    }

    int getMove(uint32_t timeout = 1000) {
        
    }
};
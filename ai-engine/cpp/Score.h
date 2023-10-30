#pragma once
#include <vector>
#include <random>
#include "Game.h"

/** Heuristics */
uint32_t score(const Game &game) {
    // future heuristic ideas
    // Piece positions
    // Player piece count
    // Enemy piece count
    // Player score amount
    // Game turn (later is better for ai)
    return 2 * game.all_players.count() - 3 * game.all_enemies.count();
}
#pragma once
#include <vector>
#include <random>
#include "Game.h"

/** Heuristics */
uint32_t score(const Game &game) {
    // Do some cool heuristic stuff here!!
    return rand() % 100 - 50;
}
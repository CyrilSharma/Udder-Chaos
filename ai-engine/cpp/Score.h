#pragma once
#include "Game.h"

struct Scorer {
    enum {def = 0, playerPcCt = 1, enemyPcCt = 2, turn = 3, constant = 4};

    // Score weighting - higher is better (for ai)
    enum {epwt = 3, ppwt = -3};

    // constructor with scorer type, 0 is default, anything else is a debug scorer
    int typ;

    Scorer (int typ = 0);
    int count_players(Game &game);
    int count_enemies(Game &game);
    int staticEval(Game &game);
    int score(Game &game);
};
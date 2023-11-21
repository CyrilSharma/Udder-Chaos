#pragma once
#include <functional>

#include "Game.h"

struct Scorer {
    // This will be called by score.
    function<int(Game &)> eval;

    // Score weighting - higher is better (for ai)
    enum {epwt = 3, ppwt = -3};

    Scorer (function<int(Game &)> f = nullptr);
    int score(Game &game);
    int evaluator(Game &game);
};
#pragma once
#include <vector>
#include <random>
#include "Game.h"

struct Scorer {
    enum {def = 0, playerPcCt = 1, enemyPcCt = 2, turn = 3, constant = 4};
    int typ;
    Scorer (int typ = 0) : typ(typ) {}

    /** Heuristics */
    uint32_t score(const Game &game) {
        switch(typ) {
            // default score
            case def: return _score(game);
            
            // debug scorers
            case playerPcCt: return game.all_players.count(); 
            case enemyPcCt: return game.all_enemies.count(); 
            case turn: return game.turn; 
            case constant: return 5; 
        }
        std::cerr << "Scorer invalid type: " << typ << std::endl;
        exit(1);
    }

    int _score(const Game &game) {
        // future heuristic ideas
        // Piece positions
        // Player piece count
        // Enemy piece count
        // Player score amount
        // Game turn (later is better for ai)
        if (game.all_players.count() > 0) cout << game.all_players.count() << endl;
        int ppscore = 2 * game.all_players.count(); 
        int epscore = -3 * game.all_enemies.count();
        // cerr << "SCORE IS: " << ppscore + epscore << endl;
        return ppscore + epscore;
    }
};
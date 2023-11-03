#pragma once
#include <vector>
#include <random>
#include "Game.h"

struct Scorer {
    enum {def = 0, playerPcCt = 1, enemyPcCt = 2, turn = 3, constant = 4};

    // Score weighting
    enum {epwt = 3, ppwt = -3};

    // constructor with scorer type, 0 is default, anything else is a debug scorer
    int typ;
    Scorer (int typ = 0) : typ(typ) {}

    /** Heuristics */
    uint32_t score(Game &game) {
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

    int _score(Game &game) {
        // future heuristic ideas
        // Piece positions
        // Player piece count
        // Enemy piece count
        // Player score amount
        // Game turn (later is better for ai)
        int ppct = 0, epct = 0;
        for (int i = 0; i < 4; i++) ppct += game.players[i].count(), epct += game.enemies[i].count();

        int ppscore = ppwt*ppct;
        int epscore = epwt*epct;
        // cerr << "SCORE IS: " << ppscore + epscore << endl;
        
        return ppscore + epscore;
    }
};
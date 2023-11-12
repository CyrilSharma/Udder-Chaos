#pragma once
#include <vector>
#include <random>
#include "Game.h"

struct Scorer {
    enum {def = 0, playerPcCt = 1, enemyPcCt = 2, turn = 3, constant = 4};

    // Score weighting - higher is better (for ai)
    enum {epwt = 3, ppwt = -3};

    // constructor with scorer type, 0 is default, anything else is a debug scorer
    int typ;
    Scorer (int typ = 0) : typ(typ) {
        if (typ != 0) {
            cerr << "Custom scorer: heuristic = " << typ << endl;
        }
    }

    int count_players(Game &game) {
        int ppct = 0;
        for (int i = 0; i < 4; i++) ppct += game.players[i].count();
        return ppct;
    }

    int count_enemies(Game &game) {
        int epct = 0;
        for (int i = 0; i < 4; i++) epct += game.enemies[i].count();
        return epct;
    }

    /** Heuristics */
    int score(Game &game) {
        switch(typ) {
            // default score
            case def: return staticEval(game);
            
            // debug scorers
            case playerPcCt: return -count_players(game); 
            case enemyPcCt: return count_enemies(game); 
            case turn: return game.turn; 
            case constant: return 0; 
        }
        std::cerr << "Scorer invalid type: " << typ << std::endl;
        exit(1);
    }

    int staticEval(Game &game) {
        // future heuristic ideas
        // Piece positions
        // Player piece count
        // Enemy piece count
        // Player score amount
        // Game turn (later is better for ai)
        int ppct = count_players(game), epct = count_enemies(game);
        int ppscore = ppwt * ppct;
        int epscore = epwt * epct;
        
        return ppscore + epscore;
    }
};
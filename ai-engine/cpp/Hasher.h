#pragma once
#include "Game.h"
#include <random>
#include <vector>

// Zobrist hashing implementation
// Assumes there are at most 8 types pieces in the game
// And that score is no higher than 100 I guess
// Actually this hasher dies if cards are more than ~10 moves
// Because it has to create a unique hash value for every possible card
// And it doesn't generate only the legal ones
struct Hasher {
    const int MAX_TURN = 1000, MAX_SCORE = 100;
    int seed = 236478; // intelligently chosen seed (extremely important (do not touch (real)))
    std::mt19937_64 rng(seed);
    std::vector<uint64_t> pieceArr[8], turnArr, scoreArr, playerScoreArr[4];
    std::vector<std::vector<uint64_t>> cardArr; 

    // Initialize random values for all piece/card/turn/score/location combinations
    Hasher(Game& g) {
        // Piece hashes
        for (int pieceType = 0; pieceType < 8; pieceType++) {
            for (int sq = 0; sq < g.area(); sq++) {
                pieceArr[pieceType].push_back(rng());
            }
        }
        
        // Turn hashes
        for (int turn = 0; turn < MAX_TURN; turn++) {
            turnArr.push_back(rng());
        }

        // Score hashes
        for (int score = 0; score < MAX_SCORE; score++) {
            scoreArr.push_back(rng());
        }

        // Player score hashes
        for (int player = 0; player < 4; player++) {
            for (int score = 0; score < MAX_SCORE; score++) {
                playerScoreArr[player].push_back(rng());
            }
        }

        // Card hashes
        assert(g.cards.size());
        uint64_t maxCardID = g.cards[0].getMaxID();
        cardArr.resize(maxCardID);
        for (int cardType = 0; cardType < maxCardID; cardType++) {
            for (int pos = 0; pos < g.ncards; pos++) {
                cardArr[cardType].push_back(rng());
            }
        }
    }

    // Returns zobrist hash value of current game
    uint64_t getZobristHash(Game& g) {
        uint64_t hash = 0;
        // Idk how to do this part
        for (int player = 0; player < 4; player++) {
            // Xor hash for each player position, and also enemy position
        }

        // TODO actual hashing functionality

        hash = turnArr[g.turn];
        return hash;
    }
};

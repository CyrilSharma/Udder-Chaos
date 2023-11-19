#pragma once
#include <vector>
#include <chrono>
#include "Utils.h"
#include "Helpers.h"
#include "Game.h"
#include "Hasher.h"
#include "MoveOrderer.h"
#include "Score.h"

const int inf = 1e9;
struct Search {
    // Stored gamestate
    Game game;
    // Heuristic scorer
    Scorer scorer;
    // Zobrist hasher (unused as of right now)
    Hasher hasher;
    // Move orderer
    MoveOrderer moveOrderer;
    // Timeout in ms
    uint64_t timeout;
    // Max depth to search
    int max_depth;
    // Best moves found during a particular search
    Move newBestMove = Move(MoveType::NONE, 0, 0);
    int newBestEval = 0;
    // Flag for entire layer searched
    bool searchCompleted = false;
    // Beginning time, updated each time search is called
    uint64_t begin_time;

    Search(GameConfig gc, int sc=0, uint64_t to=1000, int md=inf);
    void makePlayerMove(int move);
    void rotatePlayerCard(int index, int rotation);
    void purchaseUFO(int row, int column);
    void makeAIMove(int move, int color);
    Move beginSearch(int dbgVerbosity = 0);
    int alphaBeta(Game& game, int depth, int stopDepth, int alpha, int beta);
};
#pragma once
#include <vector>
#include <chrono>
#include "Utils.h"
#include "Helpers.h"
#include "Game.h"
#include "MoveOrderer.h"
#include "Score.h"

const int inf = 1e9;
struct Search {
    // Stored gamestate
    Game game;
    Scorer scorer;
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
    // Verbosity of the search.
    int dbgVerbosity = 0;

    // Format Code exactly like the Cilk example
    struct Position {
      Game game;
      int alpha;
      int beta;
    };

    Search(GameConfig gc, uint64_t to=1000, int md=inf);
    Search(GameConfig gc, Scorer sc, uint64_t to=1000, int md=inf);
    
    void makePlayerMove(int move);
    void rotatePlayerCard(int index, int rotation);
    void purchaseUFO(int row, int column);
    void makeAIMove(int move, int color);

    void gen_moves(vector<Move> &moves, int player);
    Move beginSearch(int dbgVerbosity = 0, bool fixedDepth = false);
    int alphaBeta(Position &prev, Move move, int depth);
};
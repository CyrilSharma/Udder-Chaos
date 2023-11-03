#pragma once
#include <boost/dynamic_bitset.hpp>
#include <vector>
#include <chrono>
#include "CardQueue.h"
#include "Utils.h"
#include "Helpers.h"
#include "Game.h"
#include "Score.h"

using dynamic_bitset = boost::dynamic_bitset<>;

#define debug(x) std::cerr << #x << ": " << x << std::endl

/*
 * Search tree algos
 * TODO?
 */

struct Search {
    Game game;
    Scorer scorer;
    Search(GameConfig gc, int sc=0) : game(gc), scorer(sc) {}

    map<Game, int> evals;

    // Update internal state of search
    void makePlayerMove(int move) {
      game.player_move(move);
    }

    // Update internal state of search (with AI move!)
    void makeAIMove(int move, int color) {
        game.enemy_move(move, color);
    }

    // Timeout passed in for now, might be a const or smt later
    // verbosity: Debug print level. 1 is some basic prints, 2 is more in depth
    pair<int, int> getMove(uint64_t timeout = 1000, int verbosity = 0, int max_it = 1e9) {
        if (verbosity > 0) cerr << game << endl;
        if (verbosity > 0) cerr << "Initiating search with timeout = " << timeout << " and max_iterations = " << max_it << endl;

        auto start = curTime();

        // Remove evals for states made before this turn, we no longer use them
        auto it = evals.begin();

        while (it != evals.end() && it->first.turn < game.turn) it = evals.erase(it);

        // Score, first move, game state
        auto cmp = [] (auto a, auto b) { return a.first.first < b.first.first; };
        priority_queue<
          pair<pair<uint32_t, pair<int, int>>, Game>,
          vector<pair<pair<uint32_t, pair<int, int>>, Game>>,
          decltype(cmp)
        > states(cmp), next_states(cmp);

        // Using game.hand_size to indicate that this is the initial state
        states.push({{0, {-1, -1}}, game});
        pair<int, int> best_move = {0, 0}; int best_eval = INT_MIN;
        
        int iteration = 1, turns = 0;
        // basic time check for now, can optimize later
        while (iteration < max_it && curTime() - start < timeout) {
            if (verbosity > 0 && iteration % 100 == 0) cerr << "iteration: " << iteration << endl;
            // Store state metadata with score and the first move made
            assert(!states.empty()); 
            auto [state_metadata, state] = states.top(); states.pop();
            auto [prev_eval, first_move] = state_metadata;
            
            // Assume that each player is more likely to play better moves, so search accordingly
            // Insert negative evals when player turns to search best moves for the players first
            int state_eval = state.is_enemy_turn() ? INT_MIN : INT_MAX;
            for (uint32_t choice = 0; choice < game.hand_size; ++choice) {
                if (state.is_enemy_turn()) {
                    for (uint32_t color = 0; color < 4; ++color) {
                        auto tmp_state = state;
                        tmp_state.enemy_move(choice, color);
                        // cerr << "SEARCH: " << tmp_state << endl;
                        int tmp_eval = scorer.score(tmp_state);

                        // Prune poor branches, can be improved in future
                        if (tmp_eval < state_eval) {
                            if (verbosity > 1) {
                                cerr << "Pruned state: state_eval = " << state_eval << ", tmp_eval = " << tmp_eval << endl;
                            }
                            continue;
                        }

                        // Pruned branches, so tmp_eval >= state_eval
                        state_eval = tmp_eval;
                        auto tmp_first_move = first_move;
                        if (first_move.first == -1) tmp_first_move = make_pair(choice, color);
                        next_states.push({{tmp_eval, tmp_first_move}, tmp_state});
                    }
                }
                else {
                    auto tmp_state = state;
                    tmp_state.player_move(choice);
                    int tmp_eval = scorer.score(tmp_state);

                    // Prune poor branches, can be improved in future
                    if (tmp_eval > state_eval) {
                        if (verbosity > 1) cerr << "Pruned state: state_eval = " << state_eval << ", tmp_eval = " << tmp_eval << endl;
                        continue;
                    }

                    // Lower branches are pruned
                    state_eval = tmp_eval;

                    // When calling search it should never be the player's turn at the start
                    // assert (first_move.first != -1);

                    next_states.push({{tmp_eval, first_move}, tmp_state});
                }
            }

            if (state_eval > best_eval && state_metadata.second.first != -1) {
                best_eval = state_eval;
                best_move = state_metadata.second;
                if (verbosity > 0) {
                    cerr << "Updating best move. New best eval is: " << best_eval << endl;
                    cerr << "Move(card, color) is: " << state_metadata.second.first << ", " << state_metadata.second.second << endl; 
                }
            }

            // Save evaluation for now, don't really do anything with them yet.
            evals[state] = state_eval;

            // Once run out of this layer move to next layer
            if (states.empty()) {
                states.swap(next_states);

                ++turns;
                if (verbosity > 0) cerr << "Layer " << turns << " finished searching." << endl;
            }
            ++iteration;
        } 

        if (verbosity > 0) {
            cerr << "Total iterations: " << iteration << endl;
            cerr << "Turns ahead reached: " << turns << endl;
        }

        game.enemy_move(best_move.first, best_move.second);
        return best_move;
    }
};
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

/*
 * Search tree algos
 * TODO?
 */

struct Search {
    Game game;
    Search(GameConfig gc) : game(gc) {}

    map<Game, int> evals;

    // Timeout passed in for now, might be a const or smt later
    int getMove(uint64_t timeout = 1000) {
        auto start = curTime();

        // Remove evals for states made before this turn, we no longer use them
        auto it = evals.begin();
        while (it != evals.end() && it->first.turn < game.turn) it = evals.erase(it);

        // Score, game state
        auto cmp = [] (auto a, auto b) { return a.first.first < b.first.first; };
        priority_queue<
          pair<pair<uint32_t, uint32_t>, Game>,
          vector<pair<pair<uint32_t, uint32_t>, Game>>,
          decltype(cmp)
        > states(cmp), next_states(cmp);

        // Using game.hand_size to indicate that this is the initial state
        states.push({{0, game.hand_size}, game});
        int best_move = 0, best_eval = INT_MIN;
        // basic time check for now, can optimize later
        while (curTime() - start < timeout) {
            // Store state metadata with score and the first move made 
            auto [state_metadata, state] = states.top(); states.pop();
            auto [prev_eval, first_move] = state_metadata;
            
            // Assume that each player is more likely to play better moves, so search accordingly
            // Insert negative evals when player turns to search best moves for the players first
            int state_eval = state.is_enemy_turn() ? INT_MIN : INT_MAX;
            for (uint32_t choice = 0; choice < game.hand_size; ++choice) {
                auto tmp_state = state;
                if (tmp_state.is_enemy_turn()) {
                    tmp_state.enemy_move(choice);
                    int tmp_eval = score(tmp_state);

                    // Prune poor branches, can be improved in future
                    if (tmp_eval < state_eval) {
                        continue;
                    }

                    // Pruned branches, so tmp_eval > state_eval
                    state_eval = tmp_eval;
                    if (first_move == game.hand_size) first_move = choice;
                    next_states.push({{tmp_eval, first_move}, tmp_state});
                }
                else {
                    tmp_state.player_move(choice);
                    int tmp_eval = score(tmp_state);

                    // Prune poor branches, can be improved in future
                    if (tmp_eval > state_eval) {
                        continue;
                    }

                    // Lower branches are pruned
                    state_eval = tmp_eval;
                    if (first_move == game.hand_size) first_move = choice;
                    next_states.push({{tmp_eval, first_move}, tmp_state});
                }
            }

            if (state_eval > best_eval && state_metadata.second != game.hand_size) {
                best_eval = state_eval;
                best_move = state_metadata.second;
            }

            // Save evaluation for now, don't really do anything with them yet.
            evals[state] = state_eval;
        } 
        
        return best_move;
    }
};
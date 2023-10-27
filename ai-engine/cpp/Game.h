#pragma once
#include <bitset>
#include <vector>
#include "Utils.h"
#include "Helpers.h"
using namespace std;

/*
 * Why is this not in a cpp file?
 * See: https://softwareengineering.stackexchange.com/questions/373916/c-preferred-method-of-dealing-with-implementation-for-large-templates
 * TLDR: templates need to be entirely in header files. There are hacky ways to get around it if you want shorter build time,
 * But, we barely have any files so I'm gonna do the easiest approach.
 * Alternatively, switch std::bitset to boost::bitset, and we won't need templates.
 */

template <uint64_t width, uint64_t height, uint64_t ncards = 16, uint64_t hand_size = 3>
struct Game {
  /*--- Utility Functions -----*/
  static constexpr int64_t area() {
    return (width * height);
  }

  static constexpr int64_t ncard_bits() {
    return 64 -__builtin_clz(ncards - 1);
  }

  static constexpr int64_t queue_length() {
    return (ncards * ncard_bits());
  }

  static constexpr bitset<area()> player_hand_mask() {
    bitset<queue_length()> m{0b0};
    for (int i = 0; i < ncard_bits(); i++) {
      bitset<queue_length()> unit{0b1};
      m |= unit << i;
    }
    return m;
  }

  static constexpr bitset<area()> enemy_hand_mask() {
    bitset<queue_length()> m1{(1LL << (ncard_bits() + hand_size)) - 1};
    bitset<queue_length()> m2{(1LL << (hand_size)) - 1};
    return (m1 ^ m2);
  }

  static constexpr bitset<area()> right_edge_mask() {
    bitset<area()> res = 0b0;
    for (int i = 0; i < height; i++) {
      bitset<area()> m {1};
      m <<= (i * width + (width - 1));
      res |= m;
    }
    return res;
  }

  static constexpr bitset<area()> up_edge_mask() {
    bitset<area()> m = 0b0;
    bitset<area()> row { (0b1 << width) - 1 };
    m |= row << (width * (height - 1));
    return m;
  }

  static constexpr bitset<area()> left_edge_mask() {
    bitset<area()> res = 0b0;
    for (int i = 0; i < height; i++) {
      bitset<area()> m {1};
      m <<= (i * width);
      res |= m;
    }
    return res;
  }

  static constexpr bitset<area()> down_edge_mask() {
    bitset<area()> m = 0b0;
    for (int i = 0; i < width; i++) {
      m |= (0b1) << i;
    }
    return m;
  }

  /*--- Struct Members ---*/
  int64_t turn = 0;
  int64_t player_id = 0;
  array<Card, ncards> cards;
  bitset<queue_length()> queue = { 0 };
  array<bitset<area()>, 4> players = { 0 };
  array<bitset<area()>, 4> player_scores = { 0 };
  array<bitset<area()>, 4> enemies;
  bitset<area()> impassible = { 0 };
  bitset<area()> score_tiles = { 0 };
  bitset<area()> cows = { 0 };

  /*------ Debug + Testing ----------*/

  /*
   * Puts the board in a convenient state.
   */

  vector<vector<int>> viewBoard() {
    vector<vector<int>> out(height, vector<int>(width));
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        out[i][j] = 0;
        auto mask = bitset<area()>{1};
        mask <<= (width * i + j);
        if ((impassible & mask).any()) {
          out[i][j] = 1;
        } else if ((cows & mask).any()) {
          out[i][j] = 2;
        }
      }
    }
    return out;
  } /* viewBoard() */

  /*
   * Puts the pieces in a convenient state.
   */

  vector<Piece> viewPieces() {
    vector<Piece> out;
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        for (int k = 0; k < 4; k++) {
          bitset<area()> msk{1};
          msk <<= (width * i + j);
          if ((players[k] & msk).any()) {
            out.push_back(Piece { i, j, k + 1});
            break;
          } else if ((enemies[k] & msk).any()) {
            out.push_back(Piece { i, j, k + 5 });
            break;
          }
        }
      }
    }
    return out;
  } /* viewPieces() */

  /*
   * Puts the Cards in a convenient state.
   */

  vector<Card> viewCards() {
    vector<Card> out(ncards);
    for (uint64_t i = 0; i < ncards; i++) {
      // Hope and pray there aren't 1e64 cards.
      bitset<queue_length()> msk { (1ULL << ncard_bits()) - 1 };
      auto idx = ((queue >> ncard_bits() * i) & msk).to_ullong();
      out[i] = cards[idx];
    }
    return out;
  } /* viewCards() */


  /*--- Game Logic -----*/

  /*
   * Parses a GameConfig into a more efficient, internal
   * representation.
   */

  Game(GameConfig config) {
    for (uint64_t i = 0; i < ncards; i++) {
      cards[i] = config.cards[i];
      bitset<queue_length()> msk{i};
      msk <<= (i * ncard_bits());
      queue |= msk; 
    }
    for (auto p: config.pieces) {
      bitset<area()> msk {1};
      msk <<= p.i * width + p.j;
      if (p.tp < 5) {
        players[p.tp - 1] |= msk;
      } else {
        enemies[(p.tp - 1) & 0b11] |= msk;
      }
    }
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        int tile = config.board[i][j];
        bitset<area()> m{1};
        m <<= (i * width + j);
        if (tile == 1) {
          impassible |= m;
        } else if (tile == 2) {
          score_tiles |= m;
          cows |= m;
        }
      }
    }
  } /* Game() */


  /*
  * choice is expected to be the numerical
  * index IN YOUR HAND of the card you wish to play.
  * we do not check if the card is in your hand.
  */

  void player_move(int choice) {
    int index = (queue >> choice * ncard_bits()) & player_hand_mask();
    auto moves = cards[index].moves;
    for (Direction move: moves) {
      if (turn % 3 == 2) {
        play_player_movement(move);
      }
    }
    if (turn % 2 == 1) {
      player_id = (player_id + 1) & 0b11;
    }
    turn += 1;
  } /* player_move() */


  /*
  * choice is expected to be the numerical
  * index of the card you wish to play.
  * we do not check if the card is in your hand.
  * 
  * color is which color you want to move with this action.
  */

  void enemy_move(int choice) {
    int index = (queue >> (choice * ncard_bits() + hand_size)) & player_hand_mask();
    auto moves = cards[index].moves;
    for (Direction move: moves) {
      play_enemy_movement(move, choice);
    }

    player_id = (player_id + 1) & 0b11;
    turn += 1;
  } /* enemy_move() */


  /*
  * Moves the current piece in the desired direction.
  * applying all necessary side-effects. 
  */

  void play_enemy_movement(Direction d, int choice) {
    auto enemy_mask = enemies[choice];
    bitset<area()> edge_masks[4] = {
      right_edge_mask(), up_edge_mask(),
      left_edge_mask(), down_edge_mask()
    };
    int shift[4] = { 1, width, -1, -width };

    // Wall_mask contains all pieces aligned with a wall.
    bitset<area()> wall_mask;
    bitset<area()> cur_mask = impassible;
    while (cur_mask != 0) {
      // Everywhere there was a wall last time, assume there's a wall this time.
      cur_mask = (shift[d] > 0) ? (cur_mask << shift[d]) : (cur_mask >> -shift[d]);
      // If there isn't a unit at this square / went off the grid, remove from mask.
      cur_mask &= enemy_mask & edge_masks[d];
      wall_mask |= cur_mask;
    }

    // Shift once in the desired direction, keep all blocked pieces where they are.
    enemy_mask = (shift[d] > 0) ? (~wall_mask & enemy_mask) << shift[d] :
      (~wall_mask & enemy_mask) >> -shift[d];

    // Kill players the enemy hits.
    for (int i = 0; i < 4; i++) {
      players[i] &= ~enemy_mask;
    }

    enemies[choice] = enemy_mask;
  } /* play_enemy_movement() */

  /*
  * Moves the current piece in the desired direction.
  * applying all necessary side-effects. 
  */

  void play_player_movement(Direction d) {
    auto player_mask = players[player_id];
    auto score_mask = player_scores[player_id];
    bitset<area()> edge_masks[4] = {
      right_edge_mask(), up_edge_mask(),
      left_edge_mask(), down_edge_mask()
    };
    uint64_t shift[4] = { 1, width, 1, width };

    // Wall_mask contains all pieces aligned with a wall.
    bitset<area()> wall_mask { 0 };
    bitset<area()> cur_mask = impassible;
    while (cur_mask != 0) {
      // Everywhere there was a wall last time, assume there's a wall this time.
      cur_mask = (d < 2) ? (cur_mask << shift[d]) : (cur_mask >> shift[d]);
      // If there isn't a unit at this square / went off the grid, remove from mask.
      cur_mask &= player_mask & edge_masks[d];
      wall_mask |= cur_mask;
    }

    print_bitmask<width, height>(player_mask);

    // Move pieces in the desired direction.
    auto moved = (d < 2) ? (~wall_mask & player_mask) << shift[d] :
      (~wall_mask & player_mask) >> shift[d];
    
    // cout<<"Moved - \n";
    // print_bitmask<width, height>(moved);

    // cout<<"Move Masked - \n";
    // print_bitmask<width, height>(moved & ~edge_masks[(d + 2) % 4] & ~impassible);

    // cout<<"Wall Masked - \n";
    // print_bitmask<width, height>(player_mask & wall_mask);

    // cout<<"Edge Masked - \n";
    // print_bitmask<width, height>(player_mask & edge_masks[d]);
    
    // If we shifted into a wall or off the edge, delete the shifted bit.
    // Place anything that hit a wall back where it was.
    // Place anything that hit an edge back where it was.
    player_mask =
      (moved & ~edge_masks[(d + 2) % 4] & ~impassible) |
      (player_mask & wall_mask) |
      (player_mask & edge_masks[d]);

    // cout<<"Final Player Mask - \n";
    // print_bitmask<width, height>(player_mask);


    // Move the score mask identically to the player mask.
    moved = (d < 2) ? (~wall_mask & score_mask) << shift[d] :
      (~wall_mask & score_mask) >> shift[d];
    score_mask =
      (moved & ~edge_masks[(d + 2) % 4] & ~impassible) |
      (score_mask & wall_mask) |
      (score_mask & edge_masks[d]);


    // For every player that doesn't have a cow, delete the corresponding cow.
    cows &= ~(player_mask & ~score_mask);

    // Kill enemies the player hits.
    for (int i = 0; i < 4; i++) {
      enemies[i] &= ~player_mask;
    }

    // The score is 1 for any player on a cow.
    score_mask |= (player_mask & cows);

    players[player_id] = player_mask;
    player_scores[player_id] = score_mask;
  } /* play_player_movement() */
};
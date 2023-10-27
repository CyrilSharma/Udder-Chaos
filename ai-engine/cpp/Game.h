#pragma once
#include <bitset>
#include <vector>
#include "Card.h"
#include "GameConfig.h"
using namespace std;

enum Direction {
  RIGHT = 0,
  UP = 1,
  LEFT = 2,
  DOWN = 3
};

struct Card {
  vector<Direction> moves;
};

struct GameConfig {
  vector<vector<int>> board;
  vector<tuple<int,int,int>> pieces;
  vector<Card> cards;
};

/*
 * Why is this not in a cpp file?
 * See: https://softwareengineering.stackexchange.com/questions/373916/c-preferred-method-of-dealing-with-implementation-for-large-templates
 * TLDR: templates need to be entirely in header files. There are hacky ways to get around it if you want shorter build time,
 * But, we barely have any files so I'm gonna do the easiest approach.
 * Alternatively, switch std::bitset to boost::bitset, and we won't need templates.
 */

template <int64_t width, int64_t height, int64_t ncards = 16, int64_t hand_size = 3>
struct Game {
  int64_t turn = 0;
  array<Card, ncards> cards;
  bitset<ncards * card_bits> queue = { 0 };
  array<bitset<area>, 4> players = { 0 };
  array<bitset<area>, 4> player_scores = { 0 };
  array<bitset<area>, 4> enemies;
  bitset<area> impassible = { 0 };
  bitset<area> score_tiles = { 0 };
  bitset<area> cows = { 0 };

  /*
   * Parses a GameConfig into a more efficient, internal
   * representation.
   */

  Game::Game(GameConfig config) {
    for (int i = 0; i < ncards; i++) {
      queue |= (i << (i * ncard_bits()));
      cards[i] = config.cards[i];
    }
    for (int i = 0; i < pieces.size(); i++) {
      auto [i, j, p] = config.pieces[i];
      if (p < 4) {
        players[p] |= 1 << (i * height + width);
      } else {
        enemies[p & 0b11] |= 1 << (i * height + width);
      }
    }
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        int tile = board[i][j];
        if (tile == 1) {
          impassible |= 1 << (i * height + width);
        } else if (tile == 2) {
          score_tiles |= 1 << (i * height + width);
          cows |= 1 << (i * height + width);
        }
      }
    }
  } /* Game() */

  /*
   * Used for debugging.
   * Renders a few masks to show the state.
   */

  Game::render() {
    // Render Player - Enemy Mask.
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        char c = ' ';
        for (int k = 0; k < 4; k++) {
          if (players[k] & (1 << (width * i + j)) == 1) {
            c = k + '0';
            break;
          }
          if (enemies[k] & (1 << (width * i + j)) == 1) {
            c = k + '4';
            break;
          }
        }
        cout << c;
      }
      cout << '\n';
    }

    // Render Board
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        char c = ' ';
        if (impassible & (1 << (width * i + j))) {
          c = '1';
        } else if (cows & (1 << (width * i + j))) {
          c = '2'
        }
        cout << c;
      }
      cout << '\n';
    }
    cout<<endl;
  } /* render() */

  /*
  * choice is expected to be the numerical
  * index of the card you wish to play.
  * we do not check if the card is in your hand.
  */

  Game::player_move(int choice) {
    int index = (queue >> choice * ncard_bits()) & player_mask();
    auto moves = cards[choice].moves;
    for (Direction move: moves) {
      if (turn % 3 == 2) {
        play_player_movemement(move);
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

  Game::enemy_move(int choice) {
    int index = (queue >> choice * ncard_bits()) & player_mask();
    auto moves = cards[choice].moves;
    for (Direction move: moves) {
      play_enemy_movemement(move, choice);
    }

    player_id = (player_id + 1) & 0b11;
    turn += 1;
  } /* enemy_move() */


  /*
  * Moves the current piece in the desired direction.
  * applying all necessary side-effects. 
  */
  Game::play_enemy_movement(Direction d, int choice) {
    enemy_mask = enemies[choice];
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
    player_mask = (shift[d] > 0) ? (~wall_mask & player_mask) << shift[d] :
      (~wall_mask & player_mask) >> -shift[d];

    // Kill players the enemy hits.
    for (int i = 0; i < 4; i++) {
      players[i] &= ~player_mask;
    }

    enemies[choice] = player_mask;
  } /* play_enemy_movement() */

  /*
  * Moves the current piece in the desired direction.
  * applying all necessary side-effects. 
  */
  Game::play_player_movement(Direction d) {
    player_mask = players_masks[player_id];
    score_mask = player_scores[player_id];
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
      cur_mask &= player_mask & edge_masks[d];
      wall_mask |= cur_mask;
    }

    // Shift once in the desired direction, keep all blocked pieces where they are.
    player_mask = (shift[d] > 0) ? (~wall_mask & player_mask) << shift[d] :
      (~wall_mask & player_mask) >> -shift[d];

    // Move the score mask identiclaly to the player mask.
    score_mask = (shift[d] > 0) ? (~wall_mask & score_mask) << shift[d] :
      (~wall_mask & score_mask) >> -shift[d];

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


  /* Constant functions
   * The bits in a grid mask are ordered increasingly from right to left,
   * And then from bottom to top.
   */

  constexpr int64_t area() { return (width * height); }

  constexpr int64_t ncard_bits() {
    return 1 << (64 -__builtin_clz(ncards - 1));
  }

  constexpr bitset<area()> player_hand_mask() {
    bitset<ncards * card_bits> m{(1LL << ncard_bits(n)) - 1};
    return m;
  }

  constexpr bitset<area()> enemy_hand_mask() {
    int64_t card_bits = 1 << (64 -__builtin_clz(ncards - 1));
    bitset<ncards * card_bits> m1{(1LL << (ncard_bits(n) + hand_size)) - 1};
    bitset<ncards * card_bits> m2{(1LL << (hand_size)) - 1};
    return (m1 ^ m2);
  }

  constexpr bitset<area()> right_edge_mask() {
    bitset<area()> m = 0b0;
    for (int i = 0; i < height; i++) {
      area |= (0b1) << (i * width);
    }
    return area;
  }

  constexpr bitset<area()> up_edge_mask() {
    bitset<area()> m = 0b0;
    bitset<area()> row { (0b1 << width) - 1 };
    m |= row << (width * (height - 1));
    return m;
  }

  constexpr bitset<area()> left_edge_mask() {
    bitset<area()> m = 0b0;
    bitset<area()> row { 0b1 << (width - 1) };
    for (int i = 0; i < height; i++) {
      m |= row;
    }
    return m;
  }

  constexpr bitset<area()> down_edge_mask() {
    bitset<area()> m = 0b0;
    for (int i = 0; i < width; i++) {
      m |= (0b1) << i;
    }
    return m;
  }
};
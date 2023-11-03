#pragma once
#include <boost/dynamic_bitset.hpp>
#include <vector>
#include "CardQueue.h"
#include "Utils.h"
#include "Helpers.h"

using dynamic_bitset = boost::dynamic_bitset<>;

/*
 * Why is this not in a cpp file?
 * See: https://softwareengineering.stackexchange.com/questions/373916/c-preferred-method-of-dealing-with-implementation-for-large-templates
 * TLDR: templates need to be entirely in header files. There are hacky ways to get around it if you want shorter build time,
 * But, we barely have any files so I'm gonna do the easiest approach.
 * Alternatively, switch std::bitset to boost::dynamic_bitset, and we won't need templates.
 * 
 * Game struct contains all the useful functions for simulating game logic 
 * 
 */

struct Game {
  /*--- Utility Functions -----*/
  int64_t area() {
    return (width * height);
  }

  int64_t ncard_bits() {
    return 64 -__builtin_clzll(ncards - 1);
  }

  // Sprint 3 OPT; Remove edge masks and simply use walls for everything.
  const dynamic_bitset right_edge_mask() {
    dynamic_bitset res(area(), 0b0);
    for (uint32_t i = 0; i < height; i++) {
      dynamic_bitset m(area(), 1);
      m <<= (i * width + (width - 1));
      res |= m;
    }
    return res;
  }

  const dynamic_bitset up_edge_mask() {
    dynamic_bitset m(area(), 0);
    dynamic_bitset row(area(), (0b1 << width) - 1);
    m |= row << (width * (height - 1));
    return m;
  }

  const dynamic_bitset left_edge_mask() {
    dynamic_bitset res(area(), 0);
    for (uint32_t i = 0; i < height; i++) {
      dynamic_bitset m(area(), 1);
      m <<= (i * width);
      res |= m;
    }
    return res;
  }

  const dynamic_bitset down_edge_mask() {
    dynamic_bitset m(area(), 0);
    for (uint32_t i = 0; i < width; i++) {
      dynamic_bitset b(area(), 1);
      m |= b << i;
    }
    return m;
  }

  // Comparator for map and things? Idk
  bool operator<(const Game& o) const {
    return turn < o.turn;
  }

  /*--- Struct Members ---*/
  uint64_t width;
  uint64_t height;
  uint64_t ncards;
  uint64_t hand_size;
  uint64_t round_length;
  array<dynamic_bitset, 4> edge_masks;

  int64_t turn = 0;
  int64_t round = 0;
  int64_t player_id = 0;
  CardQueue queue;
  vector<Card> cards;
  array<dynamic_bitset, 6> cow_respawn;
  array<dynamic_bitset, 4> players;
  array<dynamic_bitset, 4> player_scores;
  array<dynamic_bitset, 4> enemies;
  dynamic_bitset impassible;
  dynamic_bitset cows;
  dynamic_bitset all_enemies;
  dynamic_bitset all_players;
  dynamic_bitset wall_mask;

  /*--- Game Logic -----*/

  /*
   * Parses a GameConfig into a more efficient, internal
   * representation.
   */

  Game(GameConfig config):
    width(config.board[0].size()),
    height(config.board.size()),
    ncards(config.cards.size()),
    hand_size(config.hand_size),
    round_length(config.round_length),
    edge_masks({
      right_edge_mask(), up_edge_mask(),
      left_edge_mask(), down_edge_mask()
    }),
    queue(CardQueue(ncards, ncard_bits(), 2 * hand_size)),
    impassible(dynamic_bitset(area(), 0)),
    cows(dynamic_bitset(area(), 0)),
    all_enemies(dynamic_bitset(area(), 0)),
    all_players(dynamic_bitset(area(), 0)),
    wall_mask(dynamic_bitset(area(), 0)) {
    
    for (uint32_t i = 0; i < 4; i++) {
      players[i] = dynamic_bitset(area(), 0);
      player_scores[i] = dynamic_bitset(area(), 0);
      enemies[i] = dynamic_bitset(area(), 0);
    }
    for (uint32_t i = 0; i < round_length; i++) {
      cow_respawn[i] = dynamic_bitset(area(), 0);
    }

    cards.resize(ncards);
    for (uint64_t i = 0; i < ncards; i++) {
      cards[i] = config.cards[i];
      queue.set(i, i);
    }

    for (auto p: config.pieces) {
      dynamic_bitset msk(area(), 1);
      msk <<= p.i * width + p.j;
      if (p.tp < 5) {
        players[p.tp - 1] |= msk;
      } else {
        enemies[(p.tp - 1) & 0b11] |= msk;
      }
    }

    for (uint32_t i = 0; i < height; i++) {
      for (uint32_t j = 0; j < width; j++) {
        int tile = config.board[i][j];
        auto m = dynamic_bitset(area(), 1);
        m <<= (i * width + j);
        if (tile == TileType::PLAIN) {}
        else if (tile == TileType::IMPASSIBLE) {
          impassible |= m;
        } else if (tile == TileType::COW) {
          cows |= m;
        }
      }
    }

  } /* Game() */

  /*
   * returns the winner of the game.
   * -1 if AI, 1 if player, 0 if nobody has won yet.
   */

  int is_jover() {
    bool all_dead = true;
    for (int i = 0; i < 4; i++) {
      if (players[i].count()) continue;
      all_dead = false;
      break;
    }
    if (all_dead) return -1;
    return 0;
    // Need to implement score tiles...
  } /* is_jover() */

  // Temp player turn check
  bool is_enemy_turn() const {
    return turn % 3 == 2;
  }


  /*
   * choice is expected to be the numerical
   * index IN YOUR HAND of the card you wish to play.
   * we do not check if the card is in your hand.
   */

  void player_move(int choice) {
    cows |= cow_respawn[turn % round_length];
    int index = queue.choose(choice);
    auto moves = cards[index].moves;
    for (Direction move: moves) {
      play_player_movement(move);
    }
    player_id = (player_id + 1) & 0b11;
    turn += 1;
  } /* player_move() */

  /*
   * choice is expected to be the numerical
   * index of the card you wish to play.
   * we do not check if the card is in your hand.
   * 
   * color is which color you want to move with this action.
   */

  void enemy_move(int choice, int color) {
    cows |= cow_respawn[turn % round_length];
    int index = queue.choose(choice + hand_size);
    auto moves = cards[index].moves;
    for (Direction move: moves) {
      play_enemy_movement(move, color);
    }
    turn += 1;
  } /* enemy_move() */

  /*
  * Moves the current piece in the desired direction.
  * applying all necessary side-effects. 
  */

  void play_enemy_movement(Direction d, int choice) {
    auto enemy_mask = enemies[choice];
    uint64_t shift[4] = { 1, width, 1, width };

    all_enemies.reset();
    for (int i = choice + 1; i != choice; i = (i + 1) & 0b11) {
      all_enemies |= enemies[i];
    }

    // Wall_mask contains all pieces aligned with a wall.
    wall_mask.reset();
    auto cur_mask = impassible | (edge_masks[d] & enemy_mask) | all_enemies;

    while (cur_mask.any()) {
      // Move backwards, and check if there's player units there.
      int b = (d + 2) % 4;
      cur_mask = (b < 2) ? (cur_mask << shift[b]) : (cur_mask >> shift[b]);
      // If there isn't a unit at this square / went off the grid, remove from mask.
      cur_mask &= enemy_mask & ~edge_masks[d];
      wall_mask |= cur_mask;
    }

    // Shift once in the desired direction, keep all blocked pieces where they are.
    auto moved = (d < 2) ? (~wall_mask & enemy_mask) << shift[d] :
      (~wall_mask & enemy_mask) >> shift[d];

    enemy_mask =
      (moved & ~edge_masks[(d + 2) % 4] & ~impassible) |
      (enemy_mask & wall_mask) |
      (enemy_mask & edge_masks[d]);

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
    uint64_t shift[4] = { 1, width, 1, width };

    all_players.reset();
    for (int i = player_id + 1; i != player_id; i = (i + 1) & 0b11) {
      all_players |= players[i];
    }

    // Wall_mask contains all pieces aligned with a wall.
    wall_mask.reset();
    auto cur_mask = impassible | (edge_masks[d] & player_mask) | all_players;
    while (cur_mask.any()) {
      // Move backwards, and check if there's player units there.
      int b = (d + 2) % 4;
      cur_mask = (b < 2) ? (cur_mask << shift[b]) : (cur_mask >> shift[b]);
      // If there isn't a unit at this square / went off the grid, remove from mask.
      cur_mask &= player_mask & ~edge_masks[d];
      wall_mask |= cur_mask;
    }

    // Move pieces in the desired direction.
    auto moved = (d < 2) ? (~wall_mask & player_mask) << shift[d] :
      (~wall_mask & player_mask) >> shift[d];
    
    // If we shifted into a wall or off the edge, delete the shifted bit.
    // Place anything that hit a wall back where it was.
    // Place anything that hit an edge back where it was.
    player_mask =
      (moved & ~edge_masks[(d + 2) % 4] & ~impassible) |
      (player_mask & wall_mask) |
      (player_mask & edge_masks[d]);

    // Move the score mask identically to the player mask.
    moved = (d < 2) ? (~wall_mask & score_mask) << shift[d] :
      (~wall_mask & score_mask) >> shift[d];
    score_mask =
      (moved & ~edge_masks[(d + 2) % 4] & ~impassible) |
      (score_mask & wall_mask) |
      (score_mask & edge_masks[d]);

    // Kill enemies the player hits.
    for (int i = 0; i < 4; i++) {
      enemies[i] &= ~player_mask;
    }

    // Every player that doesn't have a cow
    auto cow_less = ~(player_mask & ~score_mask);
    score_mask |= (player_mask & cows);
    auto prev = cows;
    cows &= cow_less;

    players[player_id] = player_mask;
    player_scores[player_id] = score_mask;
    cow_respawn[turn % round_length] = prev & ~cows;
  } /* play_player_movement() */

  /*------ Debug + Testing ----------*/

  /*
   * Puts the board in a convenient state.
   */

  vector<vector<int>> viewBoard() {
    vector<vector<int>> out(height, vector<int>(width));
    for (uint32_t i = 0; i < height; i++) {
      for (uint32_t j = 0; j < width; j++) {
        out[i][j] = TileType::PLAIN;
        auto mask = dynamic_bitset(area(), 1);
        mask <<= (width * i + j);
        if ((impassible & mask).any()) {
          out[i][j] = TileType::IMPASSIBLE;
        } else if ((cows & mask).any()) {
          out[i][j] = TileType::COW;
        }
      }
    }
    return out;
  } /* viewBoard() */

  /*
   * Pretty string for debug printing
   * mostly just copy of viewBoard
   */

  vector<vector<char>> boardString() {
    // Empty space default to '.'
    vector<vector<char>> out(height, vector<char>(width, '.'));
    for (uint32_t i = 0; i < height; i++) {
      for (uint32_t j = 0; j < width; j++) {
        auto mask = dynamic_bitset(area(), 1);
        mask <<= (width * i + j);
        if ((impassible & mask).any()) {
          out[i][j] = '#'; //impassible
        } else if ((cows & mask).any()) {
          out[i][j] = 'O'; // cow?
        }
      }
    }
    return out;
  } /* boardString() */

  /*
   * Puts the pieces in a convenient state.
   */

  vector<Piece> viewPieces() {
    vector<Piece> out;
    for (uint32_t i = 0; i < height; i++) {
      for (uint32_t j = 0; j < width; j++) {
        for (int k = 0; k < 4; k++) {
          auto msk = dynamic_bitset(area(), 1);
          msk <<= (width * i + j);
          if ((players[k] & msk).any()) {
            out.push_back(Piece(
              i, j, k + 1,
              (player_scores[k] & msk).any()
            ));
            break;
          } else if ((enemies[k] & msk).any()) {
            out.push_back(Piece(i, j, k + 5));
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
      auto idx = queue.get(i);
      out[i] = cards[idx];
    }
    return out;
  } /* viewCards() */

};

// Print
ostream& operator<<(ostream& os, Game& game) {
  os << "Game: \n";
  auto board = game.viewBoard();
  for (uint64_t i = 0; i < game.height; i++) {
    for (uint64_t j = 0; j < game.width; j++) {
      if (board[i][j] == 0) {
        os << Color::Modifier(Color::BG_GREEN);
        os << ' ';
      } else if (board[i][j] == TileType::COW) {
        os << Color::Modifier(Color::BG_DEFAULT);
        os << 'C';
      }
      else if (board[i][j] == TileType::IMPASSIBLE) {
        os << Color::Modifier(Color::BG_BLACK);
        os << ' ';
      }
      os << Color::Modifier(Color::BG_DEFAULT);
    }
    os << Color::Modifier(Color::BG_DEFAULT);
    os << '\n';
  }

  Color::Modifier mods[4] = {
    Color::Modifier(Color::BG_RED),
    Color::Modifier(Color::BG_BLUE),
    Color::Modifier(Color::BG_YELLOW),
    Color::Modifier(Color::BG_PURPLE)
  };
  for (uint64_t i = 0; i < game.height; i++) {
    for (uint64_t j = 0; j < game.width; j++) {
      bool found = false;
      for (uint64_t k = 0; k < 4; k++) {
        auto entry = game.players[k][i * game.width + j];
        if (entry != 0) {
          os << mods[k];
          os << 'P';
          found = true;
          break;
        }
      }
      for (uint64_t k = 0; k < 4; k++) {
        auto entry = game.enemies[k][i * game.width + j];
        if (entry != 0) {
          os << mods[k];
          os << 'E';
          found = true;
          break;
        }
      }
      os << Color::Modifier(Color::BG_DEFAULT);
      if (found) continue;
      os << '=';
    }
    os << Color::Modifier(Color::BG_DEFAULT);
    os << '\n';
  }

  os << Color::Modifier(Color::BG_DEFAULT);
  
  auto cards = game.viewCards();
  for (size_t i = 0; i < cards.size(); i++) {
    if (i < game.hand_size)      os << Color::Modifier(Color::FG_BLUE) << "Player <= " << cards[i] << Color::Modifier(Color::FG_DEFAULT) << '\n';
    else if (i < 2*game.hand_size) os << Color::Modifier(Color::FG_RED)  << "Enemy  <= " << cards[i] << Color::Modifier(Color::FG_DEFAULT) << '\n';
    else             os << "Queue  <= " << cards[i] << '\n';
  }
  os << "turn: " << game.turn << '\n';
  os << "hand size: " << game.hand_size << '\n';
  int ppct = 0, epct = 0;
  for (int i = 0; i < 4; i++) {
    ppct += game.players[i].count();
    epct += game.enemies[i].count();
  }
  os << "player pieces: " << ppct << '\n';
  os << "enemy pieces: " << epct << '\n';
  return os;
}
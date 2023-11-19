#pragma once
#include <boost/dynamic_bitset.hpp>
#include <array>
#include <vector>

#include "CardQueue.h"
#include "Helpers.h"

using dynamic_bitset = boost::dynamic_bitset<>;
using namespace std;

struct Game {
  uint64_t width;
  uint64_t height;
  uint64_t ncards;
  uint64_t hand_size;
  uint64_t round_length;

  // Hardcode for now...
  uint64_t cows_to_win = 10;
  array<dynamic_bitset, 4> edge_masks;

  uint64_t turn = 0;
  uint64_t round = 0;
  uint64_t total_score = 0;
  uint64_t player_id = 0;

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
  dynamic_bitset score_tiles;

  Game(GameConfig config);
  int64_t area();
  int64_t ncard_bits();
  const dynamic_bitset right_edge_mask();
  const dynamic_bitset up_edge_mask();
  const dynamic_bitset left_edge_mask();
  const dynamic_bitset down_edge_mask();
  int is_jover();
  bool is_enemy_turn() const;
  bool color_is_enemy(int color);
  void make_move(Move move);
  int count_players();
  int count_enemies();
  int count_pieces();
  void player_move(int choice);
  void player_rotate_card(int choice, int rotation);
  void player_buy(int x, int y);
  void enemy_move(int choice, int color);
  void play_enemy_movement(Direction d, int choice);
  void play_player_movement(Direction d);
  vector<vector<int>> viewBoard();
  vector<Piece> viewPieces();
  vector<Card> viewCards();
  bool operator<(const Game& o) const;
};

ostream& operator<<(ostream& os, Game& game);
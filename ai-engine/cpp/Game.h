#pragma once
#include <array>
#include <vector>

#include "CardManager.h"
#include "DynamicBitset.h"
#include "Helpers.h"


using namespace std;

struct Game {
  string id;
  uint8_t width;
  uint8_t height;
  uint64_t round_length;
  uint64_t cows_to_win = 10; // Hardcode for now...
  uint64_t turn = 0;
  uint64_t round = 0;
  uint64_t total_score = 0;
  uint64_t player_id = 0;

  CardManager cm;
  array<dynamic_bitset, 6> cow_respawn;
  array<bool, 4> pattacked;
  array<bool, 4> eattacked;
  array<dynamic_bitset, 4> players;
  array<dynamic_bitset, 4> enemies;
  dynamic_bitset impassible;
  dynamic_bitset cows;
  dynamic_bitset all_enemies;
  dynamic_bitset all_players;
  dynamic_bitset score_tiles;
  
  int playereval=0, enemyeval=0;
  vector<int> playerhm, enemyhm;


  // Why didn't I put the array outside....
  struct SOA {
    array<vector<uint8_t>, 4> xs;
    array<vector<uint8_t>, 4> ys;
    array<vector<uint8_t>, 4> ss;
    array<vector<uint8_t>, 4> deads;  
  };
  SOA player, enemy;

  Game(GameConfig config);
  int64_t area();
  int64_t ncard_bits();
  int is_jover();
  bool is_enemy_turn() const;
  bool color_is_enemy(int color);
  int count_players();
  int count_enemies();
  int count_pieces();
  void make_move(Move move);
  int score_estimate(Move move);
  void player_move(int choice);
  void player_rotate_card(int choice, int rotation);
  void player_buy(int x, int y);
  void enemy_move(int choice, int color);
  void purge(int choice, int p);
  void play_movement(Direction d, int choice, int p);
  void play_enemy_movement(Direction d, int choice);
  void play_player_movement(Direction d);
  vector<vector<int>> viewBoard();
  vector<Piece> viewPieces();
  vector<Card> viewCards();
  bool operator<(const Game& o) const;
};

ostream& operator<<(ostream& os, Game& game);
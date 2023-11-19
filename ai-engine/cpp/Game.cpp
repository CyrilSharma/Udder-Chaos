#include "Game.h"
#include "Utils.h"


/*--- Utility Functions -----*/
int64_t Game::area() {
  return (width * height);
}

int64_t Game::ncard_bits() {
  return 64 -__builtin_clzll(ncards - 1);
}

// Sprint 3 OPT; Remove edge masks and simply use walls for everything.
const dynamic_bitset Game::right_edge_mask() {
  dynamic_bitset res(area(), 0b0);
  for (uint32_t i = 0; i < height; i++) {
    dynamic_bitset m(area(), 1);
    m <<= (i * width + (width - 1));
    res |= m;
  }
  return res;
}

const dynamic_bitset Game::up_edge_mask() {
  dynamic_bitset m(area(), 0);
  dynamic_bitset row(area(), (0b1 << width) - 1);
  m |= row << (width * (height - 1));
  return m;
}

const dynamic_bitset Game::left_edge_mask() {
  dynamic_bitset res(area(), 0);
  for (uint32_t i = 0; i < height; i++) {
    dynamic_bitset m(area(), 1);
    m <<= (i * width);
    res |= m;
  }
  return res;
}

const dynamic_bitset Game::down_edge_mask() {
  dynamic_bitset m(area(), 0);
  for (uint32_t i = 0; i < width; i++) {
    dynamic_bitset b(area(), 1);
    m |= b << i;
  }
  return m;
}

// Comparator for map and things? Idk
bool Game::operator<(const Game& o) const {
  if (turn != o.turn) return turn < o.turn;
  for (int i = 0; i < 4; i++) if (player_scores[i] != o.player_scores[i]) return player_scores[i] < o.player_scores[i];
  for (int i = 0; i < 4; i++) if (players[i] != o.players[i]) return players[i] < o.players[i];
  for (int i = 0; i < 4; i++) if (enemies[i] != o.enemies[i]) return enemies[i] < o.enemies[i];
  for (int i = 0; i < 4; i++) if (enemies[i] != o.enemies[i]) return enemies[i] < o.enemies[i];
  if (cards != o.cards) return cards < o.cards;
  for (int i = 0; i < 6; i++) if (cow_respawn[i] != o.cow_respawn[i]) return cow_respawn[i] < o.cow_respawn[i];
  return cows < o.cows;
}

/*--- Game Logic -----*/

/*
  * Parses a GameConfig into a more efficient, internal
  * representation.
  */

Game::Game(GameConfig config):
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
  wall_mask(dynamic_bitset(area(), 0)),
  score_tiles(dynamic_bitset(area(), 0)) {
  
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
      } else if (tile == TileType::SCORE) {
        score_tiles |= m;
      }
    }
  }

} /* Game() */

/*
  * returns the winner of the game.
  * -1 if AI, 1 if player, 0 if nobody has won yet.
  */

int Game::is_jover() {
  for (int i = 0; i < 4; i++) {
    if (!players[i].count()) return -1;
  }
  if (total_score >= cows_to_win) return 1;
  return 0;
} /* is_jover() */

// Temp player turn check
bool Game::is_enemy_turn() const {
  return turn % 3 == 2;
}

// Return color is enemy (0 indexed)
bool Game::color_is_enemy(int color) {
  return color >= 4;
}

// general move making function
void Game::make_move(Move move) {
  assert(move.type != MoveType::NONE);
  if (move.type == MoveType::NORMAL) {
    if (color_is_enemy(move.color)) enemy_move(move.card, move.color - 4);
    else player_move(move.card);
  }
  // Assumed move is player move
  else if (move.type == MoveType::ROTATE) {
    player_rotate_card(move.card, move.angle);
  }
  else if (move.type == MoveType::BUY) {
    player_buy(move.x, move.y);
  }
}

int Game::count_players() {
  int ppct = 0;
  for (int i = 0; i < 4; i++) ppct += players[i].count();
  return ppct;
}

int Game::count_enemies() {
  int epct = 0;
  for (int i = 0; i < 4; i++) epct += enemies[i].count();
  return epct;
}

int Game::count_pieces() {
  return count_players() + count_enemies() + cows.count();
}

/*
  * choice is expected to be the numerical
  * index IN YOUR HAND of the card you wish to play.
  * we do not check if the card is in your hand.
  */

void Game::player_move(int choice) {
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
  * rotates the specified card in the player hand
  * by the specified amount.
  */

void Game::player_rotate_card(int choice, int rotation) {
  int index = queue.choose(choice);
  auto moves = cards[index].moves;
  vector<Direction> dirs = {
    Direction::RIGHT, Direction::UP,
    Direction::LEFT, Direction::DOWN
  };
  for (Direction &move: moves) {
    // Need to validate with frontend.
    move = dirs[(4 + move - rotation) & 0b11];
  }
  player_id = (player_id + 1) & 0b11;
  turn += 1;
} /* rotate_card() */

/*
  * x and y coordinate of where you
  * want your ufo to be.
  */

void Game::player_buy(int x, int y) {
  dynamic_bitset msk(area(), 1); 
  players[player_id] |= (msk << (width * y + x));
  player_id = (player_id + 1) & 0b11;
  turn += 1;
} /* player_buy() */

/*
  * choice is expected to be the numerical
  * index of the card you wish to play.
  * we do not check if the card is in your hand.
  * 
  * choice is the card choice...
  * color is which color you want to move with this action.
  */

void Game::enemy_move(int choice, int color) {
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

void Game::play_enemy_movement(Direction d, int choice) {
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

void Game::play_player_movement(Direction d) {
  auto player_mask = players[player_id];
  auto score_mask = player_scores[player_id];
  uint64_t shift[4] = { 1, width, 1, width };

  all_players.reset();
  for (uint64_t i = player_id + 1; i != player_id; i = (i + 1) & 0b11) {
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

  total_score += (score_tiles & score_mask).count();
  score_mask &= ~(score_tiles);

  players[player_id] = player_mask;
  player_scores[player_id] = score_mask;
  cow_respawn[turn % round_length] = prev & ~cows;
} /* play_player_movement() */

/*------ Debug + Testing ----------*/

/*
  * Puts the board in a convenient state.
  */

vector<vector<int>> Game::viewBoard() {
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
      } else if  ((score_tiles & mask).any()) {
        out[i][j] = TileType::SCORE;
      }
    }
  }
  return out;
} /* viewBoard() */

/*
  * Puts the pieces in a convenient state.
  */

vector<Piece> Game::viewPieces() {
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

vector<Card> Game::viewCards() {
  vector<Card> out(ncards);
  for (uint64_t i = 0; i < ncards; i++) {
    auto idx = queue.get(i);
    out[i] = cards[idx];
  }
  return out;
} /* viewCards() */

// Print
ostream& operator<<(ostream& os, Game& game) {
  os << "Game: \n";
  auto board = game.viewBoard();
  for (uint64_t i = 0; i < game.height; i++) {
    for (uint64_t j = 0; j < game.width; j++) {
      if (board[i][j] == TileType::PLAIN) {
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
      else if (board[i][j] == TileType::SCORE) {
        os << Color::Modifier(Color::BG_PURPLE);
        os << ' ';
      }
      os << Color::Modifier(Color::BG_DEFAULT);
    }
    os << Color::Modifier(Color::BG_DEFAULT);
    os << '\n';
  }

  Color::Modifier mods[4] = {
    Color::Modifier(Color::BG_RED),
    Color::Modifier(Color::BG_YELLOW),
    Color::Modifier(Color::BG_BLUE),
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
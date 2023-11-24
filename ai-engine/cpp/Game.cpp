#include "Game.h"

#include <assert.h>
#include <bitset>

#include "DynamicBitset.h"
#include "Utils.h"

int64_t Game::area() {
  return (width * height);
}

bool Game::operator<(const Game& o) const {
  return id < o.id;
}

/*--- Game Logic -----*/

/*
 * Parses a GameConfig into a more efficient, internal
 * representation.
 */

Game::Game(GameConfig config):
  id(config.id),
  width(config.board[0].size()),
  height(config.board.size()),
  round_length(config.round_length),
  cm(config.cards, config.hand_size),
  impassible(area(), 0),
  cows(area(), 0),
  all_enemies(area(), 0),
  all_players(area(), 0),
  score_tiles(area(), 0) {
  
  for (uint32_t i = 0; i < 4; i++) {
    players[i] = dynamic_bitset(area(), 0);
    enemies[i] = dynamic_bitset(area(), 0);
    pattacked[i] = 0;
    eattacked[i] = 0;
  }
  for (uint32_t i = 0; i < round_length; i++) {
    cow_respawn[i] = dynamic_bitset(area(), 0);
  }

  for (auto p: config.pieces) {
    if (p.tp < 5) {
      int idx = p.tp - 1;
      players[idx].set(p.i * width + p.j, 1);
      player.xs[idx].push_back(p.j);
      player.ys[idx].push_back(p.i);
      player.ss[idx].push_back(p.score);
      player.deads[idx].push_back(0);
    } else {
      int idx = (p.tp - 1) & 0b11;
      enemies[idx].set(p.i * width + p.j, 1);
      enemy.xs[idx].push_back(p.j);
      enemy.ys[idx].push_back(p.i);
      // Pointless but requires some changes to avoid.
      enemy.ss[idx].push_back(p.score);
      enemy.deads[idx].push_back(0);
    }
  }

  for (uint32_t i = 0; i < height; i++) {
    for (uint32_t j = 0; j < width; j++) {
      int tile = config.board[i][j];
      if (tile == TileType::PLAIN) {}
      else if (tile == TileType::IMPASSIBLE) {
        impassible.set(i * width + j, 1);
      } else if (tile == TileType::COW) {
        cows.set(i * width + j, 1);
      } else if (tile == TileType::SCORE) {
        score_tiles.set(i * width + j, 1);
      }
    }
  }


  auto heatmap = [&](vector<int> &hm, int p) {
    queue<tuple<int, int, int>> q;
    vector<bool> visited(width * height);
    if (!p) {
      // Enemies Heatseek towards player spawns.
      for (size_t i = 0; i < config.pieces.size(); i++) {
        if (config.pieces[i].tp > 4) continue;
        q.push({config.pieces[i].j, config.pieces[i].i, 0});
        visited[config.pieces[i].i * width + config.pieces[i].j] = 1;
      }
    } else {
      // Players Heatseek towards cows.
      for (int i = 0; i < height; i++) {
        for (int j = 0; j < width; j++) {
          if (!cows[i * width + height]) continue;
          q.push({j, i, 0});
          visited[i * width + height] = 1;
        }
      }
    }
    hm.resize(width * height);
    int dx[4] = { 1, 0, -1, 0 };
    int dy[4] = { 0, 1, 0, -1 };
    while (!q.empty()) {
      auto [x, y, d] = q.front(); q.pop();
      hm[y * width + x] = (width + height) - d;
      for (int i = 0; i < 4; i++) {
        int nx = x + dx[i], ny = y + dy[i];
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (visited[ny * width + nx]) continue;
        if (impassible[ny * width + nx]) continue;
        visited[ny * width + nx] = 1;
        q.push({nx, ny, d + 1});
      }
    }
  };

  auto printmask = [&](vector<int> &mask) {
    for (int i = 0; i < height; i++) {
      for (int j = 0; j < width; j++) {
        printf("%2d ", mask[i * width + j]);
      }
      printf("\n");
    }
  };

  playerhm.resize(area());
  enemyhm.resize(area());
  heatmap(playerhm, 1);
  heatmap(enemyhm, 0);

  // Initialize evaluations.
  for (int c = 0; c < 4; c++) {
    for (size_t i = 0; i < player.deads[c].size(); i++) {
      enemyeval += playerhm[player.ys[c][i] * width + player.xs[c][i]];
    }
    for (size_t i = 0; i < enemy.deads[c].size(); i++) {
      playereval += enemyhm[enemy.ys[c][i] * width + enemy.xs[c][i]];
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

// general move making function
void Game::make_move(Move move) {
  assert(move.type != MoveType::NONE);
  cows |= cow_respawn[turn % round_length];
  if (move.type == MoveType::NORMAL) {
    if (is_enemy_turn()) enemy_move(move.card, move.color);
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
  for (int i = 0; i < 4; i++)
    ppct += player.deads[i].size();
  return ppct;
}

int Game::count_enemies() {
  int epct = 0;
  for (int i = 0; i < 4; i++)
    epct += enemy.deads[i].size();
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
  auto moves = cm.pchoose(choice).moves;
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
  cm.rotate(choice, rotation);
  player_id = (player_id + 1) & 0b11;
  turn += 1;
} /* rotate_card() */

/*
 * x and y coordinate of where you
 * want your ufo to be.
 * 
 * DOES NOT CHECK THAT YOU CAN ACTUALLY DO IT
 */

void Game::player_buy(int x, int y) {
  dynamic_bitset msk(area(), 1); 
  msk.set(width * y + x, 1);
  players[player_id] |= msk;
  player.xs[player_id].push_back(x);
  player.ys[player_id].push_back(y);
  player.ss[player_id].push_back(0);
  player.deads[player_id].push_back(0);
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
  auto moves = cm.echoose(choice).moves;
  for (Direction move: moves) {
    play_enemy_movement(move, color);
  }
  turn += 1;
} /* enemy_move() */

/*
 * removes all dead units
 * from the entry (choice) in s
 */

void Game::purge(int choice, int p) {
  auto &s = p ? player : enemy;
  vector<int> idxs;
  idxs.reserve(s.deads[choice].size());
  for (size_t i = 0; i < s.deads[choice].size(); i++) {
    if (s.deads[choice][i]) continue;
    idxs.push_back(i);
  }
  for (size_t i = 0; i < idxs.size(); i++) {
    s.xs[choice][i] = s.xs[choice][idxs[i]];
    s.ys[choice][i] = s.ys[choice][idxs[i]];
    s.ss[choice][i] = s.ss[choice][idxs[i]];
    s.deads[choice][i] = s.deads[choice][idxs[i]];
  }
  s.xs[choice].resize(idxs.size());
  s.ys[choice].resize(idxs.size());
  s.ss[choice].resize(idxs.size());
  s.deads[choice].resize(idxs.size());
} /* purge() */


/*
 * This doesn't simulate collisions with other players.
 */

int Game::score_estimate(Move move) {
  bool p = !is_enemy_turn();
  auto color = (p) ? player_id : (move.color);
  auto &unit = (p) ? player : enemy;
  auto &opponents = (p) ? enemies : players;
  auto &all_opponents = (p) ? all_enemies : all_players;
  const int sz = (int) unit.deads[color].size();
  auto moves = (p) ? cm.pview(move.card).moves
    : cm.eview(move.card).moves;
  const int8_t shift[4] = { 1, 1, -1, -1 };
  const uint8_t bounds[4] = {
      static_cast<uint8_t>(width - 1),
      static_cast<uint8_t>(height - 1),
      0, 0
  };

  vector<uint8_t> cy(unit.xs[color].begin(), unit.xs[color].end());
  vector<uint8_t> cx(unit.xs[color].begin(), unit.xs[color].end());
  uint8_t* __restrict__ _uy = cy.data();
  uint8_t* __restrict__ _ux = cx.data();
  #define INDEX1(i) (_uy[i] * width + _ux[i])

  all_opponents.reset();
  for (int i = 0; i < 4; i++) {
    all_opponents |= opponents[i];
  }

  // Shift everything, keeping in mind bounds.
  int score = 0;
  for (size_t j = 0; j < moves.size(); j++) {
    Direction d = moves[j];
    uint8_t* __restrict__ pos =
      (d == Direction::UP || d == Direction::DOWN)
      ? _uy : _ux;
    #pragma clang loop vectorize(enable)
    for (int i = 0; i < sz; i++) {
      int oob = (pos[i] == bounds[d]);
      pos[i] += (shift[d] * !oob);
      score += all_opponents[INDEX1(i)];
      score += p * cows[INDEX1(i)];
    }
  }
  return score;
} /* score_estimate() */


/* 
 * The overall structure is as follows.
 * Presort the vector to figure out if anything has died.
 * Purge all dead entries from the vectors.
 * Move everything, acknoledging boundaries but ignoring collisions.
 * Move things backwards to correct for hitting other players.
 * While there's collisions between players that just moved, move things backwards.
 * The code is written using structs of arrays and no if-statements to allow for auto-vectorization.
 * With uint8_t are our base type, most cpus can process 16 ints in parallel.
 */

void Game::play_movement(Direction d, int choice, int p) {
  auto &unit = (p) ? player : enemy;
  uint8_t* __restrict__ _uy = unit.ys[choice].data();
  uint8_t* __restrict__ _ux = unit.xs[choice].data(); 
  #define INDEX(i) (_uy[i] * width + _ux[i])

  auto &units = (p) ? players : enemies;
  auto &all_units = (p) ? all_players : all_enemies;

  all_units.reset();
  for (int i = choice + 1; i != choice; i = (i + 1) & 0b11) {
    all_units |= units[i];
  }

  vector<uint8_t> occupied(area());
  const int sz = (int) unit.deads[choice].size();
  uint8_t* __restrict__ pos =
    (d == Direction::UP || d == Direction::DOWN)
    ? unit.ys[choice].data()
    : unit.xs[choice].data();
  uint8_t* __restrict__ occ = occupied.data();
  const int8_t shift[4] = { 1, 1, -1, -1 };
  const uint8_t bounds[4] = {
      static_cast<uint8_t>(width - 1),
      static_cast<uint8_t>(height - 1),
      0, 0
  };
  
  
  // Shift everything, keeping in mind bounds.
  #pragma clang loop vectorize(enable)
  for (int i = 0; i < sz; i++) {
    int oob = (pos[i] == bounds[d]);
    pos[i] += (shift[d] * !oob);
  }

  // If I don't do this Clang doesn't believe blockptr is unique.
  uint32_t NBLOCKS = (all_units.size + 64 - 1) / (64);
  int64_t* blockptr = new int64_t[NBLOCKS];
  for (uint32_t i = 0; i < NBLOCKS; i++) {
    blockptr[i] = all_units.blocks[i] | impassible.blocks[i];
  }

  #pragma clang loop vectorize(enable)
  for (int i = 0; i < sz; i++) {
    int idx = INDEX(i);
    int b = blockptr[idx / 64] >> (idx % 64) & 1;
    pos[i] -= (shift[d] * b);
  }
  delete[] blockptr;

  int collision = 0;
  #pragma clang loop vectorize(enable)
  for (int i = 0; i < sz; i++) {
    int idx = INDEX(i);
    occ[idx] += 1;
    collision |= (occ[idx] >= 2);
  }

  // This is slow, but often won't even be called.
  while (collision) {
    collision = 0;
    // This is SUS because it lets pieces move over each other
    // This can cause the scores to change in weird ways,
    // So I'll have to fix this at some point.
    for (int i = 0; i < sz; i++) {
      int idx = INDEX(i);
      pos[i] -= (shift[d] * (occ[idx] >= 2));
      occ[idx] -= 1;
      idx = INDEX(i);
      occ[idx] += 1;
      collision |= (occ[idx] >= 2);
    }
  }
} /* play_movement() */


/*
 * play_enemy_movement
 */

void Game::play_enemy_movement(Direction d, int choice) {
  auto index = [&](int i) {
    return enemy.ys[choice][i] * width
      + enemy.xs[choice][i];
  };

  for (size_t i = 0; i < enemy.deads[choice].size(); i++) {
    int idx = index(i);
    enemyeval -= enemyhm[idx];
  }

  play_movement(d, choice, 0);

  // Build Enemy Mask
  dynamic_bitset mask(area());
  for (size_t i = 0; i < enemy.deads[choice].size(); i++) {
    int idx = index(i);
    mask.set(idx, 1);
    enemyeval += enemyhm[idx];
  }

  // Kill Player Masks
  for (int color = 0; color < 4; color++) {
    if ((mask & players[color]).count() == 0) continue;
    for (size_t i = 0; i < player.deads[color].size(); i++) {
      int idx = player.ys[color][i] * width
        + player.xs[color][i];
      int b = mask[idx];
      player.deads[color][i] |= b;
      playereval -= (playerhm[idx] * b);
    }
    players[color] &= ~mask;
    purge(color, 1);
  }

  enemies[choice] = mask;
} /* play_enemy_movement() */


/* 
 * play_player_movement
 */

void Game::play_player_movement(Direction d) {
  auto index = [&](int i) {
    return player.ys[player_id][i] * width
      + player.xs[player_id][i];
  };
  
  for (size_t i = 0; i < player.deads[player_id].size(); i++) {
    int idx = index(i);
    playereval -= playerhm[idx];
  }

  play_movement(d, player_id, 1);

  // Build Player Mask, update scores.
  dynamic_bitset mask(area());
  for (size_t i = 0; i < player.deads[player_id].size(); i++) {
    int idx = index(i);
    player.ss[player_id][i] += cows[idx];
    int delta = player.ss[player_id][i] * score_tiles[idx];
    player.ss[player_id][i] -= delta;
    total_score += delta;
    mask.set(idx, 1);
    playereval += playerhm[idx];
  }

  for (int color = 0; color < 4; color++) {
    auto inter = (mask & enemies[color]);
    if (inter.count() == 0) continue;
    for (size_t i = 0; i < enemy.deads[color].size(); i++) {
      int idx = enemy.ys[color][i] * width
        + enemy.xs[color][i];
      int b = mask[idx];
      enemy.deads[color][i] |= b;
      enemyeval -= (enemyhm[idx] * b);
    }
    enemies[color] ^= inter;
    purge(color, 0);
  }

  cows &= ~mask;
  cow_respawn[turn % round_length] &= cows & mask;
  players[player_id] = mask;
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
      auto mask = dynamic_bitset(area());
      int idx = width * i + j;
      if (impassible[idx]) {
        out[i][j] = TileType::IMPASSIBLE;
      } else if (cows[idx]) {
        out[i][j] = TileType::COW;
      } else if  (score_tiles[idx]) {
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
  for (int color = 0; color < 4; color++) {
    for (size_t i = 0; i < player.deads[color].size(); i++) {
      out.push_back(Piece(
        player.ys[color][i], player.xs[color][i],
        color + 1, player.ss[color][i]
      ));
    }
    for (size_t i = 0; i < enemy.deads[color].size(); i++) {
      out.push_back(Piece(
        enemy.ys[color][i], enemy.xs[color][i],
        color + 5, 0
      ));
    }
  }
  sort(out.begin(), out.end(), [](Piece &a, Piece &b) {
    if (a.i != b.i) return a.i < b.i;
    if (a.j != b.j) return a.j < b.j;
    return a.tp < b.tp;
  });
  return out;
} /* viewPieces() */

/*
 * Puts the Cards in a convenient state.
 */

vector<Card> Game::viewCards() {
  return cm.cards;
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
  int qsize = (game.cm.cards.size() - 2 * game.cm.handsize);
  for (int i = 0; i < qsize; i++)
    os << "Queue  <= " << game.cm.queue[i] << '\n';
  for (int i = 0; i < game.cm.handsize; i++)
    os << Color::Modifier(Color::FG_BLUE) << "Player <= " << game.cm.phand[i]
       << Color::Modifier(Color::FG_DEFAULT) << '\n';
  for (int i = 0; i < game.cm.handsize; i++)
    os << Color::Modifier(Color::FG_RED) << "Enemy  <= " << game.cm.ehand[i]
       << Color::Modifier(Color::FG_DEFAULT) << '\n';

  os << "turn: " << game.turn << '\n';
  os << "hand size: " << game.cm.handsize << '\n';
  os << "player pieces: " << game.count_players() << '\n';
  os << "enemy pieces: " << game.count_enemies() << '\n';
  return os;
}
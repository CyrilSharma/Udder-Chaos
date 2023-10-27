#include <Game.h>

Game::Game() {}

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

}

/*
 * Moves the current piece in the desired direction.
 * applying all necessary side-effects. 
 */
Game::play_player_movement(Direction d) {
  player_mask = players_masks[player_id];
  switch (d) {
    case RIGHT:
      bitset<area()> wall_mask;
      bitset<area()> cur_mask = impassible;
      while (cur_mask != 0) {
        cur_mask = ((cur_mask << 1) & (player_mask));
        wall_mask |= cur_mask;
      }
      players[player_id];
      break;
    case UP:
      player[player_id];
      break;
    case LEFT:
      player[player_id];
      break;
    case DOWN:
      player[player_id];
      break;
  }
}
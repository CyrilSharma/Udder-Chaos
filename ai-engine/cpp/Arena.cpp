#include <iostream>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

#include "Game.h"
#include "Helpers.h"
#include "Utils.h"
using namespace std;

int main(int argc, char* argv[]) {
  if (argc < 3) {
    cerr << "Usage: " << argv[0] << " <Exec1> <Exec2>" << endl;
    return 1;
  }

  int count = 10;
  if (argc == 4) {
    count = atoi(argv[3]);
    if (count == 0) {
      cerr << "Usage: " << argv[0] << " <Exec1> <Exec2> <nmatches>" << endl;
      return 1;
    }
  }

  int read_child1[2];  pipe(read_child1);
  int write_child1[2]; pipe(write_child1);
  int read_child2[2];  pipe(read_child2);
  int write_child2[2]; pipe(write_child2);


  int writes[2] = { write_child1[1], write_child2[1] };
  int reads[2]  = { read_child1[0],  read_child2[0]  };


  // Fork the first child
  pid_t child1_pid = fork();
  if (child1_pid == -1) {
    cerr << "Error forking first child." << endl;
    return 1;
  } else if (child1_pid == 0) {
    close(read_child2[0]);
    close(read_child2[1]);
    close(write_child2[0]);
    close(write_child2[1]);

    close(write_child1[1]);
    close(read_child1[0]);
    dup2(write_child1[0], 0);
    dup2(read_child1[1], 1);
    execlp(argv[1], argv[1], nullptr);
    cerr << "Error executing child 1." << endl;
    return 1;
  }

  // Fork the second child
  pid_t child2_pid = fork();
  if (child2_pid == -1) {
    cerr << "Error forking second child." << endl;
    return 1;
  } else if (child2_pid == 0) {
    close(read_child1[0]);
    close(read_child1[1]);
    close(write_child1[0]);
    close(write_child1[1]);

    close(write_child1[1]);
    close(read_child1[0]);
    dup2(write_child2[0], 0);
    dup2(read_child2[1], 1);
    execlp(argv[2], argv[2], nullptr);
    cerr << "Error executing child 2." << endl;
    return 1;
  }

  auto [board, pieces] = load_setup();
  for (int i = 0; i < count; i++) {
    auto cards = random_cards(3, 15);
    auto gc = GameConfig(board, pieces, cards);
    auto game = Game(gc);
    for (int d = 0; d < 2; d++) {
      dprintf(d, "INIT\n");
      dprintf(d, "ncards: %zu\n", cards.size());
      dprintf(d, "game_id: %d\n", i);
      dprintf(d, "END\n");
      for (auto card: cards) {
        for (auto dir: card.moves) {
          dprintf(d, "%d ", dir);
        }
        dprintf(d, "\n");
      }
    }

    int idx = rand() % 2;
    while (!game.is_jover()) {
      dprintf(writes[idx], "GET\n");
      dprintf(writes[idx], "game_id: %d\n", i);
      dprintf(writes[idx], "END\n");
      
      int type = 0, card = 0, color = 0;
      char buf[200] = { 0 };
      read(reads[idx], buf, 200);
      sscanf(buf, "%d\n%d\n%d\n", &type, &card, &color);
      game.make_move(Move(static_cast<MoveType>(type), card, color));

      idx = !idx;
      dprintf(writes[idx], "MOVE\n");
      dprintf(writes[idx], "game_id: %d\n", i);
      if (type == MoveType::NORMAL) {
        dprintf(writes[idx], "moveType: PlayCard\n");
        dprintf(writes[idx], "index: %d\n", card);
        dprintf(writes[idx], "color: %d\n", color);
      } else if (type == MoveType::ROTATE) {
        dprintf(writes[idx], "moveType: RotateCard\n");
        dprintf(writes[idx], "index: %d\n", card);
        dprintf(writes[idx], "rotation: %d\n", color);
      } else if (type == MoveType::BUY) {
        dprintf(writes[idx], "moveType: PurchaseUFO\n");
        dprintf(writes[idx], "x: %d\n", card);
        dprintf(writes[idx], "y: %d\n", color);
      }
      dprintf(writes[idx], "END\n");
    }
  }

  // Too lazy to refactor.
  close(read_child1[0]);
  close(write_child1[1]);
  close(read_child1[0]);
  close(write_child2[1]);
  close(read_child1[0]);
  close(read_child2[1]);
  close(write_child1[0]);
  close(write_child2[1]);
  return 0;
}
#include <cstdlib>
#include <cstring>
#include <fcntl.h>
#include <iostream>
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

  int dev_null = open("/dev/null", O_WRONLY);
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
    // dup2(dev_null, 2);
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

    close(write_child2[1]);
    close(read_child2[0]);
    dup2(write_child2[0], 0);
    dup2(read_child2[1], 1);
    dup2(dev_null, 2);
    execlp(argv[2], argv[2], nullptr);
    cerr << "Error executing child 2." << endl;
    return 1;
  }

  auto [board, pieces] = load_setup();
  struct { 
    int p1wins = 0;
    int p2wins = 0;
  } stats;
  for (int i = 0; i < count; i++) {
    cout << "Round " << i << endl;
    cout << "---------------------" << endl;
    auto cards = random_cards(3, 15);
    auto gc = GameConfig(board, pieces, cards);
    auto game = Game(gc);
    for (int d = 0; d < 2; d++) {
      dprintf(writes[d], "INIT\n");
      dprintf(writes[d], "ncards: %zu\n", cards.size());
      dprintf(writes[d], "game_id: %d\n", i);
      dprintf(writes[d], "seed: %d\n", 0);
      dprintf(writes[d], "timer_length: %d\n", 100);
      dprintf(writes[d], "END\n");
      for (auto card: cards) {
        for (auto dir: card.moves) {
          dprintf(writes[d], "%d ", dir);
        }
        dprintf(writes[d], "\n");
      }
    }

    cout << "Games initialized" << endl;
    int turn_count = 0;
    int player = rand() % 2;
    int idx = player;
    while (!game.is_jover()) {
      cout << "turn: " << turn_count << endl;
      dprintf(writes[idx], "GET\n");
      dprintf(writes[idx], "game_id: %d\n", i);
      dprintf(writes[idx], "END\n");
      
      int type = 0, card = 0, color = 0;


      int len = 0;
      int newlines = 0;
      char buf[200] = { 0 };
      while (newlines < 3) {
        int bytes_read = read(reads[idx], &buf[len], 1);
        if (bytes_read == 0) {
          cerr << "AI did not send data!\n";
          exit(1);
        }
        if (buf[len] == '\n') newlines++;
        len++;
      }

      sscanf(buf, "%d\n%d\n%d\n", &type, &card, &color);

      int e1 = game.is_enemy_turn();
      game.make_move(Move(static_cast<MoveType>(type), card, color));
      int e2 = game.is_enemy_turn();

      dprintf(writes[!idx], "MOVE\n");
      dprintf(writes[!idx], "game_id: %d\n", i);
      if (type == MoveType::NORMAL) {
        dprintf(writes[!idx], "movetype: %d\n", type);
        dprintf(writes[!idx], "index: %d\n", card);
        dprintf(writes[!idx], "color: %d\n", color);
      } else if (type == MoveType::ROTATE) {
        dprintf(writes[!idx], "movetype: %d\n", type);
        dprintf(writes[!idx], "index: %d\n", card);
        dprintf(writes[!idx], "rotation: %d\n", color);
      } else if (type == MoveType::BUY) {
        dprintf(writes[!idx], "movetype: %d\n", type);
        dprintf(writes[!idx], "x: %d\n", card);
        dprintf(writes[!idx], "y: %d\n", color);
      }
      dprintf(writes[!idx], "END\n");

      // Swap turn iff p -> e or e -> p
      if (e1 != e2) idx = !idx;
      turn_count += 1;
    }

    cerr << "Status: " << game.is_jover() << endl;
    if (player == 0) {
      stats.p1wins += (game.is_jover() == 1);
      stats.p2wins += (game.is_jover() == -1);
    } else {
       stats.p1wins += (game.is_jover() == -1);
      stats.p2wins += (game.is_jover() == 1);
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
  waitpid(child1_pid, NULL, 0);
  waitpid(child2_pid, NULL, 0);

  cerr << "STATS\n";
  cerr << "-------------\n";
  cerr << argv[1] << " wins: " << stats.p1wins << endl;
  cerr << argv[2] << " wins: " << stats.p2wins << endl;
  return 0;
}
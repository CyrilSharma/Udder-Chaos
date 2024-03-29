#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include <vector>
#include <string>

#include "Utils.h"
#include "Search.h"

using namespace std;

// Fixed depth search toggle (for debug)
bool doFixedDepthSearch = false;
// Amount of debug prints during search
int verbosity = 1;

/*
 * Ensure the AI can find at least some easy kill-moves.
 */

TEST_CASE("Testing Good Moves") {
  std::string input_dir = "Tests/Input/";
  std::string ans_dir = "Tests/Output/";
  for (const auto& entry : fs::directory_iterator(input_dir)) {
    string inputfile = "Tests/Input/" + entry.path().filename().string();
    string answerfile = "Tests/Output/" + entry.path().filename().string();
    ifstream input(inputfile, ifstream::in);
    ifstream answer(answerfile, ifstream::in);
    REQUIRE(input.good());
    if (!answer.good()) {
      cerr << "Missing Answer File. Skipping.\n";
      continue;
    }


    int w, h, np, nc, nd;
    input >> w >> h >> np >> nc >> nd;
    vector<vector<Tile>> board(h, vector<Tile>(w));
    for (int i = 0; i < h; i++) {
      for (int j = 0; j < w; j++) {
        int v; input >> v;
        board[i][j] = Tile::from(v);
      }
    }

    vector<Piece> pieces(np);
    for (int i = 0; i < np; i++) {
      int x, y, tp, score;
      input >> x >> y >> tp >> score;
      pieces[i] = (Piece(y, x, tp, score));
    }


    vector<Card> cards(nc);
    Direction directions[4] = {
      Direction::RIGHT, Direction::DOWN,
      Direction::LEFT, Direction::UP
    };
    for (int i = 0; i < nc; i++) {
      vector<Direction> dirs(nd);
      for (int j = 0; j < nd; j++) {
        int idx; input >> idx;
        dirs[j] = directions[idx];
      }
      cards[i] = Card { dirs };
    }

    int timeout, max_depth;
    input >> timeout >> max_depth;
    Search search(
      GameConfig(board, pieces, cards),
      timeout, max_depth
    );
    
    search.game.turn = 2;
    search.game.player_id = 2;

    cerr << "\n\n" << entry.path().filename().string() << endl;
    cerr << "-----------------------\n\n";
    cerr << search.game << "\n";

    // I moved the debug values to the top of the file
    const Move move = search.beginSearch(verbosity, doFixedDepthSearch);
    search.make_move(move);
    cerr << typeOfMove(move.type) << " | card: " << move.card << " | color: " << move.color << endl;
    cerr << search.game << "\n";

    int answer_idx; answer >> answer_idx;
    int answer_color; answer >> answer_color;
    CHECK(answer_idx == move.card);
    CHECK(answer_color == move.color + 1);
  }
}
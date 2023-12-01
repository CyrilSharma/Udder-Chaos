#include "Helpers.h"
#include "Search.h"
#include "Utils.h"
using namespace std;
 
enum Request {
  INIT,
  GET,
  MOVE
};

// Communicates with a node.js server via stdin and stdout.
struct Handler {
  map<string, Search> searches;
  Handler() {}

  /*
   * Reads in a request as a Request object.
   */

  Request get_request() {
    string request;
    if (!(cin >> request)) exit(0);
    if (request == "INIT") return Request::INIT;
    if (request == "GET")  return Request::GET;
    if (request == "MOVE") return Request::MOVE;
    cerr << "FAILURE: Invalid Request" << endl;
    exit(1);
  } /* get_request() */

  /*
   * Handles requests
   */

  void run() {
    for (int ct = 1; ; ct++) {
      Request r = get_request();
      switch (r) {
        case INIT: init();  break;
        case GET:  get();   break;
        case MOVE: move();  break;
      }
    }
  } /* run() */

  /*
   * reads in a bunch of key-value pairs.
   */

  map<string, string> load_params() {
    map<string, string> params;
    params["round_length"] = "6";
    params["cow_sacrifice"] = "5";
    params["cow_regen_rate"] = "15";
    params["days_per_round"] = "5";
    params["score_goal"] = "10";
    params["hand_size"] = "3";
    params["ncards"] = "15";
    params["timer_length"] = "30";
    params["difficulty"] = "1000";

    string param, value, line;
    while (getline(cin, line)) {
      if (line == "END") break;
      // I miss c-style io :(
      stringstream ss(line);
      getline(ss, param, ':');
      ss >> value;
      std::transform(param.begin(), param.end(), param.begin(),
        [](char c){ return tolower(c); }
      );
      cerr << "Param: " << param << endl;
      cerr << "Value: " << value << endl;
      params[param] = value;
    }
    return params;
  } /* load_params() */

  /*
   * Creates the search tree,
   * Based on parameters read in from the server.
   */
 
  void init() {
    cerr << "INIT" << endl;
    auto params = load_params();
    cerr << "ncards:  " << params["ncards"] << endl;
    cerr << "game_id: " << params["game_id"] << endl;
    if (!params.count("seed")) {
      cerr << "FAILURE: Seed not provided" << endl;
      exit(1);
    } else if (!params.count("game_id")) {
      cerr << "FAILURE: Game ID not provided" << endl;
      exit(1);
    }

    auto [board, pieces] = load_setup();
    for (size_t i = 0; i < board.size(); i++) {
      for (size_t j = 0; j < board[0].size(); j++) {
        cerr << board[i][j].category;
      }
      cerr << endl;
    }
    for (auto p: pieces) cerr << p << endl;
    auto cards = load_cards(stoll(params["ncards"]));
    for (auto card: cards) cerr << card << endl;

    cerr << " 1: " << params["hand_size"] << endl;
    cerr << " 2: " << params["round_length"] << endl;
    cerr << " 3: " << params["cow_sacrifice"] << endl;
    cerr << " 4: " << params["cow_regen_rate"] << endl;
    cerr << " 5: " << params["days_per_round"] << endl;
    cerr << " 6: " << params["score_goal"] << endl;

    auto gc = GameConfig(
      board, pieces, cards,
      stoll(params["hand_size"]),
      stoll(params["round_length"]),
      stoll(params["cow_sacrifice"]),
      stoll(params["cow_regen_rate"]),
      stoll(params["days_per_round"]),
      stoll(params["score_goal"]),
      params["game_id"]
    );
    auto game_id = params["game_id"];
    searches.insert({
      game_id, Search(gc, stoll(params["difficulty"]))
    });
    cerr << searches.at(game_id).game << endl;
  } /* init() */

  /*
   * gets the AIs move for the specified game.
   * advances the internal state of the search tree.
   */

  void get() {
    auto params = load_params();
    auto game_id = params["game_id"];
    if (searches.count(game_id)) {
      auto res = searches.at(game_id).beginSearch();
      searches.at(game_id).make_move(res);
      cerr << searches.at(game_id).game << endl;
      if (res.type == NORMAL) {
        cout << res.type << "\n" << res.card << "\n" << res.color << endl;
        cerr << "type: "  << res.type << "\n"
             << "card: "  << res.card << "\n"
             << "color: " << res.color << endl;
      } else if (res.type == ROTATE) {
        cout << res.type << "\n" << res.card << "\n" << res.angle << endl;
        cerr << "type: "  << res.type << "\n"
             << "card: "  << res.card << "\n"
             << "angle: " << res.angle << endl;
      } else if (res.type == BUY) {
        cout << res.type << "\n" << res.x << "\n" << res.y << endl;
         cerr << "type: " << res.type << "\n"
              << "x: "    << res.x << "\n"
              << "y: "    << res.y << endl;
      }
    } else {
      cerr << "Invalid Game ID!" << endl;
      exit(1);
    }
  } /* get() */

  /*
   * play the specified card.
   * advances the internal state of the search tree.
   */

  void move() {
    auto params = load_params();
    auto game_id = params["game_id"];
    auto mv = stoi(params["movetype"]);
    cerr << "MoveType: " << mv << endl;
    if (searches.count(game_id)) {
      if (mv == MoveType::NORMAL) {
        auto idx = stoi(params["index"]);
        auto color = stoi(params["color"]);
        searches.at(game_id).make_move(Move(MoveType::NORMAL, idx, color));
      } else if (mv == MoveType::ROTATE) {
        auto idx = stoi(params["index"]);
        auto rotation = stoi(params["rotation"]);
        searches.at(game_id).make_move(Move(MoveType::ROTATE, idx, rotation));
      } else if (mv == MoveType::BUY) {
        auto x = stoi(params["x"]);
        auto y = stoi(params["y"]);
        searches.at(game_id).make_move(Move(MoveType::BUY, x, y));
      } else {
        cout << "Unknown Move Type!" << endl;
        exit(1);
      }
      cerr << searches.at(game_id).game << endl;
    } else {
      cerr << "Game ID not found" << endl;
      exit(1);
    }
  } /* move() */
};

int main() {
  auto handler = Handler();
  handler.run();
}


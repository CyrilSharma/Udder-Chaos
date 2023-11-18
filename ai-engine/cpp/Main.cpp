#include <bits/stdc++.h>
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
    cout << "FAILURE: Invalid Request" << endl;
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
    params["timeout"] = "1000";
    params["hand_size"] = "3";
    params["round_length"] = "6";
    params["ncards"] = "15";
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
      cout << "FAILURE: Seed not provided" << endl;
      exit(1);
    } else if (!params.count("game_id")) {
      cout << "FAILURE: Game ID not provided" << endl;
      exit(1);
    }

    init_seed(stoll(params["seed"]));
    auto [board, pieces] = load_setup();
    auto cards = load_cards(stoll(params["ncards"]));
    auto gc = GameConfig(
      board, pieces, cards,
      stoll(params["hand_size"]),
      stoll(params["round_length"])
    );
    auto game_id = params["game_id"];
    searches.insert({game_id, Search(gc)});
    cerr << searches.at(game_id).game << endl;
    cout << "SUCCESS" << endl;
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
      searches.at(game_id).makeAIMove(res.card, res.color - 4);
      cerr << searches.at(game_id).game << endl;
      cout << res.card << "\n" << (res.color + 1) << endl;
      cout << "SUCCESS" << endl;
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
    auto mv = params["movetype"];
    cerr << "MoveType: " << mv << endl;
    if (searches.count(game_id)) {
      if (mv == "PlayCard") {
        auto idx = stoi(params["index"]);
        searches.at(game_id).makePlayerMove(idx);
      } else if (mv == "RotateCard") {
        auto idx = stoi(params["index"]);
        auto rotation = stoi(params["rotation"]);
        searches.at(game_id).rotatePlayerCard(
          idx, rotation
        );
      } else if (mv == "PurchaseUFO") {
        auto row = stoi(params["row"]);
        auto column = stoi(params["column"]);
        searches.at(game_id).purchaseUFO(
          row, column
        );
      } else {
        cout << "Unknown Move Type!" << endl;
        exit(1);
      }
      cerr << searches.at(game_id).game << endl;
      cout << "SUCCESS" << endl;
    } else {
      cout << "Game ID not found" << endl;
      exit(1);
    }
  } /* move() */
};

int main() {
  auto handler = Handler();
  handler.run();
}


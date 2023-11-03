// main.cpp but for * testing *
#include <bits/stdc++.h>
#include "Helpers.h"
#include "Search.h"
#include "Utils.h"
using namespace std;

enum Request {
  INIT,
  GET,
  MOVE,
  BUY,
};

// Communicates with a node.js server via stdin and stdout.
struct Handler {
  map<int, Search> searches;
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
    if (request == "BUY")  return Request::BUY;
    cout << "FAILURE: Invalid Request" << endl;
    exit(1);
  } /* get_request() */

  /*
   * Handles requests
   */

  void run() {
    for (int ct = 1; ; ct++) {
      Request r = get_request();
      cout << "Instruction: " << ct << endl;
      switch (r) {
        case INIT: init(); break;
        case GET:  get();  break;
        case MOVE: move(); break;
        case BUY:  buy();  break;
      }
    }
  } /* run() */

  /*
   * reads in a bunch of key-value pairs.
   */

  map<string, string> load_params() {
    map<string, string> params;
    params["hand_size"] = "3";
    params["round_length"] = "6";
    params["ncards"] = "16";
    string param, value, line;
    while (getline(cin, line)) {
      if (line == "END") break;
      stringstream ss(line);
      getline(ss, param, ':');
      getline(ss, value, '\n');
      // how is there not just a tolower function...
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
    auto params = load_params();
    if (!params.count("seed")) {
      cout << "FAILURE: Seed not provided" << endl;
      exit(1);
    } else if (!params.count("game_id")) {
      cout << "FAILURE: Game ID not provided" << endl;
      exit(1);
    }

    auto rng = mt19937(stoll(params["seed"]));
    auto [board, pieces] = load_setup(rng);
    auto cards = load_cards(rng, stoll(params["ncards"]));
    auto gc = GameConfig(
      board, pieces, cards,
      stoll(params["hand_size"]),
      stoll(params["round_length"])
    );
    auto game_id = stoll(params["game_id"]);
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
    auto game_id = stoll(params["game_id"]);
    auto verbose = (params.find("verbose") != params.end()) && (params["verbose"] == " true");
    auto max_it = (params.find("max_it") != params.end() ? stoi(params["max_it"]) : 1e9);
    if (searches.count(game_id)) {
      auto res = searches.at(game_id).getMove(stoll(params["timeout"]), verbose = verbose, max_it = max_it);
      cout << res.first << "\n" << res.second << endl;
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
    auto game_id = stoll(params["game_id"]);
    auto mv = stoi(params["move"]);
    if (searches.count(game_id)) {
      searches.at(game_id).makeMove(mv);
      cerr << searches.at(game_id).game << endl;
    } else {
      cerr << "Game ID not found" << endl;
      exit(1);
    }
    cerr << "SUCESS" << endl;

    // We don't have a function for this yet.
  } /* move() */

  /*
   * sir this is a Wendys
   */

  void buy() {
    auto params = load_params();
    (void) params;
    // we don't have a function for this yet.
  } /* buy() */
};

int main() {
  auto handler = Handler();
  handler.run();
}


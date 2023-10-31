#include <bits/stdc++.h>
#include "Helpers.h"
#include "Search.h"
using namespace std;

enum Request {
  INIT,
  GET,
  MOVE,
  BUY
}

// Communicates with a node.js server via stdin and stdout.
struct Handler {
  map<int, Search> searches;
  Handler() {}

  /*
   * Reads in a request as a Request object.
   */

  Request get_request() {
    string request; cin >> request;
    if (!(cin >> request)) exit(0);
    if (request == "INIT") return Request:INIT;
    if (request == "GET")  return Request:GET;
    if (request == "MOVE") return Request:MOVE;
    if (request == "BUY")  return Request:BUY;
    cerr << "INVALID REQUEST\n";
    exit(1);
  } /* get_request() */

  /*
   * Handles requests
   */

  void run() {
    while (true) {
      Request r = get_request();
      switch (r) {
        case INIT: init(), break;
        case GET:  get(),  break;
        case MOVE: move(), break;
        case BUY:  buy(),  break;
      }
    }
  } /* run() */

  /*
   * Creates the search tree,
   * Based on parameters read in from the server.
   */

  void init(int game_id) {
    auto gc = GameConfig(0, 0, 0);
    searches[game_id] = new Search(gc);
  } /* init() */

  /*
   * gets the AIs move for the specified game.
   * advances the internal state of the search tree.
   */

  void get(int game_id) {
    auto res = searches[game_id].getMove(1);
    cout << res << "\n";
  } /* get() */
}

int main() {
  auto handler = Handler();
  handler.run();
}


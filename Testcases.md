# User Story 1

Step | Directions | Expected Output
--- | --- | ---
1 | Go to localhost:8000 | Main menu appears
2 | Click the create game button | Room lobby screen appears
3 | Click the X button | Go back to main menu
4 | Click the join game button | Join room screen appears
5 | Click the X button | Go back to main menu
6 | Click the settings button | Settings screen appears
7 | Click the X button | Go back to main menu

# User Story 2 and 3

Start on main menu

Step | Directions | Expected Output
--- | --- | ---
1 | Click the create game button | Room lobby screen appears with your player name (random name), and a room code with 4 random characters
2 | In a 2nd client, click the join game button and enter an invalid room code | A warning popup appears stating that the code is invalid.
3 | In the 2nd client, enter the valid room code | Room lobby screen appears with correct room code and 2 players in player list on both screens
4 | Click the X button on 2nd client | 1st client will see player list remove the 2nd client
5 | Re-join the room in 2nd client | Player list updates to 2 players
6 | In 1st client, leave the room | 2nd client is also kicked from room
7 | Click the join game button and enter the old room code | A warning popup appears stating that the code is invalid.
8 | In 1st client create new game, in 2 other clients join lobby | Player list updates to 3 players.
9 | Press the start game button on 1st client | Game will not start
10 | In 4th client join game | Player list will update to 4 players.
11 | In 5th client attempt to join same lobby | 5th client will be unable to join lobby.
12 | In 1st client, press start game | Game will start and all players will be sent to game screen.
13 | See above | Game board has a grid of tiles.

# User Story 4, 6 and 8

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Join game screen | Grass tiles, mountain tiles, and cows will be generated on the board consistent across all clients
2 | Join all new game | Game board has possibility of being a different layout and different card layouts

# User Story 5 

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Join game screen | Units are loaded onto the board, with UFOs of different colors and jets of different colors, consistent across all clients
2 | See above | UI shows the color of the player
3 | See above | No units are ontop of other units or ontop of mountains

# User Story 6

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | View the cards and card queue | 3 cards on bottom left of screen, the card queue, then 3 cards on bottom right of screen. There are arrows on the cards.

# User Story 7

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Click on any card in the player hand | Note pieces move and card queue and hand updates
2 | View hand | Cards clicked are no longer in hand and moves reflected across all clients
3 | View hand | There are 4 different types of movement directions

# User Story 8

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Play any card | The card queue loses its first card and it is put into the hand
2 | Note the current card queue and make a new game | The card queue is different from before but the same for all players

# User Story 9

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Move on turn | Note the turn changed and the player’s units moved.
2 | Move off turn | Note the game state does not change
3 | See above to 1 | Note the game control has changed
4 | Make a move | Note the current player display shifting and the turn number updating after the last player plays

# User Story 10

Start on game screen

1 | Make 2 moves on appropriate 2 clients | Move will reflect across clients and UI tirn will update to enemy's turn
2 | Wait a few seconds | Enemy units will make a random move that is the same across all players and the turn will go back to a player
3 | Continue play among 4 clients | Clients will take turns and the enemies will move once every 2 player turns

# User Story 11

Start on game screen

1 | Make a move on the current player such that some UFOs have empty tiles ahead, and some have obstacles ahead | UFOs will collide with obstacle tiles, and only UFOs with empty tiles ahead will move.
2 | Use debugging arrow keys to move UFOs towards jets and let AI move jets into a player piece. | Jets will destroy overlapping player pieces such that the player has less pieces

# User Story 12

Start on game screen

1 | Hover over a UFO unit | An popup will show the points/cows contained in the UFO
2 | Move a UFO onto a cow tile (via debug or cards) | The cow will disappear from the tile
3 | Hover over the UFO unit | The popup will show +1 point
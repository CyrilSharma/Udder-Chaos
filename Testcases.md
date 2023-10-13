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

# User Story 2

Start on main menu

Step | Directions | Expected Output
--- | --- | ---
1 | Click the create game button | Room lobby screen appears with your player name (random name), and a room code with 4 random characters
2 | 
3 | 

# User Story 10

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Make 2 moves on appropriate 2 clients | Move will reflect across clients and UI tirn will update to enemy's turn
2 | Wait a few seconds | Enemy units will make a random move that is the same across all players and the turn will go back to a player
3 | Continue play among 4 clients | Clients will take turns and the enemies will move once every 2 player turns

# User Story 11

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Make a move on the current player such that some UFOs have empty tiles ahead, and some have obstacles ahead | UFOs will collide with obstacle tiles, and only UFOs with empty tiles ahead will move.
2 | Use debugging arrow keys to move UFOs towards jets and let AI move jets into a player piece. | Jets will destroy overlapping player pieces such that the player has less pieces

# User Story 12

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Hover over a UFO unit | An popup will show the points/cows contained in the UFO
2 | Move a UFO onto a cow tile (via debug or cards) | The cow will disappear from the tile
3 | Hover over the UFO unit | The popup will show +1 point
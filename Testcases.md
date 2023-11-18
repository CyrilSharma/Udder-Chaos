# Sprint 1
## User Story 1

Step | Directions | Expected Output
--- | --- | ---
1 | Go to localhost:8000 | Main menu appears
2 | Click the create game button | Room lobby screen appears
3 | Click the X button | Go back to main menu
4 | Click the join game button | Join room screen appears
5 | Click the X button | Go back to main menu
6 | Click the settings button | Settings screen appears
7 | Click the X button | Go back to main menu

## User Story 2 and 3

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

## User Story 4, 6 and 8

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Join game screen | Grass tiles, mountain tiles, and cows will be generated on the board consistent across all clients
2 | Join all new game | Game board has possibility of being a different layout and different card layouts

## User Story 5 

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Join game screen | Units are loaded onto the board, with UFOs of different colors and jets of different colors, consistent across all clients
2 | See above | UI shows the color of the player
3 | See above | No units are ontop of other units or ontop of mountains

## User Story 6

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | View the cards and card queue | 3 cards on bottom left of screen, the card queue, then 3 cards on bottom right of screen. There are arrows on the cards.

## User Story 7

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Click on any card in the player hand | Note pieces move and card queue and hand updates
2 | View hand | Cards clicked are no longer in hand and moves reflected across all clients
3 | View hand | There are 4 different types of movement directions

## User Story 8

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Play any card | The card queue loses its first card and it is put into the hand
2 | Note the current card queue and make a new game | The card queue is different from before but the same for all players

## User Story 9

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Move on turn | Note the turn changed and the player’s units moved.
2 | Move off turn | Note the game state does not change
3 | See above to 1 | Note the game control has changed
4 | Make a move | Note the current player display shifting and the turn number updating after the last player plays

## User Story 10

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Make 2 moves on appropriate 2 clients | Move will reflect across clients and UI tirn will update to enemy's turn
2 | Wait a few seconds | Enemy units will make a random move that is the same across all players and the turn will go back to a player
3 | Continue play among 4 clients | Clients will take turns and the enemies will move once every 2 player turns

## User Story 11

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Make a move on the current player such that some UFOs have empty tiles ahead, and some have obstacles ahead | UFOs will collide with obstacle tiles, and only UFOs with empty tiles ahead will move.
2 | Use debugging arrow keys to move UFOs towards jets and let AI move jets into a player piece. | Jets will destroy overlapping player pieces such that the player has less pieces

## User Story 12

Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Hover over a UFO unit | An popup will show the points/cows contained in the UFO
2 | Move a UFO onto a cow tile (via debug or cards) | The cow will disappear from the tile
3 | Hover over the UFO unit | The popup will show +1 point
# Sprint 2
## User Story 1
Start on game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Start a game | Upon viewing the board there are 4 planes of different colors
2 | See step 1 | Upon viewing the board, the cows are spawned on distinct tiles

## User Story 2
Step | Directions | Expected Output
--- | --- | ---
1 | enter “udder-chaos.org” into a web browser | Note the UI
2 | open a locally hosted version of the game | Note that the UI is identical to the web version
3 | open the web version (4 times if needed) and start a game | Note that all clients are brought into the game (thus functionally the same as local version and connected automatically to socket server)
4 | start a web game and make a few moves | Note the AI makes moves (same as local version)

## User Story 3
Start on the main menu screen

Step | Directions | Expected Output
--- | --- | ---
1 | Join a game lobby | Any color is selectable
2 | Have another client join the lobby | Colors selected by other players are not selectable
3 | Rename yourself | The player name changes and is reflected across other clients
4 | Change your color | The player color changes and is reflected across other clients
5 | Click the rename selector and enter a lot of characters | The number of characters entered caps at a set number
6 | Join lobby as host, and set a seed for the lobby and play the game, create a new lobby with the same seed and play the game (if time allows)  | The same seed results in the same randomness, so cows spawn in the same location, and cards are the same
7 | Join the lobby as a non-host, and attempt to set the seed | The seed does not change / is not interactable
8 | Put 4 players in a lobby, and attempt to start the game without everyone selecting a color. Then have each player select a color and try again. | The start button is not interactable until all 4 players have picked a color

## User Story 4
Start on the game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Start a few games and try to show all rendered cards | There are no visual bugs and each type of card is rendered appropriately 
2 | Play a combination card | The moves are executed in sequence without any errors
3 | See above | Each move is visibly played before the next, with some small delay between each move
4 | Attempt to move pieces through obstacles, off the grid, and through each other | The pieces don't make any illegal moves

## User Story 5
Start on Visual Studio Code

Step | Directions | Expected Output
--- | --- | ---
1 | Show the AI engine communicating with clients | It communicates
2 | See above | It parses and makes moves correctly
3 | Make some moves | The states match
4 | Make an AI move | The move returns in under 3 seconds
5 | Run search test cases searchCapture1, searchCapture2, searchLongCapture | Passes all tests 

## User Story 6
Start on Visual Studio Code

Step | Directions | Expected Output
--- | --- | ---
1 | run searchTests | Note layers are turns, searched in order
2 | See above | Note that evaluations are displayed for good moves
3 | run searchPrune1, searchPrune2 | Note that it prunes things
4 | run searchIterative if asked | Note that you can see things
5 | run searchTests and scroll up | Note that a different heuristic can be passed in, show source if needed

## User Story 7
Start on Visual Studio Code

Step | Directions | Expected Output
--- | --- | ---
1 | run searchPrune2 | Note that evals are reused
2 | run searchIterative | Note that eval scores are in reverse order
3 | See above | Note custom heuristic

## User Story 8
Start on the game screen

Step | Directions | Expected Output
--- | --- | ---
1 | View the board | There is a distinct safe zone tile sprite where the UFOs spawn
2 | See above | There is a score counter on the game screen
3 | Adbuct a cow with a UFO, then move to safe zone tile. | The UFO will decrease to 0 score.
4 | See above | The score counter will increase by the UFO's score.

## User Story 9
Start on the main menu screen

Step | Directions | Expected Output
--- | --- | ---
1 | Resize the window | The buttons are moved and do not overlap with each other within reason
2 | Join and start a game | One of the player icons on the left side of the screen glows to indicate their turn.
3 | Move the current player | The glow will update to the next player's turn.
4 | Be in game | There is a color display in the bottom left which clearly shows what color the player is
5 | Look at different player screens | For each player screen, they have a different color display that accurately represents their color
6 | Be in game | There is a piece count on each player icon which clearly displays how pieces this player has
7 | Purchase a UFO | The piece count is updated to reflect the new UFO
8 | Destroy a UFO | The piece count is updated to reflect the removed UFO
9 | Be in game | There is a clear divider between player hand, enemy hand, and card queue

## User Story 10
Start on the game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Complete a round of the game without having 3 cows | The game ends with a loss screen and the end game UI appears
2 | Lose all of a player's pieces | The game ends with a loss screen and the end game UI appears
3 | Collect enough cows to meet the win requirement | The game ends with a win screen and the end game UI appears
4 | See above | Note that a separate win and loss screen exists with an exit button
5 | Click the exit button | The client is returned to the main screen and removed from the room

## User Story 11
Start on the game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Move a unit through an unobstructed tile | There is a sliding animation for the unit
2 | Move a unit into an obstructed tile | There is an obstruction animation for the unit
3 | Have an enemy kill a player | There is a destruction animation for the enemy and the player
4 | Capture a cow with a unit | There is an abduction animation for the cow 

## User Story 14
Create a new game

Step | Directions | Expected Output
--- | --- | ---
1 | View the screen | There is a purchase UFO button
2 | Without any score, observe the purchase button | The button is grayed out and does not allow a user to purchase a UFO
3 | Gain score and purchase a UFO | The purchase button is no longer grayed out and correctly spawns UFO on the board; score is decreased by 1
4 | Move a unit into an enemy unit | The enemy unit is destroyed
5 | Hold and drag on a card | The card rotates in the direction of drag
6 | Rotate a card like above, observe player hand from a second client | The card rotation is reflected on the other client
7 | Play the card on a new client | The movement reflects the rotated movement

## User Story 15
Start on the game screen

Step | Directions | Expected Output
--- | --- | ---
1 | Abduct a cow and play a few turns | A counter appears on the tile when the cow is abducted and counts down
2 | Play until the counter reaches 0 | A cow respawns on the tile where the counter reaches 0
3 | Have each player play a turn (to day end) | The day counter increases by 1
4 | Play until the day counter fills up | A sacrifice is made, reducing abducted cows by 3
5 | See above | Jets are spawned at the center of the board if those tiles are empty
6 | See above | The day counter will be reset.
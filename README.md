# Udder-Chaos
Udder Chaos: A Cow Caper is a fast-paced card-based strategy game about aliens abducting cows and avoiding the pesky humans.
Frontend is built with PixiJS and is heavily based off of: https://github.com/pixijs/open-games/tree/main/puzzling-potions.

# Installation
## Requirements
node version 20

## Frontend
install: npm install
run: npm run start

## Server
install: npm install
run: npm run dev

## AI-Engine
install - 

If you do not have the AI binaries:
    First install the OpenCilk Compiler: https://www.opencilk.org/doc/users-guide/install/
    Make sure you place it in a directory called opt/opencilk/
    cd into the directory cpp, then run make (note that the makefile expects WSL or MAC as your OS)

cd into the ai-engine folder
run npm install

run: npm run dev
test - 
You may have to run make to build the binaries.
Run ./TestGame to run the Game Test Suite.
Run ./TestSearch to run the Search Test Suite.
Run cpp/Arena cpp/Main cpp/Main to play the AI against itself.

# Attributions
Music by Eric Matyas
www.soundimage.org
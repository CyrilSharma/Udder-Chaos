# Engine Setup

1. Run npm install.

If you want to use the random AI:
1. Run: node random-ai.js

To use the actual AI, you will need to:
1. Download a C++ compiler if you don't already have one.
2. Download Boost: https://boostorg.jfrog.io/artifactory/main/release/1.83.0/source/
3. Place Boost in the cpp directory (you should see it's gitignored).
4. Run: make
5. Run: npm run dev

# Debugging

The AI isn't super reliable right now, but we provide lots of logging information.
The AI will mention in the terminal if it has crashed, what it thinks the game state is, what move it last played, etc.
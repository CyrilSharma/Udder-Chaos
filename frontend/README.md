# Prerequisites

-   NodeJS - https://nodejs.org/
-   NPM - Comes with NodeJS, for package management

# Setup & Run The Game

```sh

# Enter the project folder
cd ./frontend

# Install dependencies
npm install

# Start the project for development
npm run start
```
If you're curious what everything is doing here's the gist:
vite - spins up a server so we can see what our project looks like.
.prettierrc.json - a code formatter.
tsconfig.json - typescript is an extention to JS which enables typing. This configures its compiler.


# Building The Game

```sh
# Compile the game for publishing, outputs to `dist/`
npm run build

# Build the game for publishing and preview it locally
npm run preview
```

# Project Structure

### `./src/main.ts` file

Where everything starts. Sets up the PixiJS app and initialise navigation.

### `./src/screens` folder

All screens displayed by the app.

### `./src/ui` folder

All UI components shared across screens.

### `./src/utils` folder

All the shared utility code.

### `./raw-assets` folder

Uncompiled assets grouped in folders that will be translated into assets bundles for loading.

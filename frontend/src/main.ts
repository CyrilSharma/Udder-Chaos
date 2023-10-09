import { Application } from 'pixi.js';
import { navigation } from './utils/navigation';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';

/** The PixiJS app Application instance, shared across the project */
export const app = new Application<HTMLCanvasElement>({
    resolution: Math.max(window.devicePixelRatio, 2),
    backgroundColor: 0xffffff,
});

/** Set up a resize function for the app */
function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const minWidth = 375;
    const minHeight = 700;

    // Calculate renderer and canvas sizes based on current dimensions
    const scaleX = windowWidth < minWidth ? minWidth / windowWidth : 1;
    const scaleY = windowHeight < minHeight ? minHeight / windowHeight : 1;
    const scale = scaleX > scaleY ? scaleX : scaleY;
    const width = windowWidth * scale;
    const height = windowHeight * scale;

    // Update canvas style dimensions and scroll window up to avoid issues on mobile resize
    app.renderer.view.style.width = `${windowWidth}px`;
    app.renderer.view.style.height = `${windowHeight}px`;
    window.scrollTo(0, 0);

    // Update renderer  and navigation screens dimensions
    app.renderer.resize(width, height);
    navigation.resize(width, height);
}

/** Setup app and initialise assets */
async function init() {
    // Add pixi canvas element (app.view) to the document's body
    document.body.appendChild(app.view);

    // Whenever the window resizes, call the 'resize' function
    window.addEventListener('resize', resize);

    // Trigger the first resize
    resize();

    // await navigation.showScreen(HomeScreen);
    // Show initial loading screen
    /* await navigation.showScreen(LoadScreen);

    // Go to one of the screens if a shortcut is present in url params, otherwise go to home screen
    if (getUrlParam('game') !== null) {
        await navigation.showScreen(GameScreen);
    } else if (getUrlParam('load') !== null) {
        await navigation.showScreen(LoadScreen);
    } else if (getUrlParam('result') !== null) {
        await navigation.showScreen(ResultScreen);
    } else {
        await navigation.showScreen(HomeScreen);
    } */    
    let screen = new GameScreen();
    screen.prepare();
    app.stage.addChild(screen);

    let keypress = (e: KeyboardEvent) => {
        let key = -1;
        if (e.key === 'ArrowLeft') {
            console.log('Left arrow key was pressed');
            key = 2;
        } else if (e.key === 'ArrowRight') {
            console.log('Right arrow key was pressed');
            key = 0;
        } else if (e.key === 'ArrowUp') {
            console.log('Up arrow key was pressed');
            key = 1;
        } else if (e.key === 'ArrowDown') {
            console.log('Down arrow key was pressed');
            key = 3;
        }
        if (key == -1) return;
        screen.move(key);
    };
    window.addEventListener('keydown', keypress);
}

// Init everything
init();

/*
// PIXI JS Masking tutorial
// Create the application helper and add its render target to the page
let app = new PIXI.Application({ width: 960, height: 360, backgroundColor: 0xffffff });
document.body.appendChild(app.view);

// Create window frame
let frame = new PIXI.Graphics();
frame.beginFill(0xf1f1f1);
frame.lineStyle({ color: 0x123456, width: 4, alignment: 0 });
frame.drawRect(0, 0, 208, 208);
frame.position.set(320 - 104, 180 - 104);
app.stage.addChild(frame);

// Create a graphics object to define our mask
let mask = new PIXI.Graphics();
// Add the rectangular area to show
mask.beginFill(0x123456);
mask.drawRect(0,0,200,200);
mask.endFill();

// Add container that will hold our masked content
let maskContainer = new PIXI.Container();
// Set the mask to use our graphics object from above
maskContainer.mask = mask;
// Add the mask as a child, so that the mask is positioned relative to its parent
maskContainer.addChild(mask);
// Offset by the window's frame width
// maskContainer.position.set(2,2);
// And add the container to the window!
frame.addChild(maskContainer);

// Create contents for the masked container
let text = new PIXI.Text(
  'This text will scroll up and be masked, so you can see how masking works.  Lorem ipsum and all that.\n\n' +
  'You can put anything in the container and it will be masked!',
  {
    fontSize: 24,
    fill: 0x1010ff,
    wordWrap: true,
    wordWrapWidth: 180
  }
);
text.x = 10;
maskContainer.addChild(text);

// Add a ticker callback to scroll the text up and down
let elapsed = 0.0;
app.ticker.add((delta) => {
  // Update the text's y coordinate to scroll it
  elapsed += delta;
  text.y = 10 + -100.0 + Math.cos(elapsed/50.0) * 100.0;
}); */
import * as PIXI from 'pixi.js';
import { GameScreen } from './screens/GameScreen';

/** The PixiJS app Application instance, shared across the project */
export const app = new PIXI.Application<HTMLCanvasElement>({
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
}

/** Setup app and initialise assets */
async function init() {
    // Add pixi canvas element (app.view) to the document's body
    document.body.appendChild(app.view);

    // Whenever the window resizes, call the 'resize' function
    window.addEventListener('resize', resize);

    // Trigger the first resize
    resize();

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

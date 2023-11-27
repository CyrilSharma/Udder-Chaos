import * as PIXI from 'pixi.js';
import { navigation } from './utils/navigation';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import server from "./server";
import { SoundHandler } from './game/SoundHandler';

localStorage.clear();
SoundHandler.preloadAudio();

/** The PixiJS app Application instance, shared across the project */
export const app = new PIXI.Application<HTMLCanvasElement>({
    resolution: Math.max(window.devicePixelRatio, 2),
    backgroundColor: 0xffffff,
});

// Load google fonts before starting...
(window as any).WebFontConfig = {
    google: {
        families: ['Concert One', 'Snippet'],
    },
    active()
    {
        init();
    },
};

(function() {
    const wf = document.createElement('script');
    wf.src = `${document.location.protocol === 'https:' ? 'https' : 'http'
    }://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js`;
    wf.type = 'text/javascript';
    wf.async = true;
    const s = document.getElementsByTagName('script')[0];
    if (s.parentNode) {
        s.parentNode.insertBefore(wf, s);
    }
}());

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

    await navigation.showScreen(HomeScreen);

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

    // let screen = new GameScreen();
    // screen.prepare();
    // app.stage.addChild(screen);

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
        navigation?.move(key);
    };
    window.addEventListener('keydown', keypress);
}

// Init everything
//init();
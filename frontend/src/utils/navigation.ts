import { Container } from 'pixi.js';
import { app } from '../main';

/** Interface for app screens */
interface AppScreen extends Container {
    readonly SCREEN_ID: string;
    /** Show the screen */
    show?(): Promise<void>;
    /** Prepare screen, before showing */
    prepare?(): void;
    /** Reset screen, after hidden */
    reset?(): void;
    /** Debug function, allows manual control of pieces */
    move?(key: number): void;
    /** Resize the screen */
    resize?(width: number, height: number): void;
}

interface AppScreenConstructor {
    
    /** List of assets bundles required by the screen */
    assetBundles?: string[];
    new (): AppScreen;
}

class Navigation {
    /** Container for screens */
    public container = new Container();

    /** Application width */
    public width = 0;

    /** Application height */
    public height = 0;

    /** Current screen being displayed */
    public currentScreen?: AppScreen;

    public move(key: number) {
        this.currentScreen?.move?.(key);
    }
 

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.currentScreen?.resize?.(width, height);
    }

    /** Remove screen from the stage, unlink update & resize functions */
    private async hideAndRemoveScreen(screen: AppScreen) {
        // Prevent interaction in the screen
        screen.interactiveChildren = false;

        // // Hide screen if method is available
        // if (screen.hide) {
        //     await screen.hide();
        // }

        // // Unlink update function if method is available
        // if (screen.update) {
        //     app.ticker.remove(screen.update, screen);
        // }

        // Remove screen from its parent (usually app.stage, if not changed)
        if (screen.parent) {
            screen.parent.removeChild(screen);
        }

        // Clean up the screen so that instance can be reused again later
        if (screen.reset) {
            screen.reset();
        }
    }

    public async showScreen(ctor: AppScreenConstructor) {

        // Block interactivity in current screen
        if (this.currentScreen) {
            this.currentScreen.interactiveChildren = false;
        }
        
        // If there is a screen already created, hide and destroy it
        if (this.currentScreen) {
            await this.hideAndRemoveScreen(this.currentScreen);
        }

        this.currentScreen = new ctor;
        await this.addAndShowScreen(this.currentScreen);
    }

    /** Add screen to the stage, link update & resize functions */
    private async addAndShowScreen(screen: AppScreen) {
        // Add navigation container to stage if it does not have a parent yet
        if (!this.container.parent) {
            app.stage.addChild(this.container);
        }

        // Add screen to stage
        this.container.addChild(screen);

        // Setup things and pre-organise screen before showing
        if (screen.prepare) {
            screen.prepare();
        }

        // Add screen's resize handler, if available
        if (screen.resize) {
            // Trigger a first resize
            screen.resize(this.width, this.height);
        }

        // Show the new screen
        if (screen.show) {
            screen.interactiveChildren = false;
            await screen.show();
            screen.interactiveChildren = true;
        }
    }

    /** Get current screen id */
    public getScreenId() {
        return this.currentScreen?.SCREEN_ID;
    }

}

/** Shared navigation instance */
export const navigation = new Navigation();
import { Container } from 'pixi.js';
import { app } from '../main';

/** Interface for app screens */
interface AppScreen extends Container {
    /** Show the screen */
    show?(): Promise<void>;
    /** Prepare screen, before showing */
    prepare?(): void;
    /** Reset screen, after hidden */
    reset?(): void;
    /** Resize the screen */
    resize?(width: number, height: number): void;
}

interface AppScreenConstructor {
    new (): AppScreen;
    /** List of assets bundles required by the screen */
    assetBundles?: string[];
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

 

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.currentScreen?.resize?.(width, height);
    }

    public async showScreen(ctor: AppScreenConstructor) {
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

}

/** Shared navigation instance */
export const navigation = new Navigation();
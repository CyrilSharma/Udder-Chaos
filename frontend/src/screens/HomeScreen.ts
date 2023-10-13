import { Container, ObservablePoint, Sprite } from 'pixi.js';
import { navigation } from '../utils/navigation';
import { Background } from '../../ui_components/background';
import { SettingsScreen } from './SettingsScreen';
import server from "../server";
import { JoinGameScreen } from './JoinGameScreen';
import { MenuButton } from '../../ui_components/MenuButton';

/** Screen shows upon opening the website */
export class HomeScreen extends Container {

    private background: Background;
    private createGameButton: MenuButton;
    private joinGameButton: MenuButton;
    private settingsButton: MenuButton;
    private logo: Sprite;

    constructor() {
        super();

        // Background
        this.background = new Background();
        this.addChild(this.background);

        // Logo
        this.logo = Sprite.from('./src/assets/LOGO.png');
        this.logo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.addChild(this.logo);

        // Create Game
        this.createGameButton = new MenuButton("Create Game", 0.3, 0.6, 0xffcc66, 4, 0.15, 60);
        this.createGameButton.getButton().onPress.connect(() => {
            server.createRoom();
        });
        this.addChild(this.createGameButton.getButton());

        // Join Game
        this.joinGameButton = new MenuButton("Join Game", 0.7, 0.6, 0xffcc66, 4, 0.15, 60);
        this.joinGameButton.getButton().onPress.connect(() => {
            navigation.showScreen(JoinGameScreen);
        });
        this.addChild(this.joinGameButton.getButton());

        // Settings
        this.settingsButton = new MenuButton("Settings", 0.5, 0.89, 0xffcc66, 4, 0.15, 60);
        this.settingsButton.getButton().onPress.connect(() => {
            navigation.showScreen(SettingsScreen);
        });
        this.addChild(this.settingsButton.getButton());
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        this.logo.x = width * 0.5;
        this.logo.y = height * 0.3;
        this.logo.height = height * 0.8;
        this.logo.width = this.logo.height;

        this.createGameButton.resize(width, height);
        this.joinGameButton.resize(width, height);
        this.settingsButton.resize(width, height);
        this.background.resize(width, height);
    }

}
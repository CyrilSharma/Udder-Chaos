import { Container, ObservablePoint, Sprite } from 'pixi.js';
import { navigation } from '../utils/navigation';
import { Background } from '../ui_components/Background';
import { SettingsScreen } from './SettingsScreen';
import server from "../server";
import { JoinGameScreen } from './JoinGameScreen';
import { MenuButton } from '../ui_components/MenuButton';
import { TestingScreen } from './TestingScreen';
import { TutorialScreen } from './TutorialScreen';
import { SoundHandler } from '../game/SoundHandler';

/** Screen shows upon opening the website */
export class HomeScreen extends Container {
    public SCREEN_ID = 'home';
    private background: Background;
    private createGameButton: MenuButton;
    private joinGameButton: MenuButton;
    private settingsButton: MenuButton;
    private tutorialButton: MenuButton;
    private settingsScreen: SettingsScreen;
    private logo: Sprite;
    private bgm: HTMLAudioElement = new Audio("sounds/bgm/menu-music.mp3");

    constructor() {
        super();

        // Background
        this.background = new Background();
        this.addChild(this.background);

        // Logo
        this.logo = Sprite.from('../images/LOGO.png');
        this.logo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.addChild(this.logo);

        // Create Game
        this.createGameButton = new MenuButton("Create Game", 0.18, 0.6, 0xF4C418, 4, 0.15, 30);
        this.createGameButton.getButton().onPress.connect(() => {
            server.createRoom();
        });
        this.addChild(this.createGameButton.getButton());

        // Join Game
        this.joinGameButton = new MenuButton("Join Game", 0.82, 0.6, 0xF4C418, 4, 0.15, 30);
        this.joinGameButton.getButton().onPress.connect(() => {
            navigation.showScreen(JoinGameScreen);
        });
        this.addChild(this.joinGameButton.getButton());

        // Settings Button
        this.settingsButton = new MenuButton("Settings", 0.58, 0.8, 0xF4C418, 4, 0.075, 30);
        this.addChild(this.settingsButton.getButton());

        // Tutorial
        this.tutorialButton = new MenuButton("Tutorial", 0.42, 0.8, 0xF4C418, 4, 0.075, 30);
        this.tutorialButton.getButton().onPress.connect(() => {
            navigation.showScreen(TutorialScreen);
        });
        this.addChild(this.tutorialButton.getButton());

        SoundHandler.playBGM("menu-music.mp3");
        // Settings Screen/Vignette
        this.settingsScreen = new SettingsScreen();
        this.settingsButton.getButton().onPress.connect(() => {
            this.settingsScreen.visible = true;
        });
        this.addChild(this.settingsScreen);

        this.resize(window.innerWidth, window.innerHeight);
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
        this.tutorialButton.resize(width, height);
        this.settingsScreen.resize(width, height);
    }

}
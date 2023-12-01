import { Container } from 'pixi.js';
import { Background } from '../ui_components/Background';
import { navigation } from '../utils/navigation';
import { HomeScreen } from './HomeScreen';
import server from '../server';
import { MenuContainer } from '../ui_components/MenuContainer';
import { SizedButton } from '../ui_components/SizedButton';
import { LobbyList } from '../ui_components/LobbyList';
import { SeedBox } from '../ui_components/SeedBox';
import { BackButton } from '../ui_components/BackButton';
import { SoundHandler } from '../game/SoundHandler';
import { CustomScreenUI } from '../ui_components/CustomScreenUI';

/** Screen shows upon opening the website */
export class CreateGameScreen extends Container {
    public SCREEN_ID = 'create';
    private background: Background;
    private menuContainer: MenuContainer;
    private lobbyLabel: SizedButton;
    private codeDisplay: SizedButton;
    private startButton: SizedButton;
    private lobbyList: LobbyList;
    //private seedBox: SeedBox;
    private backButton: BackButton;
    private customizeButton: SizedButton;
    private customScreen: CustomScreenUI;

    constructor() {
        super();
        this.background = new Background();
        this.addChild(this.background);

        this.menuContainer = new MenuContainer();
        this.lobbyLabel = new SizedButton(0.32, 0.16, 0.5, 0.25, "Game Lobby", this.menuContainer.width, this.menuContainer.height, 60, 0xffcc66);
        this.menuContainer.addChild(this.lobbyLabel);
        
        this.codeDisplay = new SizedButton(0.75, 0.16, 0.3, 0.25, "Code:\nABCD", this.menuContainer.width, this.menuContainer.height, 40, 0xffcc66);
        this.codeDisplay.changeText("Code:\nABCD");
        this.menuContainer.addChild(this.codeDisplay);

        this.startButton = new SizedButton(0.5, 0.9, 0.3, 0.15, "Start Game", this.menuContainer.width, this.menuContainer.height, 40, 0x6060fc);
        this.startButton.onPress.connect(() => {
            server.startGame();
            server.startGame();
        });
        this.menuContainer.addChild(this.startButton);

        // this.seedBox = new SeedBox(this.menuContainer, 0.82, 0.9, 0.3, 0.15, "Seed", 6);
        // this.menuContainer.addChild(this.seedBox);

        this.lobbyList = new LobbyList(0, this.menuContainer, 0.5, 0.555, 0.64, 0.5);
        this.menuContainer.addChild(this.lobbyList);

        this.backButton = new BackButton(0.985, 0.015, this.menuContainer.width, this.menuContainer.height);
        this.backButton.onPress.connect(() => {
            server.leaveRoom();
            navigation.showScreen(HomeScreen);
        });
        this.menuContainer.addChild(this.backButton);

        this.customizeButton = new SizedButton(0.82, 0.9, 0.25, 0.11, "Customize", this.menuContainer.width, this.menuContainer.height, 30, 0x50aadc);
        this.customizeButton.onPress.connect(() => {
            this.customScreen.visible = true;
            this.customScreen.loadGameSettings();
        });
        this.menuContainer.addChild(this.customizeButton);

        this.addChild(this.menuContainer);

        SoundHandler.playBGM("lobby-music.mp3");
        this.customScreen = new CustomScreenUI();
        this.addChild(this.customScreen);

        this.resize(window.innerWidth, window.innerHeight);

    }

    public async addGameCode(code: string) {
        this.codeDisplay.changeText("Code:\n" + code);
    }

    public getSeed() {
        return this.customScreen.getSeed();
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        this.menuContainer.resize(width, height);
        this.lobbyLabel.resize(this.menuContainer.getBox());
        this.codeDisplay.resize(this.menuContainer.getBox());
        this.startButton.resize(this.menuContainer.getBox());
        this.lobbyList.resize(this.menuContainer.getBox());
        //this.seedBox.resize(this.menuContainer.getBox());
        this.backButton.resize(this.menuContainer.getBox());
        this.customizeButton.resize(this.menuContainer.getBox());
        this.customScreen.resize(width, height);
    }

    public getLobbyList() {
        let tmp = this.lobbyList;
        for (let i = 0; i < tmp.numPlayers(); i++) {
            if (tmp.players[i].color == 4) {
                tmp.players[i].color = -1;
            }
        }
        return tmp;
    }
}
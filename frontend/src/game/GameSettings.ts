import { defaultGameSettings, gameSettingsData } from "./Utils";

/**
 * Track game settings for the last played game to save settings across play sessions.
 * Also allows other classes to load and save game settings externally.
 */

const KEY_GAME_SETTINGS = "game-settings"

export class GameSettings {
    private settingsData: gameSettingsData = defaultGameSettings;

    constructor() {
        this.settingsData = this.load();
    }

    public getValue(key: string) {
        if (key in this.settingsData) {
            return this.settingsData[key as keyof typeof this.settingsData]
        }
        console.log("Couldn't find that value, resetting game settings!");
        this.save(defaultGameSettings);
        return 0;
    }

    public load() {
        let settings = sessionStorage.getItem(KEY_GAME_SETTINGS);
        if (!settings) { return defaultGameSettings; }
        try {
            let parsed = JSON.parse(settings);
            console.log(parsed);
            if ((typeof parsed === "object")
             && (parsed !== null) 
             && (Object.keys(parsed).every((key) => key in defaultGameSettings))) {
                return parsed;
            }
            return defaultGameSettings;
        } catch (e) {
            console.warn(e);
            return defaultGameSettings;
        }
    }

    public save(data: gameSettingsData) {
        this.settingsData = data;
        sessionStorage.setItem(KEY_GAME_SETTINGS, JSON.stringify(data));
    }
}

export const gameSettings = new GameSettings();
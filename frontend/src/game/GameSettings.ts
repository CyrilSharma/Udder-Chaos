import { defaultGameSettings, gameSettingsData } from "./Utils";

/**
 * Track game settings for the last played game to save settings across play sessions.
 * Also allows other classes to load and save game settings externally.
 */

const KEY_GAME_SETTINGS = "game-settings"

export class GameSettings {
    public load() {
        let settings = localStorage.getItem(KEY_GAME_SETTINGS);
        if (!settings) {
            return defaultGameSettings;
        }
        try {
            return JSON.parse(settings);
        } catch (e) {
            console.warn(e);
            return undefined;
        }
    }

    public save(data: gameSettingsData) {
        localStorage.setItem(KEY_GAME_SETTINGS, JSON.stringify(data));
    }
}

export const gameSettings = new GameSettings();
import { defaultGlobalSettings, globalSettingsData } from "./Utils";

/**
 * Track global settings (such as volume)
 */

const KEY_GLOBAL_SETTINGS = "global-settings"

export class GlobalSettings {
    private settingsData: globalSettingsData = defaultGlobalSettings;

    constructor() {
        this.settingsData = this.load();
    }

    public getValue(key: string) {
        if (key in this.settingsData) {
            return this.settingsData[key as keyof typeof this.settingsData]
        }
        console.log(this.settingsData);
        console.log(`Couldn't find value: ${key}, resetting game settings!`);
        this.save(defaultGlobalSettings);
        return this.settingsData[key as keyof typeof this.settingsData];
    }

    public load() {
        let settings = sessionStorage.getItem(KEY_GLOBAL_SETTINGS);
        if (!settings) {
            return defaultGlobalSettings;
        }
        try {
            let parsed = JSON.parse(settings);
            console.log(parsed);
            if ((typeof parsed === "object")
             && (parsed !== null) 
             && (Object.keys(defaultGlobalSettings).every((key) => key in parsed))) {
                return parsed;
            }
            return defaultGlobalSettings;
        } catch (e) {
            console.warn(e);
            return defaultGlobalSettings;
        }
    }

    public save(data: globalSettingsData) {
        this.settingsData = data;
        sessionStorage.setItem(KEY_GLOBAL_SETTINGS, JSON.stringify(data));
    }
}

export const globalSettings = new GlobalSettings();
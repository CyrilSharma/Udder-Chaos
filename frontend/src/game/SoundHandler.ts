export class SoundHandler {
    public static currentBgm: string = "game-music.mp3";
    private static bgmVolume: number = 0.0;
    private static sfxVolume: number = 0.0;
    private static bgmPath: string = "sounds/bgm/";
    private static sfxPath: string = "sounds/sound-effects/";
    private static bgm: HTMLAudioElement = new Audio(SoundHandler.bgmPath + "menu-music.mp3");
    
    private static allSFXFiles = ["card-play.ogg", "cow-moo.mp3", "plane-move.ogg", "ufo-abduction.ogg", "ufo-destroyed.mp3",
                                            "ufo-laser.ogg", "ufo-move.ogg", "ufo-purchased.ogg"];
    private static allBGMFiles = ["game-music.mp3", "lobby-music.mp3", "menu-music.mp3"];

    private static SFXlist: { [key: string] : HTMLAudioElement } = {}
    private static BGMlist: { [key: string] : HTMLAudioElement } = {}

    // Load all audio files into cache
    public static preloadAudio() {
        console.log("Loading audio files");
        for (let file of SoundHandler.allSFXFiles) {
            SoundHandler.SFXlist[file] = new Audio(SoundHandler.sfxPath + file);
        }
        for (let file of SoundHandler.allBGMFiles) {
            SoundHandler.BGMlist[file] = new Audio(SoundHandler.bgmPath + file);
        }
    }

    public static playBGM(file?: string) {
        // console.log(SoundHandler.currentBgm);
        // console.log(file);
        if (typeof file !== 'undefined' && file != SoundHandler.currentBgm) {
            console.log("new sound");
            // stop old sound
            SoundHandler.bgm.pause();
            SoundHandler.bgm.currentTime = 0;
            
            SoundHandler.bgm = SoundHandler.BGMlist[file];
            SoundHandler.bgm.loop = true;
            SoundHandler.bgm.volume = this.bgmVolume;
            SoundHandler.currentBgm = file;
        }
        console.log(SoundHandler.bgm.paused);
        if (SoundHandler.bgm.paused) {
            // thank you to
            // https://stackoverflow.com/questions/68594620/automatically-play-audio-object-in-javascript
            SoundHandler.bgm.play().catch(e => {
                window.addEventListener('click', () => {
                SoundHandler.bgm.play()
                }, { once: true })
            })
        }
    }    

    public static pauseBGM() {
        SoundHandler.bgm.pause();
    }

    public static resumeBGM() {
        SoundHandler.bgm.play();
    }

    public static stopBGM() {
        SoundHandler.bgm.pause();
        SoundHandler.bgm.currentTime = 0;
    }

    public static changeBGMVolume(vol: number) {
        SoundHandler.bgmVolume = vol;
        SoundHandler.bgm.volume = vol;
    }

    public static playSFX(file: string) {
        let tmpAudio = SoundHandler.SFXlist[file];
        tmpAudio.volume = SoundHandler.sfxVolume;
        tmpAudio.play();
    }

    public static changeSFXVolume(vol: number) {
        SoundHandler.sfxVolume = vol;
    }
}

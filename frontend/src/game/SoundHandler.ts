export class SoundHandler {
    public static bgm: HTMLAudioElement = new Audio("sounds/game-music.mp3");
    public static curfile: string = "sounds/game-music.mp3";
    private static volume: number = 1.0;

    public static playBGM(file?: string) {
        console.log(SoundHandler.curfile);
        console.log(file);
        if (typeof file !== 'undefined' && file != SoundHandler.curfile) {
            console.log("new sound");
            // stop old sound
            SoundHandler.bgm.pause();
            SoundHandler.bgm.currentTime = 0;
            
            SoundHandler.bgm = new Audio(file);
            SoundHandler.bgm.loop = true;
            SoundHandler.bgm.volume = this.volume;
            SoundHandler.curfile = file;
        }
        console.log(SoundHandler.bgm.paused);
        if (SoundHandler.bgm.paused) {
            try {
                SoundHandler.bgm.play();
            } catch (error) {
                // console.log("playback blocked, autoplay set");
                // SoundHandler.bgm.autoplay = true;
            }
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

    public static changeVolume(vol: number) {
        SoundHandler.bgm.volume = this.volume;
    }
}

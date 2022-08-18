import { Injectable } from "@angular/core";
import { MediaPlayerConstants } from "../common/media-player-constants";

@Injectable({
    providedIn: "root",
})
export class PlayerControlsService {
    constructor() {}

    changeVolume(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                if (data.status == "MUTE") {
                    data.player.mute();
                }
                if (data.status == "UN_MUTE") {
                    data.player.unMute();
                    data.player.setVolume(MediaPlayerConstants.DEFAULT_VOLUME);
                }
                if (data.status == "CHANGE") {
                    data.player.setVolume(data.volume);
                }
                break;
        }
    }

    playVideo(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                data.player.playVideo();
                break;
        }
    }

    pauseVideo(playerType: any, data: any) {
        if (data.status != MediaPlayerConstants.PLAYER_STATUS.playing) {
            return;
        }
        switch (playerType) {
            case "youtube":
                data.player.pauseVideo();
                break;
        }
    }

    stopVideo(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                data.player.stopVideo();
                break;
        }
    }

    seekTo(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                data.player.seekTo(data.seekTo);
                break;
        }
    }

    getDuration(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                return data.player && data.player.getDuration ? data.player.getDuration() : 0.0;
                break;
        }
    }

    getCurrentTime(playerType: any, data: any) {
        switch (playerType) {
            case "youtube":
                return data.player && data.player.getCurrentTime ? data.player.getCurrentTime() : 0.0;
                break;
        }
    }
}

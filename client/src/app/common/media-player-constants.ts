export class MediaPlayerConstants {
    public static DEFAULT_VOLUME = 35;
    public static TYPE = {
        YOUTUBE: "youtube",
    };
    public static PARTY_STATUS = {
        PAUSE: 1,
        RESUME: 2,
    };
    public static PLAYER_STATUS = {
        unstarted: -1,
        ended: 0,
        playing: 1,
        paused: 2,
        buffering: 3,
        video_cued: 5,
    };
}

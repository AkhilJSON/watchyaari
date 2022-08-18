import {
    Component,
    OnInit,
    Input,
    AfterViewInit,
    Inject,
    ɵPlayer,
    Output,
    EventEmitter,
    SimpleChanges,
    OnChanges,
    OnDestroy,
} from "@angular/core";

import { DOCUMENT } from "@angular/common";
import { SharedService } from "../../services/shared.service";

declare var YT: any;

@Component({
    selector: "app-youtube-player",
    templateUrl: "./youtube-player.component.html",
    styleUrls: ["./youtube-player.component.css"],
})
export class YoutubePlayerComponent implements OnInit, OnChanges, OnDestroy {
    @Input() videoId: any;
    @Output() onPlayerReady = new EventEmitter<{ event: any; player: any }>();
    @Output() onPlayerStateChange = new EventEmitter<{
        event: any;
        player: any;
    }>();

    done = false;

    player: any;

    constructor(@Inject(DOCUMENT) private document: Document, private ss: SharedService) {}

    ngOnInit() {}

    ngOnChanges(changes: SimpleChanges) {
        let videoId = changes.videoId && changes.videoId.currentValue;
        if (videoId) {
            this.videoId = videoId;
            if (this.player) {
                this.player.destroy();
            }
            this.onYouTubeIframeAPIReady();
        }
    }

    onYouTubeIframeAPIReady() {
        this.player = new YT.Player("youtubePlayer", {
            videoId: this.videoId,
            playerVars: {
                controls: 0,
                autoplay: 0,
                cc_lang_pref: 0,
                cc_load_policy: 0,
                disablekb: 1,
                iv_load_policy: 3,
                rel: 0,
                modestbranding: 1,
                fs: 0,
            },
            events: {
                onReady: (event) => {
                    this.onPlayerReady.emit({ event, player: this.player });
                },
                onStateChange: (event) => {
                    this.onPlayerStateChange.emit({ event, player: this.player });
                },
            },
        });
    }

    /*  onPlayerReady(event) {
     event.target.playVideo();
   }
 
   onPlayerStateChange(event) {
     this.ss.setYoutubePlayer(this.player);
     if (event.data == YT.PlayerState.PLAYING) {
       this.done = true;
     }
   }
 
   stopVideo() {
     this.player.stopVideo();
   } */

    ngOnDestroy() {
        this.player && this.player.destroy();
    }
}

import { Component, OnInit, Input, OnDestroy, EventEmitter, Output } from "@angular/core";
import { VideoSourceConstants } from "../common/video-source";
import { LoginAuthService } from "../services/login-auth.service";
import { Subscription } from "rxjs";
import { PartyService } from "../services/party.service";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { LoginSignupComponent } from "../account/login-signup/login-signup.component";

@Component({
    selector: "video-results-card",
    templateUrl: "./video-results-card.component.html",
    styleUrls: ["./video-results-card.component.scss"],
})
export class VideoResultsCardComponent implements OnInit, OnDestroy {
    @Input() videoData: any;
    @Input() highVideoCard: any;

    @Output() onLaunchingParty = new EventEmitter<{ startLoading: any }>();
    @Output() onPreviewClicked = new EventEmitter<{}>();

    subscription: any = new Subscription();

    isPartyLaunching: boolean = false;

    constructor(
        private ls: LoginAuthService,
        private router: Router,
        private ps: PartyService,
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {}

    previewThisVideo(video: any, videoSource: any) {
        this.onPreviewClicked.emit({ videoData: video, videoSource });
    }

    createParty() {
        let data = {
            title: this.videoData.snippet.title,
            status: "CREATED",
            videoId: this.videoData.id.videoId,
            videoSource: VideoSourceConstants.YOUTUBE,
        };

        if (!this.ls.isUserLoggedIn()) {
            const dialogRef = this.dialog.open(LoginSignupComponent, {
                width: "550px",
                data: { defaultTab: 0, mode: "launch" },
            });

            let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
                if (result && result.loggedIn) {
                    this.launch(data);
                }
            });

            this.subscription.add(modalResource);
            return;
        } else {
            this.launch(data);
        }
    }

    launch(data: any) {
        //To prevent multiple requests at a time.
        if (this.isPartyLaunching) {
            return;
        }

        this.onLaunchingParty.emit({ startLoading: true });

        data.mode = "SEARCH";

        this.isPartyLaunching = true;
        let launchPartyService = this.ps.launchParty(data).subscribe((res: any) => {
            this.isPartyLaunching = false;
            this.onLaunchingParty.emit({ startLoading: false });
            setTimeout(() => {
                if (res && res.data) {
                    if (res.data.videoId && res.data._id) {
                        this.router.navigateByUrl("partyArea/" + res.data._id);
                    }
                }
            }, 0);
        });

        this.subscription.add(launchPartyService);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

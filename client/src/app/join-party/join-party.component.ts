import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router, ActivatedRoute } from "@angular/router";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import * as moment from "moment/moment";
import { Subscription } from "rxjs";
import {
    PerfectScrollbarConfigInterface,
    PerfectScrollbarComponent,
    PerfectScrollbarDirective,
} from "ngx-perfect-scrollbar";

// components
import { LoginSignupComponent } from "../account/login-signup/login-signup.component";

// services
import { PartyService } from "../services/party.service";
import { MatDialog } from "@angular/material/dialog";
import { SharedService } from "../services/shared.service";

@Component({
    selector: "app-join-party",
    templateUrl: "./join-party.component.html",
    styleUrls: ["./join-party.component.scss"],
})
export class JoinPartyComponent implements OnInit, AfterViewInit, OnDestroy {
    subscription = new Subscription();

    @ViewChild(PerfectScrollbarComponent)
    componentRef?: PerfectScrollbarComponent;
    @ViewChild(PerfectScrollbarDirective)
    directiveRef?: PerfectScrollbarDirective;

    public config: PerfectScrollbarConfigInterface = {};

    public joinForm: FormGroup;

    recentList: any = [];
    fetchingRecentList: boolean;

    upcomingList: any = [];
    fetchingUpcomingList: boolean;

    userLoggedIn: any;

    color = "primary";
    mode = "indeterminate";
    value = 50;
    displayProgressSpinner = false;
    spinnerWithoutBackdrop = true;

    // Layout related declaration STARTS HERE
    isSmallScreenMode: boolean = false;
    // Layout related declaration ENDS HERE

    constructor(
        private fb: FormBuilder,
        private _snackBar: MatSnackBar,
        private ps: PartyService,
        private actiRoute: ActivatedRoute,
        private router: Router,
        private cd: ChangeDetectorRef,
        private ss: SharedService,
        public dialog: MatDialog,
        private breakpointObserver: BreakpointObserver
    ) {
        this.joinForm = this.fb.group({
            partyURL: [null, Validators.compose([Validators.required])],
        });

        let userLoggedInService = this.ss.isUserLoggedIn.subscribe((data: any) => {
            this.userLoggedIn = false;
            if (data && data.loggedIn) {
                this.userLoggedIn = true;
                this.getRecentPartyList();
            }
        });
        this.subscription.add(userLoggedInService);
    }

    ngOnInit(): void {
        this.ss.loggedInUserProfile.subscribe((profile: any) => {
            if (profile) {
                // console.log(profile)
            }
        });

        //###################Media Query <STARTS HERE>###################
        this.breakpointObserver
            .observe([
                Breakpoints.XSmall,
                Breakpoints.Small,
                Breakpoints.Medium,
                Breakpoints.Large,
                Breakpoints.XLarge,
                // XSmall: string; Small: string; Medium: string; Large: string; XLarge: string; Handset: string; Tablet: string; Web: string; HandsetPortrait: string; TabletPortrait: string; WebPortrait: string; HandsetLandscape: string; TabletLandscape: string; WebLandscape: string;
            ])
            .subscribe((result) => {
                let breakPoints = result.breakpoints;
                this.isSmallScreenMode = false;

                //Check if the screen is small
                if (breakPoints[Breakpoints.XSmall]) {
                    this.isSmallScreenMode = true;
                }

                this.cd.detectChanges();
            });
        //###################Media Query <ENDS HERE>###################
    }

    ngAfterViewInit() {
        let partyId = this.actiRoute.snapshot.queryParamMap.get("v") || null;
        if (partyId) {
            this.joinForm.controls.partyURL.setValue(window.location.origin + this.router.url);
            this.joinParty();
            this.cd.detectChanges();
        }
    }

    joinParty() {
        if (this.joinForm.invalid) {
            this.openSnackBar(`Please provide valid Party URL to join`, "", "bottom", "center");
            return;
        }
        let partyId = this.getPartyIdFromURL(this.joinForm.controls.partyURL.value);

        if (!this.userLoggedIn) {
            const dialogRef = this.dialog.open(LoginSignupComponent, {
                width: "550px",
                data: { defaultTab: 0, mode: "join", partyId },
            });

            let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
                if (result && result.loggedIn) {
                    this.join(partyId);
                }
            });

            this.subscription.add(modalResource);
            return;
        }

        this.join(partyId);
    }

    join(partyId: any) {
        this.displayProgressSpinner = true;
        let joinPartyResource = this.ps.joinParty({ partyId }).subscribe((response: any) => {
            if (response && response.Success) {
                let partyData = response.data || {};
                if (partyData.isEnded) {
                    this.openSnackBar(
                        `Party you are trying to enter has been ended at ${moment(partyData.endedOn).format(
                            "MMMM Do YY, h:mm a"
                        )}`,
                        "",
                        "bottom",
                        "center"
                    );
                    setTimeout(() => {
                        this.router.navigateByUrl("/");
                    }, 2000);
                    return;
                }

                this.router.navigateByUrl("/partyArea/" + partyData.entityId);
            }
        });
        this.subscription.add(joinPartyResource);
    }

    getRecentPartyList() {
        this.fetchingRecentList = true;
        let getPartyListResource = this.ps.getRecentPartyList({}).subscribe((response: any) => {
            this.fetchingRecentList = false;
            if (response && response.Success) {
                this.recentList = response.data;
            }
        });
        this.subscription.add(getPartyListResource);
    }

    getUpcomingPartyList() {
        this.fetchingUpcomingList = true;
        let getPartyListResource = this.ps.getUpcomingPartyList({}).subscribe((response: any) => {
            this.fetchingUpcomingList = false;
            if (response && response.Success) {
                this.upcomingList = response.data;
            }
        });
        this.subscription.add(getPartyListResource);
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any) {
        this._snackBar.open(message, action || "close", {
            duration: 2000,
            verticalPosition: verticalPosition || "top",
            horizontalPosition: horizontalPosition || "end",
        });
    }

    getPartyIdFromURL(partyURL: any) {
        partyURL = new URL(partyURL);
        if (partyURL && partyURL.search) {
            partyURL = new URLSearchParams(partyURL.search).get("v");
            if (partyURL) {
                return partyURL;
            }
        }
        return null;
    }

    getStatusColor(key: any, type: any) {
        let objectMap = null;
        let classMap = {
            ENDED: "end",
            CREATED: "primary",
            ACTIVE: "primary",
            "IN-ACTIVE": "primary",
        };
        let labelMap = {
            ENDED: "Ended",
            CREATED: "Join Now",
            SCHEDULED: "Scheduled",
            ACTIVE: "Join Now",
            "IN-ACTIVE": "Join Now",
        };
        type == "class" && (objectMap = classMap);
        type == "label" && (objectMap = labelMap);
        return objectMap[key];
    }

    partyLabel(partyData: any, type: any) {
        let status = this.getStatusColor(partyData.status, type);
        if (partyData.status == "ENDED") {
            return `Ended ${moment(partyData.endedOn).fromNow()}`;
        }
        return status;
    }

    getThumbnailOfParty(partyData: any) {
        switch (partyData.videoSource) {
            default:
                if (partyData.videoId) {
                    //youtube
                    return `https://img.youtube.com/vi/${partyData.videoId}/0.jpg`;
                }
                return "";
                break;
        }
    }

    actionButton(status: any, partyId: any) {
        if (["CREATED", "ACTIVE", "IN-ACTIVE"].includes(status)) {
            this.displayProgressSpinner = true;
            //Navigate user to party area
            this.router.navigateByUrl("/partyArea/" + partyId);
        }
        return;
    }

    copyPartyInviteURL(partyId: any) {
        return `${window.location.origin}/joinParty?v=${partyId}`;
    }

    onCopyingInviteURL() {
        this.openSnackBar(`Invite URL copied successfully!`, "", "bottom", "center");
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}

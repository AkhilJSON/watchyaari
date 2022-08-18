import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatAutocompleteSelectedEvent, MatAutocomplete } from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { Router, ActivatedRoute } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Subscription, Observable } from "rxjs";
import { map, startWith, debounceTime, tap, switchMap, finalize } from "rxjs/operators";
import * as _ from "lodash";
import * as moment from "moment/moment";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { MatSnackBar } from "@angular/material/snack-bar";

// services
import { PartyService } from "../services/party.service";
import { CookieService } from "../services/cookie.service";
import { SharedService } from "../services/shared.service";

@Component({
    selector: "app-launch-party",
    templateUrl: "./launch-party.component.html",
    styleUrls: ["./launch-party.component.css"],
})
export class LaunchPartyComponent implements OnInit, OnDestroy, AfterViewInit {
    subscription: any = new Subscription();

    public partyForm: FormGroup;

    partyData: any;

    @ViewChild("guestInput") guestInput: ElementRef<HTMLInputElement>;
    @ViewChild("auto") matAutocomplete: MatAutocomplete;

    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    filteredUsers: Observable<any[]>;
    fetchingUsers: any = false;
    launchingParty: any = false;

    loggedInUserdId: any;

    currentTime: any;

    color = "primary";
    mode = "indeterminate";
    value = 50;
    displayProgressSpinner = false;
    spinnerWithoutBackdrop = true;
    constructor(
        private router: Router,
        private fb: FormBuilder,
        private partyService: PartyService,
        private ss: SharedService,
        private cs: CookieService,
        private jwtHelper: JwtHelperService,
        private _snackBar: MatSnackBar,
        private activatedRoute: ActivatedRoute,
        private cd: ChangeDetectorRef
    ) {
        this.loggedInUserdId = this.cs.getItem("_uid");

        this.partyForm = this.fb.group({
            _id: "",
            title: "",
            guests: [],
            guestSearch: "",
            status: "CREATED",
            isStarted: false,
            scheduledDate: null,
            videoId: [null, Validators.compose([Validators.required])],
            videoSource: [null, Validators.compose([Validators.required])],
        });

        this.filteredUsers = this.partyForm.controls.guestSearch.valueChanges.pipe(
            startWith(null),
            debounceTime(100),
            tap(() => {
                this.fetchingUsers = true;
            }),
            switchMap((value: any) =>
                this.partyService.fetchUsers({ search: value }).pipe(
                    finalize(() => {
                        this.fetchingUsers = false;
                    })
                )
            ),
            map((response: any) => {
                return response.Success ? response.data : [];
            })
        );
    }

    ngOnInit(): void {
        this.currentTime = new Date();
    }

    ngAfterViewInit() {
        let paramsService = this.activatedRoute.params.subscribe((params) => {
            let partyId = params["prtyId"];
            if (!partyId) {
                return;
            }
            this.displayProgressSpinner = true;
            let partyDataService = this.partyService.getPartyDetails({ partyId }).subscribe((res: any) => {
                this.displayProgressSpinner = false;
                if (
                    res &&
                    res.Success &&
                    res.data &&
                    res.data.status == "INITIALISED" &&
                    res.data.hostedBy == this.loggedInUserdId
                ) {
                    this.partyForm.controls.title.setValue(res.data.title);
                    this.partyForm.controls.status.setValue("CREATED");
                    this.partyForm.controls.videoSource.setValue(res.data.videoSource);
                    this.partyForm.controls.videoId.setValue(res.data.videoId);
                    this.partyForm.controls._id.setValue(res.data._id);
                } else {
                    this.router.navigateByUrl("/");
                }
            });
            this.subscription.add(partyDataService);
            this.cd.detectChanges();
        });

        this.subscription.add(paramsService);
    }

    switchTabs(tab: any) {
        if (tab == 0) {
            this.partyForm.controls.status.setValue("");
        }
        if (tab == 1) {
            this.partyForm.controls.status.setValue("SCHEDULED");
        }
    }

    setScheuledDate(event: any) {
        this.partyForm.controls.scheduledDate.setValue(moment(event.value).format("MMMM Do YY, h:mm a"));
    }

    launchParty() {
        let formControls = this.partyForm.controls;
        let body = this.partyForm.value;
        let isSchedule = false;
        if (formControls.status.value == "SCHEDULED") {
            if (!formControls.scheduledDate.value) {
                this.openSnackBar("Party time is required", "", "", "center");
                return false;
            }
            let scheduledDate = <any>moment(formControls.scheduledDate.value, "MMMM Do YY, h:mm a").format();
            if (scheduledDate == "Invalid date") {
                this.openSnackBar("Enter valid party time", "", "", "center");
                return false;
            }
            scheduledDate = new Date(scheduledDate).getTime();
            if (scheduledDate < new Date().getTime()) {
                this.openSnackBar("Enter valid party time", "", "", "center");
                return false;
            }
            body.scheduledDate = scheduledDate;
            isSchedule = true;
        }
        this.launchingParty = true;
        this.displayProgressSpinner = true;
        let launchPartyService = this.partyService.launchParty(body).subscribe((res: any) => {
            this.launchingParty = false;
            this.displayProgressSpinner = false;
            setTimeout(() => {
                if (res && res.data) {
                    if (!isSchedule) {
                        let token = this.cs.getItem("_tkn");
                        let expirationData = this.jwtHelper.getTokenExpirationDate(token);
                        this.cs.setItem("crntPrtyId", res.data._id, expirationData, "/", null, null);
                        this.ss.setPartyDetails({
                            partyData: res.data,
                        });
                        if (res.data.videoId && res.data._id) {
                            this.router.navigateByUrl("partyArea/" + res.data._id);
                        }
                    } else {
                        this.partyForm.reset();
                        this.openSnackBar("Scheduled successfully.", "", "", "center");
                        this.router.navigateByUrl("joinParty");
                    }
                }
            }, 0);
        });

        this.subscription.add(launchPartyService);
    }

    remove(userId: any): void {
        let guests = this.partyForm.controls.guests.value || [];
        const index = _.findIndex(guests, function (o: any) {
            return o._id === userId;
        });

        if (index >= 0) {
            guests.splice(index, 1);
            this.partyForm.controls.guests.setValue(guests);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        let guests = this.partyForm.controls.guests.value || [];
        let selectedGuest = <any>event.option.value;

        let alreadyExists = _.findIndex(guests, function (o: any) {
            return o._id == selectedGuest._id;
        });
        if (alreadyExists == -1) {
            guests.push(selectedGuest);
            this.partyForm.controls.guests.setValue(guests);
        }
        this.guestInput.nativeElement.value = "";
        this.partyForm.controls.guestSearch.setValue(null);
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const selectedGuest = <any>event.value;
        if (!selectedGuest) {
            return;
        }

        // Reset the input value
        if (input) {
            input.value = "";
        }

        this.partyForm.controls.guestSearch.setValue(null);
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any) {
        this._snackBar.open(message, action || "close", {
            duration: 2000,
            verticalPosition: verticalPosition || "top",
            horizontalPosition: horizontalPosition || "end",
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

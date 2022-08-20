import { Component, OnInit, ViewChild, Inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { MatAutocompleteSelectedEvent, MatAutocomplete } from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import { Subscription, Observable } from "rxjs";
import { map, startWith, debounceTime, tap, switchMap, finalize } from "rxjs/operators";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import * as _ from "lodash";
import { MatSnackBar } from "@angular/material/snack-bar";

// constants
import { GlobalConstants } from "../../common/global-constants";

// services
import { PartyService } from "src/app/services/party.service";
import { SharedService } from "src/app/services/shared.service";
import { ProfileService } from "src/app/account/my-account/profile.service";

export interface InviteGuestsModalData {
    socket: any;
    partyId: any;
    isHost: any;
}

@Component({
    selector: "app-invite-guests",
    templateUrl: "./invite-guests.component.html",
    styleUrls: ["./invite-guests.component.css"],
})
export class InviteGuestsComponent implements OnInit {
    subscription: any = new Subscription();

    public guestsForm: FormGroup;

    partyData: any = null;

    @ViewChild("auto") matAutocomplete: MatAutocomplete;

    visible = true;
    selectable = true;
    removable = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    filteredUsers: Observable<any[]>;
    fetchingUsers: any = false;

    blockedUsers: any = [];
    fetchingBlockedUsers: any = false;

    loggedInUserdId: any;

    color = "Primary";
    mode = "indeterminate";
    value = 50;
    spinnerWithoutBackdrop = true;
    updatingParty = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public modalData: InviteGuestsModalData,
        private fb: FormBuilder,
        private partyService: PartyService,
        public dialogRef: MatDialogRef<InviteGuestsComponent>,
        private _snackBar: MatSnackBar,
        private ss: SharedService
    ) {
        this.guestsForm = this.fb.group({
            guests: [],
            guestSearch: "",
        });

        let profileSer = this.ss.loggedInUserProfile.subscribe((profile: any) => {
            if (profile && profile.entityId) {
                this.loggedInUserdId = profile.entityId;
            }
        });

        this.subscription.add(profileSer);
    }

    ngOnInit(): void {
        this.blockedUsers = [];

        let sharedService = this.ss.partyDetails.subscribe((data: any) => {
            this.partyData = data && data.partyData;

            let guests = [];
            _.each(this.partyData.guests, (guest: any) => {
                if (guest && guest.userId) {
                    guest.userId.isHost = guest.userId.entityId == this.partyData.hostedBy ? true : false;
                    guest.userId.self = guest.userId.entityId == this.loggedInUserdId ? true : false;
                    guest.userId.existing = true;
                    guest.userId.guestId = guest.entityId;
                    guest.userId.isCoHost = guest.isCoHost;
                    guests.push(guest.userId);
                }
            });
            this.guestsForm.controls.guests.setValue(guests);
        });
        this.subscription.add(sharedService);

        //Fetch blocked users::
        this.fetchBlockedUsers();

        this.filteredUsers = this.guestsForm.controls.guestSearch.valueChanges.pipe(
            startWith(null),
            debounceTime(100),
            tap(() => {
                this.fetchingUsers = true;
            }),
            switchMap((value) =>
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

        //Socket related

        this.modalData.socket.on("UNBLOCK_USER", (userId: any) => {
            this.blockedUsers = _.filter(this.blockedUsers, (user: any) => {
                return user.entityId != userId;
            });

            this.openSnackBar(`Host has updated the guest list.`, "", "bottom", "center");
        });

        this.modalData.socket.on("BLOCK_USER", (userData: any) => {
            this.blockedUsers.push(userData);
        });
    }

    remove(userId: any): void {
        if (!this.modalData.isHost) {
            this.openSnackBar(`Only host can block/remove the user.`, "", "bottom", "center");
            return;
        }

        let guests = this.guestsForm.controls.guests.value || [];
        const index = _.findIndex(guests, function (o: any) {
            return o.entityId === userId;
        });

        if (index >= 0) {
            guests.splice(index, 1);
            this.guestsForm.controls.guests.setValue(guests);
            this.updateGuests("block");
        }
    }

    selected(event: MatAutocompleteSelectedEvent) {
        let guests = this.guestsForm.controls.guests.value || [];
        let selectedGuest = <any>event.option.value;

        let isAlreadyExists = <any>_.findIndex(guests, function (o: any) {
            return o.entityId === selectedGuest.entityId;
        });
        isAlreadyExists = isAlreadyExists >= 0;

        let isBlockedUser = <any>_.findIndex(this.blockedUsers, function (o: any) {
            return o.entityId === selectedGuest.entityId;
        });
        isBlockedUser = isBlockedUser >= 0;

        if (isAlreadyExists) {
            this.openSnackBar(`User is already added.`, "close", "bottom", "center", 4000);
        } else if (isBlockedUser) {
            this.openSnackBar(`User is blocked, unblock user & add.`, "close", "bottom", "center", 4000);
        } else if (guests.length == (this.partyData.maxGuestsAllowed || GlobalConstants.DEFAULT_MAX_GUESTS_ALLOWED)) {
            this.openSnackBar(`The Party Room is full.`, "close", "bottom", "center", 4000);
        } else {
            let alreadyExists = _.findIndex(guests, function (o: any) {
                return o.entityId == selectedGuest.entityId;
            });
            if (alreadyExists == -1) {
                guests.push(selectedGuest);
                this.guestsForm.controls.guests.setValue(guests);
            }
            this.updateGuests("add");
        }
        this.guestsForm.controls.guestSearch.setValue(null);
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

        this.guestsForm.controls.guestSearch.setValue(null);
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any, duration?: any) {
        this._snackBar.open(message, action || "close", {
            duration: duration || 2000,
            verticalPosition: verticalPosition || "top",
            horizontalPosition: horizontalPosition || "end",
        });
    }

    updateGuests(status?: any) {
        let allGuests = this.guestsForm.controls.guests.value || [];
        let newGuests = _.filter(allGuests, (guest: any) => {
            return !guest.existing;
        });

        let allGuestsIds = _.map(allGuests, "entityId");
        let existingGuests = this.partyData.guests;
        let removedIds = {
            guests: [],
            userIds: [],
        };
        let blockedUser = {};
        _.each(existingGuests, (guest: any) => {
            if (!allGuestsIds.includes(guest.userId.entityId)) {
                removedIds.guests.push(guest.entityId);
                removedIds.userIds.push(guest.userId.entityId);

                blockedUser = {
                    entityId: guest.userId.entityId,
                    fullName: guest.userId.fullName,
                };
                this.blockedUsers.push(blockedUser);
            }
        });

        this.updatingParty = true;
        this.partyService
            .inviteGuestsInTheParty({
                partyId: this.partyData.entityId,
                guests: newGuests,
                removedIds,
            })
            .subscribe((response: any) => {
                this.updatingParty = false;
                if (response && response.Success && response.data) {
                    this.ss.setPartyDetails({ partyData: response.data });

                    let guestNames = <any>_.map(newGuests, "fullName");
                    guestNames = guestNames.splice(0, 3).join(", ");

                    guestNames = `${guestNames} ${
                        newGuests.length > 3 ? " & " + (newGuests.length - 3) + " others" : ""
                    }`;
                    this.modalData.socket.emit("ADD_REMOVE_GUESTS", response.data);
                    this.modalData.socket.emit("PUSH_NOTIFICATION", `HOST has updated the guests list.`);
                    this.modalData.socket.emit("UPDATE_VIDEO_CHAT_LIST");

                    let message = "";
                    if (status == "block") {
                        message = "Blocked user successfully.";
                        this.modalData.socket.emit("BLOCK_USER", blockedUser);
                    } else {
                        message = "Added user successfully.";
                    }
                    this.openSnackBar(`${message}`, "", "bottom", "center");
                }
            });
    }

    unblockUser(userId: any) {
        if (!this.modalData.isHost) {
            this.openSnackBar(`Only host can unblock the user.`, "", "bottom", "center");
            return;
        }

        this.updatingParty = true;

        this.partyService.unBlockUsers({ partyId: this.modalData.partyId, userId }).subscribe((response: any) => {
            this.updatingParty = false;

            if (response && response.Success) {
                this.blockedUsers = _.filter(this.blockedUsers, (user: any) => {
                    return user.entityId != userId;
                });

                this.openSnackBar(`User unblocked successfully.`, "", "bottom", "center");
            }
        });
    }

    fetchBlockedUsers() {
        this.fetchingBlockedUsers = true;
        this.partyService.fetchBlockedUsers({ partyId: this.modalData.partyId }).subscribe((response: any) => {
            this.fetchingBlockedUsers = false;
            if (response && response.Success) {
                this.blockedUsers = response.data;
            }
        });
    }

    updateCoHosts(guestId: any, guestName: any, add: any) {
        let guestUserId = "";
        if (!this.modalData.isHost) {
            this.openSnackBar(`Only host can update CO-HOST role.`, "", "bottom", "center");
            return;
        }

        /*
      Party should have only 1 co-host
    */
        let alreadyHaveOneCoHost = <any>_.filter(this.partyData.guests, (guest: any) => {
            return guest.isCoHost;
        });
        alreadyHaveOneCoHost = alreadyHaveOneCoHost && alreadyHaveOneCoHost.length == 1 ? true : false;

        if (add && alreadyHaveOneCoHost) {
            this.openSnackBar(`A party can have only 1 CO-HOST.`, "", "bottom", "center");
            return;
        }

        this.updatingParty = true;
        this.partyService.updateCoHosts({ guestId, add }).subscribe((response: any) => {
            this.updatingParty = false;
            if (response && response.Success) {
                //Update PartyData guests
                this.partyData.guests = _.map(this.partyData.guests, (guest: any) => {
                    if (guest.entityId == guestId) {
                        guest.isCoHost = add;
                        guestUserId = guest.userId.entityId;
                    }
                    return guest;
                });

                let message = "";
                if (add) {
                    message = `${guestName} has been added as CO-HOST.`;
                } else {
                    message = `${guestName} has been removed from CO-HOST role.`;
                }

                this.ss.setPartyDetails({ partyData: this.partyData });

                //Signal to guests
                this.modalData.socket.emit("UPDATE_PARTY_DATA", this.partyData);
                this.modalData.socket.emit("PUSH_NOTIFICATION", "", {
                    type: "roleUpdate",
                    isAdd: add,
                    guestUserId,
                    guestName,
                });

                this.openSnackBar(message, "", "bottom", "center", 5000);
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

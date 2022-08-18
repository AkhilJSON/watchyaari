import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import * as moment from "moment/moment";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";

// services
import { LoginAuthService } from "../../services/login-auth.service";
import { PartyService } from "../../services/party.service";
import { CustomValidator } from "../../common/custom-validator";
import { ProfileService } from "../my-account/profile.service";
import { SharedService } from "../../services/shared.service";

export interface LoginSignupModalData {
    defaultTab: 0;
    mode: String;
    partyId: any;
}

@Component({
    selector: "app-login-signup",
    templateUrl: "./login-signup.component.html",
    styleUrls: ["./login-signup.component.css"],
})
export class LoginSignupComponent implements OnInit, OnDestroy {
    subscription: any = new Subscription();

    public loginForm: FormGroup;
    public signupForm: FormGroup;
    public forgotPasswordForm: FormGroup;

    activeTab: any;

    loading: boolean = false;
    userNameNotFound: boolean = false;

    loadingAuth: boolean = false;

    isPasword: boolean = true;

    userNotFound: any = false;

    alreadyRequested: any = false;

    //#######################Validations related declarations <STARTS HERS>#######################
    showInvalidPassword: boolean = false;
    showInvalidEmail: boolean = false;

    passwordNotMatched: boolean = false;
    emailAlreadyExists: boolean = false;
    //#######################Validations related declarations <ENDS HERS>#######################

    constructor(
        private router: Router,
        private actiRoute: ActivatedRoute,
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<LoginSignupComponent>,
        private ls: LoginAuthService,
        private ss: SharedService,
        private _snackBar: MatSnackBar,
        private profileService: ProfileService,
        @Inject(MAT_DIALOG_DATA) public modalData: LoginSignupModalData
    ) {
        this.loginForm = this.fb.group({
            email: [null, Validators.compose([Validators.required, Validators.email])],
            password: [null, Validators.compose([Validators.required])],
        });

        this.signupForm = this.fb.group({
            email: [null, Validators.compose([Validators.required, Validators.email])],
            fullName: [null, Validators.compose([Validators.required, CustomValidator.nonEmpty])],
            password: [null, Validators.compose([Validators.required, CustomValidator.passwordValidator])],
        });

        this.forgotPasswordForm = this.fb.group({
            email: [null, Validators.compose([Validators.required, Validators.email])],
        });
    }

    ngOnInit(): void {}

    initStuff() {
        this.loading = false;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    authenticate() {
        this.userNameNotFound = false;
        this.passwordNotMatched = false;
        if (this.loginForm.invalid) {
            // this.openSnackBar('Fill the mandatory fields...', '')
            return false;
        }
        this.loadingAuth = true;
        let authService = this.ls.userAuthentication(this.loginForm.value).subscribe((res: any) => {
            if (res.Success) {
                //save details in cookie
                this.ls.setUserToken(res.Token, res.uid);

                let profileDataSub = this.profileService.fetchProfile().subscribe((response: any) => {
                    if (response.Success) {
                        let profile = response.data;
                        this.ss.setLoggedInUserProfile(profile);
                    }
                    this.loadingAuth = false;

                    if (this.modalData && this.modalData.mode == "join") {
                        this.dialogRef.close({ loggedIn: true });
                    }

                    if (this.modalData && this.modalData.mode == "launch") {
                        this.dialogRef.close({ loggedIn: true });
                    }

                    let returnUrl = this.actiRoute.snapshot.queryParamMap.get("returnUrl") || null;
                    if (returnUrl) {
                        this.router.navigateByUrl(returnUrl);
                        return;
                    } else {
                        this.dialogRef.close({ loggedIn: true });
                    }
                });
                this.subscription.add(profileDataSub);
            } else {
                this.loadingAuth = false;
                if (res.Message == "passwords did not match") {
                    this.passwordNotMatched = true;
                } else if (res.Message == "cannot find user") {
                    this.passwordNotMatched = true;
                }
            }
        });

        this.subscription.add(authService);
    }

    register() {
        this.emailAlreadyExists = false;
        this.loadingAuth = true;

        if (this.signupForm.invalid) {
            this.loadingAuth = false;

            if (this.signupForm.controls.email.invalid) {
                this.showInvalidEmail = true;
                return;
            }
            if (this.signupForm.controls.password.invalid) {
                this.showInvalidPassword = true;
                return;
            }
        }

        let data = this.signupForm.value;
        data.fullName = data.fullName.trim();
        data.email = data.email.trim();

        let registerService = this.ls.registerUser(data).subscribe((res: any) => {
            if (res.Success) {
                sessionStorage.clear();
                this.ls.setUserToken(res.Token, res.uid);

                let profileDataSub = this.profileService.fetchProfile().subscribe((response: any) => {
                    this.loadingAuth = false;
                    if (response.Success) {
                        let profile = response.data;
                        this.ss.setLoggedInUserProfile(profile);
                    }

                    if (this.modalData && this.modalData.mode == "join") {
                        this.dialogRef.close({ loggedIn: true });
                    }
                    if (this.modalData && this.modalData.mode == "launch") {
                        this.dialogRef.close({ loggedIn: true });
                    }

                    let returnUrl = this.actiRoute.snapshot.queryParamMap.get("returnUrl") || null;
                    if (returnUrl) {
                        this.router.navigateByUrl(returnUrl);
                        return;
                    } else {
                        this.dialogRef.close({ loggedIn: true });
                    }
                });
                this.subscription.add(profileDataSub);

                // this.openSnackBar('Registered Successfully', '');
            } else {
                this.loadingAuth = false;
                if (res.Message == "email already exists") {
                    this.emailAlreadyExists = true;
                    // this.openSnackBar('Email Already Exists', '');
                } else if (res.Message == "exception") {
                    // this.openSnackBar('Exception occurred, try again', '');
                }
            }
        });
        this.subscription.add(registerService);
    }

    forgotPassword() {
        this.loadingAuth = true;

        this.ls.forgotPassword(this.forgotPasswordForm.value).subscribe((res: any) => {
            this.loadingAuth = false;
            if (res.Success) {
                this.forgotPasswordForm.reset();
                this.openSnackBar(
                    `Password reset link is sent to the registered email. Please follow the instructions in the email.`,
                    "close",
                    "bottom",
                    "center",
                    10000
                );
            } else {
                if (res.Message == "Invalid user") {
                    this.userNotFound = true;
                } else if (res.Message == "Already requested") {
                    this.alreadyRequested = true;
                }
            }
        });
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any, duration?: any) {
        this._snackBar.open(message, action || "close", {
            duration: duration || 2000,
            verticalPosition: verticalPosition || "top",
            horizontalPosition: horizontalPosition || "end",
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

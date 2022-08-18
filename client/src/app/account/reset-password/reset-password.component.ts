import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

// other
import { CustomValidator } from "../../common/custom-validator";

// services
import { LoginAuthService } from "../../services/login-auth.service";
@Component({
    selector: "app-reset-password",
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.css"],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
    public passwordForm: FormGroup;

    subscription: any = new Subscription();

    messageToShow: any = "Verifying...";

    isPasword: any = true;
    isConfirmPassword: any = true;

    passwordsDidNotMatch: any = false;
    updatingData: any = false;

    valideUserId: any = null;

    constructor(
        private fb: FormBuilder,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private loginService: LoginAuthService,
        private _snackBar: MatSnackBar
    ) {
        this.passwordForm = this.fb.group({
            password: ["", Validators.compose([Validators.required, CustomValidator.passwordValidator])],
            confirmPassword: ["", Validators.compose([Validators.required, CustomValidator.passwordValidator])],
        });
    }

    ngOnInit(): void {
        let paramsService = this.activatedRoute.params.subscribe((params) => {
            let token = params["token"];
            if (!token) {
                this.router.navigateByUrl("/");
            }
            let partyDataService = this.loginService.resetPasswordLink({ token }).subscribe((res: any) => {
                if (res.Success) {
                    this.valideUserId = res.uid;
                } else {
                    this.openSnackBar(`Invalid password reset link.`, "", "bottom", "center");
                    setTimeout(() => {
                        this.router.navigateByUrl("/");
                    }, 4000);
                }
            });
            this.subscription.add(partyDataService);
        });

        this.subscription.add(paramsService);
    }

    updatePassword() {
        let data = this.passwordForm.value;
        if (data.password !== data.confirmPassword) {
            this.passwordsDidNotMatch = true;
            return;
        }
        if (!this.valideUserId) {
            this.openSnackBar(`Invalid user`, "", "bottom", "center");
            return;
        }
        delete data.confirmPassword;
        this.updatingData = true;
        data.uid = this.valideUserId;
        this.loginService.resetPassword(data).subscribe((response: any) => {
            this.updatingData = false;
            if (response.Success) {
                this.openSnackBar(`Password Changed successfully, Please Login`, "", "bottom", "center");
            } else {
                this.openSnackBar(`Invalid access`, "", "bottom", "center");
            }
            setTimeout(() => {
                this.router.navigateByUrl("/");
            }, 1000);
        });
    }

    openSnackBar(message: any, action: any, verticalPosition?: any, horizontalPosition?: any) {
        this._snackBar.open(message, action || "close", {
            duration: 2000,
            verticalPosition: verticalPosition || "bottom",
            horizontalPosition: horizontalPosition || "right",
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

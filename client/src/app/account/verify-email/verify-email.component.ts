import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";

// services
import { LoginAuthService } from "../../services/login-auth.service";

@Component({
    selector: "app-verify-email",
    templateUrl: "./verify-email.component.html",
    styleUrls: ["./verify-email.component.css"],
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
    subscription: any = new Subscription();

    messageToShow: any = "Verifying...";

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private loginService: LoginAuthService
    ) {}

    ngOnInit(): void {
        let paramsService = this.activatedRoute.params.subscribe((params) => {
            let token = params["token"];
            if (!token) {
                this.router.navigateByUrl("/");
            }
            let partyDataService = this.loginService.verifyUserEmail({ token }).subscribe((res: any) => {
                if (res.Success) {
                    if (res.Message == "Ok") {
                        this.messageToShow = "Verified successfully!";
                    } else if (res.Message == "Already verified") {
                        this.messageToShow = "Email was already verified!";
                    }
                    setTimeout(() => {
                        this.router.navigateByUrl("/");
                    }, 4000);
                } else {
                    this.messageToShow = "Error verifying this email.";
                    setTimeout(() => {
                        this.router.navigateByUrl("/");
                    }, 4000);
                }
            });
            this.subscription.add(partyDataService);
        });

        this.subscription.add(paramsService);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

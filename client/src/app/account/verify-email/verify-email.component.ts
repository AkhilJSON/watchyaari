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
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}

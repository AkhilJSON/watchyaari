import { Injectable } from "@angular/core";
import { CanActivate, Route, Router, RouterStateSnapshot } from "@angular/router";

import { LoginAuthService } from "./login-auth.service";
import { CookieService } from "./cookie.service";
import { PartyService } from "./party.service";
import { SharedService } from "./shared.service";

@Injectable({
    providedIn: "root",
})
export class AuthGuardService {
    constructor(
        private ls: LoginAuthService,
        private cs: CookieService,
        private ss: SharedService,
        private partyService: PartyService,
        private router: Router
    ) {}

    canActivate(route, state: RouterStateSnapshot) {
        if (this.ls.isUserLoggedIn()) {
            let partyId = route.params && route.params.partyId;
            this.ls.handleAuth(partyId);
            return true;
        }
        this.router.navigate(["/"], { queryParams: { returnUrl: state.url } });
        return false;
    }
}

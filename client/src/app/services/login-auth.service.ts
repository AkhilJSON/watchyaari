import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../../environments/environment";

import { CookieService } from "./cookie.service";
import { SharedService } from "./shared.service";
import { PartyService } from "./party.service";

import { JwtHelperService } from "@auth0/angular-jwt";

import * as _ from "lodash";
import { ProfileService } from "../account/my-account/profile.service";

@Injectable({
    providedIn: "root",
})
export class LoginAuthService {
    partyData: any;

    constructor(
        private http: HttpClient,
        private router: Router,
        private cs: CookieService,
        private ss: SharedService,
        private partyService: PartyService,
        private jwtHelper: JwtHelperService,
        private profile: ProfileService
    ) {
        this.ss.partyDetails.subscribe((data: any) => {
            this.partyData = data && data.partyData;
        });
    }

    logout() {
        this.cs.deleteAllCookies();
        this.ss.setIsUserLoggedIn({ loggedIn: false });
        this.ss.setPartyDetails(null);
        this.ss.setLoggedInUserProfile(null);

        window.location.reload();
    }

    setUserToken(Token: any, userData: any) {
        let expirationDate = this.jwtHelper.getTokenExpirationDate(Token);
        this.cs.setItem("_tkn", Token, expirationDate, "/", null, null);
        this.cs.setItem("_uid", userData, expirationDate, "/", null, null);
        this.ss.setIsUserLoggedIn({ loggedIn: true });
    }

    isUserLoggedIn() {
        let token = this.cs.getItem("_tkn");
        const isExpired = this.jwtHelper.isTokenExpired(token);
        if (token && token.length && !isExpired) {
            this.ss.setIsUserLoggedIn({ loggedIn: true });
            return true;
        }
        this.ss.setIsUserLoggedIn({ loggedIn: false });
        return false;
    }

    getTokenExpirationDate() {
        let token = this.cs.getItem("_tkn");
        const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
        return expirationDate;
    }

    isHost() {
        let loggedInUserdId = this.cs.getItem("_uid");
        if (this.partyData && this.partyData.hostedBy && loggedInUserdId == this.partyData.hostedBy) {
            return true;
        }
        return false;
    }

    isCoHost() {
        let loggedInUserdId = this.cs.getItem("_uid");

        let costHost = <any>_.findIndex(this.partyData.guests, (guest: any) => {
            return guest && guest.isCoHost && guest.userId && guest.userId._id == loggedInUserdId ? true : false;
        });
        costHost = costHost >= 0 ? true : false;
        return costHost;
    }

    handleAuth(partyId) {
        this.ss.setPartyDetails({ partyData: null });
        if (partyId && partyId.length) {
            var partyDataSub = this.partyService.getPartyDetails({ partyId }).subscribe((res: any) => {
                if (res && res.Success && res.data) {
                    this.ss.setPartyDetails({ partyData: res.data });
                    // this.router.navigateByUrl('partyArea/' + partyId);
                } else {
                    this.cs.removeItem("crntPrtyId", "/", null);
                    this.router.navigateByUrl("/");
                }
                partyDataSub.unsubscribe();
            });
        }
    }

    registerUser(body: any) {
        return this.http.post(environment.common + "userRegistration", body);
    }

    sendOTP(body: any) {
        return this.http.post(environment.common + "sendOTP", body);
    }

    verifyUserEmail(body: any) {
        return this.http.post(environment.common + "verifyUserEmail", body);
    }

    forgotPassword(body: any) {
        return this.http.post(environment.common + "forgotPassword", body);
    }

    resetPassword(body: any) {
        return this.http.post(environment.common + "resetPassword", body);
    }

    resetPasswordLink(body: any) {
        return this.http.post(environment.common + "resetPasswordLink", body);
    }

    userAuthentication(body: any) {
        return this.http.post(environment.common + "userAuthentication", body);
    }
}

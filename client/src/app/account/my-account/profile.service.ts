import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { map, startWith, debounceTime, tap, switchMap, finalize } from "rxjs/operators";

import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: "root",
})
export class ProfileService {
    constructor(private http: HttpClient) {}

    updateProfile(body: any) {
        return this.http.post(environment.baseURL + "profile/updateProfile", body);
    }

    fetchProfile() {
        return this.http.get(environment.baseURL + "profile/fetchProfile");
    }

    verifyMyEmail() {
        return this.http.get(environment.baseURL + "profile/verifyMyEmail");
    }
}

import { Injectable } from "@angular/core";
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from "@angular/common/http";
import { tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { Observable } from "rxjs";

// services
import { CookieService } from "./cookie.service";
import { LoginAuthService } from "./login-auth.service";

@Injectable({
    providedIn: "root",
})
export class Interceptor implements HttpInterceptor {
    constructor(public ls: LoginAuthService, public cs: CookieService, private router: Router) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        request = request.clone({
            setHeaders: {
                Authorization: `${this.cs.getItem("_tkn")}`,
                "Content-Type": `application/json`,
            },
        });
        return next.handle(request).pipe(
            tap(
                () => {},
                (err: any) => {
                    if (err instanceof HttpErrorResponse) {
                        if (err.status !== 401) {
                            return;
                        }
                        this.ls.logout();
                    }
                }
            )
        );
    }
}

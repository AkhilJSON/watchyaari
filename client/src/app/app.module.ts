import { BrowserModule, Meta, Title } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";

// modules
import { AppRoutingModule } from "./app-routing.module";
import { JwtModule } from "@auth0/angular-jwt";
import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { OwlDateTimeModule, OwlNativeDateTimeModule } from "ng-pick-datetime";

// custom modules
import { ProgressSpinnerModule } from "./progress-spinner/progress-spinner.module";
import { RequiredMaterialModule } from "./required-material.module";
import { AppOverlayModule } from "./overlay/overlay.module";

// other
import { PERFECT_SCROLLBAR_CONFIG } from "ngx-perfect-scrollbar";
import { PerfectScrollbarConfigInterface } from "ngx-perfect-scrollbar";

// services
import { Interceptor } from "./services/interceptor.service";

// components
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { LoginSignupComponent } from "./account/login-signup/login-signup.component";
import { LaunchPartyComponent } from "./launch-party/launch-party.component";
import { JoinPartyComponent } from "./join-party/join-party.component";
import { SpinnerComponent } from "./common/spinner/spinner.component";
import { VideoResultsCardComponent } from "./video-results-card/video-results-card.component";
import { VerifyEmailComponent } from "./account/verify-email/verify-email.component";
import { ResetPasswordComponent } from "./account/reset-password/reset-password.component";
import { ProgressSpinnerComponent } from "./progress-spinner/progress-spinner.component";

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    suppressScrollX: true,
    wheelSpeed: 2,
    wheelPropagation: true,
};
@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LoginSignupComponent,
        LaunchPartyComponent,
        JoinPartyComponent,
        SpinnerComponent,
        VideoResultsCardComponent,
        VerifyEmailComponent,
        ResetPasswordComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        RequiredMaterialModule,
        BrowserAnimationsModule,
        PerfectScrollbarModule,
        ReactiveFormsModule,
        HttpClientModule,
        JwtModule.forRoot({
            config: {},
        }),
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
        AppOverlayModule,
        ProgressSpinnerModule,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: Interceptor, multi: true },
        { provide: Window, useValue: window },
        {
            provide: PERFECT_SCROLLBAR_CONFIG,
            useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
        },
        Meta,
        Title,
    ],
    bootstrap: [AppComponent],
    entryComponents: [ProgressSpinnerComponent],
    exports: [],
})
export class AppModule {}

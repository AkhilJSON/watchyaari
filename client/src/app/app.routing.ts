import { Routes } from "@angular/router";

// components
import { HomeComponent } from "./home/home.component";
import { JoinPartyComponent } from "./join-party/join-party.component";
import { LaunchPartyComponent } from "./launch-party/launch-party.component";
import { VerifyEmailComponent } from "./account/verify-email/verify-email.component";
import { ResetPasswordComponent } from "./account/reset-password/reset-password.component";

// services
import { AuthGuardService } from "./services/auth-guard.service";

export const AppRoutes: Routes = [
    {
        path: "",
        component: HomeComponent,
    },
    {
        path: "joinParty",
        component: JoinPartyComponent,
        // canActivate:
    },
    {
        path: "launchParty/:prtyId",
        component: LaunchPartyComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: "verifyEmail/:token",
        component: VerifyEmailComponent,
    },
    {
        path: "forgotPassword/:token",
        component: ResetPasswordComponent,
    },
    {
        path: "partyArea",
        loadChildren: () => import("./party-area/party-area.module").then((m) => m.PartyAreaModule),
    },
    {
        path: "myAccount",
        loadChildren: () => import("./account/my-account/my-account.module").then((m) => m.MyAccountModule),
    },
    {
        path: "**",
        redirectTo: "/",
    },
];

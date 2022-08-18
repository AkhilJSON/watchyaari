import { Routes } from "@angular/router";

// components
import { ProfileComponent } from "./profile/profile.component";

// services
import { AuthGuardService } from "../../services/auth-guard.service";

export const MyAccountRoutes: Routes = [
    {
        path: "",
        redirectTo: "/profile",
        pathMatch: "full",
    },
    {
        path: "profile",
        component: ProfileComponent,
        canActivate: [AuthGuardService],
    },
    {
        path: "**",
        redirectTo: "/",
    },
];

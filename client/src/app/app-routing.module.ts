import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppRoutes } from "./app.routing";

@NgModule({
    imports: [RouterModule.forRoot(AppRoutes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}

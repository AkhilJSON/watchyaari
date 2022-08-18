import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PartyRoutes } from "./party.routing";

@NgModule({
    imports: [RouterModule.forChild(PartyRoutes)],
    exports: [RouterModule],
})
export class PartyRoutingModule {}

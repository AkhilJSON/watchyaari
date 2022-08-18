import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";

// routes
import { MyAccountRoutes } from "./my-account.routing";

@NgModule({
    imports: [RouterModule.forChild(MyAccountRoutes)],
    exports: [RouterModule],
})
export class MyAccountRoutingModule {}

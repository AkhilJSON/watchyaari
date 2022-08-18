// modules
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

// custom modules
import { MyAccountRoutingModule } from "./my-account-routing.module";
import { RequiredMaterialModule } from "../../required-material.module";

//components
import { ProfileComponent } from "./profile/profile.component";

@NgModule({
    declarations: [ProfileComponent],
    imports: [CommonModule, MyAccountRoutingModule, ReactiveFormsModule, HttpClientModule, RequiredMaterialModule],
})
export class MyAccountModule {}

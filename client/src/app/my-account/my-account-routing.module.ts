import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyAccountRoutes } from './my-account.routing';

@NgModule({
  imports: [RouterModule.forChild(MyAccountRoutes)],
  exports: [RouterModule],
})
export class MyAccountRoutingModule {}

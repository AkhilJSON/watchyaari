import { Routes } from '@angular/router';

import { NewPartyAreaComponent } from './new-party-area/new-party-area.component';

import { AuthGuardService } from '../services/auth-guard.service';

export const PartyRoutes: Routes = [
  {
    path: '',
    redirectTo: '/launchParty',
    pathMatch: 'full',
  },
  {
    path: ':partyId',
    component: NewPartyAreaComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];

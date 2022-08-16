import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { LoginSignupComponent } from '../../login-signup/login-signup.component';
import { LoginAuthService } from '../../services/login-auth.service';
import { SharedService } from '../../services/shared.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'src/app/services/cookie.service';

import { Subscription } from 'rxjs';

import * as _ from 'lodash';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css'],
})
export class NavBarComponent implements OnInit {
  subscription: any = new Subscription();

  isUserLoggedIn: Boolean;

  activeTab: any;

  navLinks: any;

  activeLinkIndex = -1;

  constructor(
    private router: Router,
    private activRoute: ActivatedRoute,
    public dialog: MatDialog,
    private ls: LoginAuthService,
    private cs: CookieService,
    private ss: SharedService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    let userLoggedInService = this.ss.isUserLoggedIn.subscribe((data: any) => {
      this.isUserLoggedIn = false;
      if (data && data.loggedIn) {
        this.isUserLoggedIn = true;
      }
    });

    this.subscription.add(userLoggedInService);

    this.navLinks = [
      { link: '/launchParty', label: 'Launch Party', index: 0 },
      { link: '/joinParty', label: 'Join Party', index: 1 },
    ];

    this.activeLinkIndex = _.findIndex(this.navLinks, (tab: any) => {
      let isActiveRoute =
        tab.link === this.router.url ||
        (tab.link == '/launchParty' &&
          this.router.url.includes('/launchParty/'));
      return isActiveRoute;
    });
    this.cd.detectChanges();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(LoginSignupComponent, {
      width: '550px',
      data: { defaultTab: 0 },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result) => {});

    this.subscription.add(modalResource);
  }

  logout(): void {
    this.ls.logout();
  }

  removeCurrentPartySession() {
    this.cs.removeItem('crntPrtyId', '/', null);
    _.each(this.cs.keys(), (key) => {
      if (key.indexOf('_scktId_') == 0) {
        this.cs.removeItem(key, '/', null);
      }
    });
    this.router.navigateByUrl('/');
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

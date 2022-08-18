import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild,
  HostListener,
  Directive,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { LoginSignupComponent } from './account/login-signup/login-signup.component';
import { LoginAuthService } from './services/login-auth.service';
import { SharedService } from './services/shared.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'src/app/services/cookie.service';

import {
  MediaMatcher,
  Breakpoints,
  BreakpointObserver,
} from '@angular/cdk/layout';

import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { ProfileService } from './account/my-account/profile.service';

import { environment } from '../environments/environment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  mobileQuery: MediaQueryList;
  sidebarOpened;

  subscription: any = new Subscription();

  isUserLoggedIn: Boolean;

  activeTab: any;

  navLinks: any;

  fullScreenMode: any = false;

  private _mobileQueryListener: () => void;
  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private ls: LoginAuthService,
    private router: Router,
    public dialog: MatDialog,
    private cs: CookieService,
    private ss: SharedService,
    private cd: ChangeDetectorRef,
    private profileService: ProfileService,
    private meta: Meta,
    private title: Title,
    private breakpointObserver: BreakpointObserver
  ) {
    let tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    this.mobileQuery = media.matchMedia('(min-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    let userLoggedInService = this.ss.isUserLoggedIn.subscribe((data: any) => {
      this.isUserLoggedIn = false;
      if (data && data.loggedIn) {
        this.isUserLoggedIn = true;
      }
    });

    this.subscription.add(userLoggedInService);

    this.navLinks = [{ link: '/joinParty', label: 'Join the party', index: 0 }];
  }

  ngOnInit() {
    let isUserLoggedIn = this.ls.isUserLoggedIn();

    let fullScreenService = this.ss.fullScreenMode.subscribe(
      (isFullScreenEnabled: any) => {
        this.fullScreenMode = isFullScreenEnabled;
        this.cd.detectChanges();
      }
    );
    this.subscription.add(fullScreenService);

    if (isUserLoggedIn) {
      let profileDataSub = this.profileService
        .fetchProfile()
        .subscribe((response: any) => {
          if (response.Success) {
            let profile = response.data;
            this.ss.setLoggedInUserProfile(profile);
          }
        });
      this.subscription.add(profileDataSub);
    }
  }

  ngAfterViewInit() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        // XSmall: string; Small: string; Medium: string; Large: string; XLarge: string; Handset: string; Tablet: string; Web: string; HandsetPortrait: string; TabletPortrait: string; WebPortrait: string; HandsetLandscape: string; TabletLandscape: string; WebLandscape: string;
      ])
      .subscribe((result) => {
        let breakPoints = result.breakpoints;

        //Check if the screen is small
        if (breakPoints[Breakpoints.XSmall]) {
          //Hide address bar
          window.scrollTo(0, 1);
        }
      });
  }

  activeLinkIndex() {
    let activeLinkIndex = _.findIndex(this.navLinks, (tab: any) => {
      let isActiveRoute =
        tab.link === this.router.url ||
        (tab.link == '/launchParty' &&
          this.router.url.includes('/launchParty/'));
      return isActiveRoute;
    });
    return activeLinkIndex;
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
    this.ss.setPartyDetails(null);
    _.each(this.cs.keys(), (key) => {
      if (key.indexOf('_scktId_') == 0) {
        this.cs.removeItem(key, '/', null);
      }
    });
    this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    this.subscription.unsubscribe();
  }
}

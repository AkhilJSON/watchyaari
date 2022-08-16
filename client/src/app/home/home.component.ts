import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { LoginSignupComponent } from '../login-signup/login-signup.component';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarComponent,
  PerfectScrollbarDirective,
} from 'ngx-perfect-scrollbar';

import { SharedService } from '../services/shared.service';
import { LoginAuthService } from '../services/login-auth.service';
import { PartyService } from '../services/party.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SampleVideoData } from '../common/sample-data';

import { VideoSourceConstants } from '../common/video-source';
import { MediaPlayerConstants } from '../common/media-player-constants';

import { environment } from '../../environments/environment';
import * as _ from 'lodash';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

declare var YT: any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public config: PerfectScrollbarConfigInterface = {};

  subscription: any = new Subscription();

  isUserLoggedIn: Boolean;

  searchOptions: any = ['SEARCH', 'URL'];
  selectedSearchOption: any = 'SEARCH';

  isSearchPreview: any = false;

  searchKey = new FormControl('');
  searchURL = new FormControl('', Validators.compose([Validators.required]));

  videoSearchList: any = [];

  currentHighlightedVideo: any = -1;

  videoServiceProviders: any = [
    {
      name: 'YouTube',
      value: 'YOUTUBE',
      selected: true,
      disabled: false,
      tooltip: '',
    },
    /* {
      name: 'NETFLIX',
      value: 'NETFLIX',
      selected: false,
      disabled: true,
      tooltip: "Currently unavailable"
    },
    {
      name: 'Amazon Prime Video',
      value: 'AMAZON_PRIME_VIDEO',
      selected: false,
      disabled: true,
      tooltip: "Currently unavailable"
    }, */
    {
      name: 'Vimeo',
      value: 'VIMEO',
      selected: false,
      disabled: true,
      tooltip: 'Currently unavailable',
    },
  ];

  currentVideoId: any = null;
  currentVideoTitle: any = '';
  currentPreviewPlayer: any = null;
  fetchingPreviewVideo: any = false;

  color = 'primary';
  mode = 'indeterminate';
  value = 50;
  displayProgressSpinner = false;
  spinnerWithoutBackdrop = true;

  fetchingVideos = false;

  isSmallScreenMode: boolean;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private ss: SharedService,
    private ls: LoginAuthService,
    private ps: PartyService,
    private _snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    let userLoggedInService = this.ss.isUserLoggedIn.subscribe((data: any) => {
      this.isUserLoggedIn = false;
      if (data && data.loggedIn) {
        this.isUserLoggedIn = true;
        this.ls.handleAuth('');
      }
    });

    this.subscription.add(userLoggedInService);

    // this.videoSearchList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }

  ngAfterViewInit() {
    this.searchVideos(true, '');

    //###################Media Query <STARTS HERE>###################
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
        // XSmall: string; Small: string; Medium: string; Large: string; XLarge: string; Handset: string; Tablet: string; Web: string; HandsetPortrait: string; TabletPortrait: string; WebPortrait: string; HandsetLandscape: string; TabletLandscape: string; WebLandscape: string;
      ])
      .subscribe((result) => {
        let breakPoints = result.breakpoints;
        this.isSmallScreenMode = true;

        //Check if the screen is small
        if (breakPoints[Breakpoints.Large] || breakPoints[Breakpoints.XLarge]) {
          this.isSmallScreenMode = false;
        }

        this.cd.detectChanges();
      });
    //###################Media Query <ENDS HERE>###################
  }

  joinParty() {
    if (this.isUserLoggedIn) {
      this.router.navigateByUrl('/joinParty');
    } else {
      const dialogRef = this.dialog.open(LoginSignupComponent, {
        width: '550px',
        data: { defaultTab: 0, mode: 'join' },
      });

      let modalResource = dialogRef.afterClosed().subscribe((result) => {});

      this.subscription.add(modalResource);
    }
  }

  launchParty() {
    //To prevent multiple requests at a time.
    if (this.displayProgressSpinner) {
      return;
    }

    this.displayProgressSpinner = true;
    let videoData = {
      videoId: this.currentVideoId,
      videoSource: 'YOUTUBE',
      title: this.currentVideoTitle,
      status: 'CREATED',
      mode: 'URL',
    };
    let launchPartyService = this.ps
      .launchParty(videoData)
      .subscribe((res: any) => {
        if (res && res.data) {
          if (res.data.videoId && res.data._id) {
            this.router.navigateByUrl('partyArea/' + res.data._id);
          }
        }
      });

    this.subscription.add(launchPartyService);
  }

  searchVideos(defaultSearch: any, search?: any) {
    let searchKey = '';
    if (!defaultSearch) {
      searchKey = this.searchKey.value.trim();
      if (!searchKey) {
        defaultSearch = true;
      }
    } else {
      searchKey = search;
    }
    this.videoSearchList = [];

    let selectedProviders = _.filter(
      this.videoServiceProviders,
      (provider: any) => {
        return provider.selected;
      }
    );
    if (!selectedProviders.length) {
      this.videoSearchList = [];
    }
    let userMeta = localStorage.getItem('apc_user_id')
      ? null
      : localStorage.getItem('apc_user_id');

    if (!selectedProviders.length) {
      this.videoSearchList = [];
      return;
    } else {
      this.fetchingVideos = true;
      // trendingVideos
      let videoSearchSubscription = this.ps
        .searchVideos({
          defaultSearch,
          userMeta,
          search: searchKey,
          skip: 0,
          limit: 16,
        })
        .subscribe((res: any) => {
          this.fetchingVideos = false;
          if (res && res.data && res.data.items) {
            this.videoSearchList = res.data.items;
          }
        });
      this.subscription.add(videoSearchSubscription);
      this.cd.detectChanges();
    }
  }

  launchByURL() {
    if (!this.searchURL.value) {
      return;
    }

    //Validate URL
    let isValidURL = this.ps.validateURL(
      this.searchURL.value,
      MediaPlayerConstants.TYPE.YOUTUBE
    );

    if (!this.searchURL.value || !isValidURL) {
      this.openSnackBar(
        `Please enter valid youtube video URL`,
        '',
        'bottom',
        'center'
      );
      return;
    }
    this.currentVideoId = this.ps.getVideoId(this.searchURL.value);
    this.currentVideoTitle = '';
    this.fetchingPreviewVideo = true;

    this.initializeThePreview();
  }

  initializeThePreview() {
    this.currentPreviewPlayer && this.currentPreviewPlayer.destroy();
    this.fetchingPreviewVideo = true;
    setTimeout(() => {
      this.currentPreviewPlayer = new YT.Player('previewYoutubePlayer', {
        videoId: this.currentVideoId,
        playerVars: {
          // controls: 0,
          autoplay: 0,
          cc_lang_pref: 0,
          cc_load_policy: 0,
          disablekb: 0,
          iv_load_policy: 3,
          rel: 0,
          modestbranding: 1,
          fs: 0,
        },
        events: {
          onReady: (event) => {
            this.fetchingPreviewVideo = false;
            console.log(this.currentPreviewPlayer.playerInfo);
            this.currentVideoTitle = this.currentPreviewPlayer.playerInfo.videoData.title;
          },
        },
      });
    }, 0);
  }

  launch() {
    if (!this.ls.isUserLoggedIn()) {
      const dialogRef = this.dialog.open(LoginSignupComponent, {
        width: '550px',
        data: { defaultTab: 0, mode: 'launch' },
      });

      let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
        if (result && result.loggedIn) {
          this.launchParty();
        }
      });

      this.subscription.add(modalResource);
      return;
    } else {
      this.launchParty();
    }
  }

  previewThisVideo(data: any) {
    let { videoData, videoSource = MediaPlayerConstants.TYPE.YOUTUBE } =
      data || {};
    this.isSearchPreview = true;
    this.selectedSearchOption = 'URL';
    let url = '';
    console.log(videoData);
    switch (videoSource) {
      default:
        url = `https://www.youtube.com/watch?v=${videoData.id.videoId}`;
        break;
    }
    this.searchURL.setValue(url);
    this.launchByURL();
  }

  cancelVideoSearchPreview() {
    this.isSearchPreview = false;
    this.selectedSearchOption = 'SEARCH';
  }

  onSearchChange() {
    this.isSearchPreview = false;
    this.currentVideoId = null;
    this.currentVideoTitle = '';
    this.searchURL.reset();
  }

  openSnackBar(
    message: any,
    action: any,
    verticalPosition?: any,
    horizontalPosition?: any
  ) {
    this._snackBar.open(message, action || 'close', {
      duration: 2000,
      verticalPosition: verticalPosition || 'top',
      horizontalPosition: horizontalPosition || 'end',
    });
  }

  showLoader(data: any) {
    this.displayProgressSpinner = data.startLoading;
  }

  selectProvider(selectedProvider: any) {
    if (selectedProvider.disabled) {
      return;
    }
    _.each(this.videoServiceProviders, (provider: any) => {
      if (provider.value == selectedProvider.value) {
        provider.selected = !provider.selected;
      }
    });

    this.searchVideos(true, this.searchKey.value.trim());
  }

  ngOnDestroy() {
    // this.displayProgressSpinner = false;
    this.subscription.unsubscribe();
  }
}

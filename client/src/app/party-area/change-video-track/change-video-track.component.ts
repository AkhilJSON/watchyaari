import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { SampleVideoData } from '../../common/sample-data';

import { environment } from '../../../environments/environment';
import * as _ from 'lodash';
import { PartyService } from 'src/app/services/party.service';
import { MediaPlayerConstants } from '../../common/media-player-constants';
import { SharedService } from 'src/app/services/shared.service';

declare var YT: any;

export interface ChangeVideoTrackModalData {
  videoId: any;
  videoSource: any;
  isHost: any;
  isCoHost: any;
}

@Component({
  selector: 'app-change-video-track',
  templateUrl: './change-video-track.component.html',
  styleUrls: ['./change-video-track.component.scss'],
})
export class ChangeVideoTrackComponent implements OnInit, OnDestroy {
  subscription: any = new Subscription();

  searchOptions: any = ['SEARCH', 'URL'];
  selectedSearchOption: any = 'SEARCH';

  searchKey = new FormControl('');
  searchURL = new FormControl('', Validators.compose([Validators.required]));

  videoSearchList: any = [];
  currentHighlightedVideo: any = -1;

  fetchingVideos = false;

  isSearchPreview: any = false;

  currentVideoId: any = null;
  currentVideoTitle: any = '';
  currentPreviewPlayer: any = null;
  fetchingPreviewVideo: any = false;

  loggedInUserData: any;

  partyData: any = null;

  videoServiceProviders: any = [
    {
      name: 'YouTube',
      value: 'YOUTUBE',
      selected: true,
      disabled: false,
      tooltip: '',
    },
    {
      name: 'NETFLIX',
      value: 'NETFLIX',
      selected: false,
      disabled: true,
      tooltip: 'Currently unavailable',
    },
    {
      name: 'Amazon Prime Video',
      value: 'AMAZON_PRIME_VIDEO',
      selected: false,
      disabled: true,
      tooltip: 'Currently unavailable',
    },
    {
      name: 'Vimeo',
      value: 'VIMEO',
      selected: false,
      disabled: true,
      tooltip: 'Currently unavailable',
    },
  ];

  color = 'Primary';
  mode = 'indeterminate';
  value = 50;
  spinnerWithoutBackdrop = true;
  updatingParty = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public modalData: ChangeVideoTrackModalData,
    private _snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private ps: PartyService,
    private ss: SharedService,
    public dialogRef: MatDialogRef<ChangeVideoTrackComponent>
  ) {
    let sharedService = this.ss.partyDetails.subscribe((data: any) => {
      this.partyData = data && data.partyData;
    });
    this.subscription.add(sharedService);

    let profileDataService = this.ss.loggedInUserProfile.subscribe(
      (profile: any) => {
        if (profile) {
          this.loggedInUserData = profile;
        }
      }
    );
    this.subscription.add(profileDataService);
  }

  ngOnInit(): void {
    this.searchVideos(true, '');

    this.currentVideoId = null;
    this.currentPreviewPlayer = null;
    this.fetchingPreviewVideo = false;
    this.updatingParty = false;
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

    if (!selectedProviders.length) {
      this.videoSearchList = [];
      return;
    } else {
      this.fetchingVideos = true;
      let videoSearchSubscription = this.ps
        .searchVideos({ defaultSearch, search: searchKey, skip: 0, limit: 16 })
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

    this.currentPreviewPlayer && this.currentPreviewPlayer.destroy();
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

            this.currentVideoTitle = this.currentPreviewPlayer.playerInfo.videoData.title;
          },
        },
      });
    }, 0);
  }

  useThisVideo(flow: any, videoData?: any) {
    let newVideoData = <any>{};
    if (flow == 'SEARCH') {
      newVideoData = {
        videoId: videoData.id.videoId,
        title: videoData.snippet.title,
        oldVideoId: this.modalData.videoId,
        oldVideoSource: this.modalData.videoSource,
        videoSource: 'YOUTUBE',
      };
    } else {
      newVideoData = {
        oldVideoId: this.modalData.videoId,
        oldVideoSource: this.modalData.videoSource,
        videoId: this.currentVideoId,
        videoSource: 'YOUTUBE',
      };
    }
    newVideoData.partyId = this.partyData._id;
    this.updatingParty = true;
    let updateVideoService = this.ps
      .updateVideoInTheParty(newVideoData)
      .subscribe((res: any) => {
        this.updatingParty = false;
        this.partyData.videoId = newVideoData.partyId;
        this.partyData.videoSource = newVideoData.videoSource;
        if (res.data) {
          this.ss.setPartyDetails({
            partyData: res.data,
          });

          let loggedInUserName =
            (this.loggedInUserData && this.loggedInUserData.fullName) ||
            'Someone';
          let tag = this.modalData.isHost ? '[HOST]' : '[CO-HOST]';
          this.dialogRef.close({
            sendSignalToConnectedUsers: true,
            message: `${loggedInUserName} ${tag} has changed the video.`,
          });
          this.openSnackBar(
            `Video updated successfully.`,
            '',
            'bottom',
            'center'
          );
        }
      });

    this.subscription.add(updateVideoService);
  }

  previewThisVideo(videoData: any, videoSource: any = 'YOUTUBE') {
    this.isSearchPreview = true;
    this.selectedSearchOption = 'URL';
    let url = '';
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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

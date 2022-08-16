import {
  Component,
  OnInit,
  ElementRef,
  AfterViewInit,
  Inject,
  OnDestroy,
  ChangeDetectorRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketIOClient } from 'socket.io-client';
import * as io from 'socket.io-client';
import { Meta, Title } from '@angular/platform-browser';

import { Subscription } from 'rxjs';

import { SharedService } from '../../services/shared.service';
import { CookieService } from '../../services/cookie.service';

import { DOCUMENT } from '@angular/common';

import { JwtHelperService } from '@auth0/angular-jwt';

import * as moment from 'moment';

import * as _ from 'lodash';

import { LoginAuthService } from '../../services/login-auth.service';
import { PlayerControlsService } from '../../services/player-controls.service';

import { environment } from '../../../environments/environment';

import { MediaPlayerConstants } from '../../common/media-player-constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PartyService } from '../../services/party.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangeVideoTrackComponent } from '../change-video-track/change-video-track.component';
import { InviteGuestsComponent } from '../invite-guests/invite-guests.component';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { GlobalConstants } from 'src/app/common/global-constants';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

declare var YT: any;
declare var adapter: any;

/* interface Player extends YT.Player {
  videoId?: string | undefined;
} */

@Component({
  selector: 'app-new-party-area',
  templateUrl: './new-party-area.component.html',
  styleUrls: ['./new-party-area.component.scss'],
})
export class NewPartyAreaComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  //###################Genral declarations <STARTS HERE>###################
  subscription: any = new Subscription();
  //###################Genral declarations <STARTS HERE>###################

  //###################Socket related declarations <STARTS HERE>###################
  socket: SocketIOClient.Socket;
  videoAudioSocket: SocketIOClient.Socket;
  //###################Socket related declarations <STARTS HERE>###################

  //###################Party cotrols related declarations <STARTS HERE>###################
  partyData: any;

  updatingPartyPrivacy: any = false;

  partyTimer: string = '00:00';

  partyStatus: any = MediaPlayerConstants.PARTY_STATUS.PAUSE;

  isHost: any;
  isCoHost: any;
  hasAccessForVideoControl: any;
  isExternalRequestToPlayPause: any = false;

  hasPermissionToPause: any;
  hasPermissionToResume: any;

  partStartsInMessage: any;

  overridePlayProtocol: any; //Guest cannot play a video on his own, but there are special cases to override

  partyId: any;
  loggedInUserdId: any;

  userSessionAuthenticated: any = 'loading';
  isPartyFull: any = false;
  userAccessedPrivateParty: any = false;

  hasNoAccessToParty = false;

  partyInviteURL: any;

  partyList: any = {};
  //###################Party cotrols related declarations <ENDS HERE>###################

  //###################Party area layout controls related declarations <STARTS HERE>###################
  videoAreaLayout: any = 50;
  chatAreaLayout: any = 45;

  fullScreen: any = true;

  videoPlayerLayout = 91;
  videoPlayerControlsLayout = 5;

  isSmallScreenMode: boolean;

  showMoreVideoControlOptions: boolean = false;
  //###################Party area layout controls related declarations <ENDS HERE>###################

  //################### animations related declarations <STARTS HERE>###################
  speakingIcon: any = 'volume_mute';

  //################### animations related declarations <ENDS HERE>###################

  //###################Feedback questions related declarations <STARTS HERE>###################
  feedbackQuestions: any = [];
  //###################Feedback questions related declarations <ENDS HERE>###################

  //###################Spinner related declarations <STARTS HERE>###################
  color = 'primary';
  mode = 'indeterminate';
  value = 50;
  displayProgressSpinner = false;
  spinnerWithoutBackdrop = true;
  //###################Spinner related declarations <ENDS HERE>###################

  //###################Video player related declarations <STARTS HERE>###################

  isControlsAreaMinimised: any = true;

  showVideoControls: any = -1;

  partyPlayerStatus: any = {
    icon: 'stop',
    label: 'WAIT',
  };

  ySyncInterval: any;

  fetchingSeek: any = false;

  playerStatus: any;

  player: any;

  currentSeek: any;
  totalVideoDuration: any;

  enableCatchup: any = false;

  autoTicks = false;
  showTicks = false;
  tickInterval = 0.1;

  triggerSeeking = true;
  canTriggerRegularSync = false;
  //###################Video player related declarations <ENDS HERE>###################

  //###################Video/Text chat related declarations <STARTS HERE>###################
  iceServerCredentials: any;

  localVideo: any;
  localStream: any;

  localAudioEnabled: any = false;
  localVideoEnabled: any = false;

  videoConnectionDetails: any;

  peerConnections: any = {};

  allParticipants: any = [];

  localVideoStatus: any = 'disabled';

  videoBroadCastLoading: any = false;

  volumeButton: any = {
    icon: 'volume_up',
    label: 'MUTE',
    volume: MediaPlayerConstants.DEFAULT_VOLUME,
    showVolume: false,
  };

  connectedUsersSeekMap: any = {};

  chatPreference: any = 'video';
  //###################Video/Text chat related declarations <ENDS HERE>###################

  constructor(
    private ss: SharedService,
    private cs: CookieService,
    private ls: LoginAuthService,
    private playerControls: PlayerControlsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private jwtHelper: JwtHelperService,
    private _snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private partyService: PartyService,
    @Inject(DOCUMENT) private document: Document,
    public dialog: MatDialog,
    private meta: Meta,
    private title: Title,
    private breakpointObserver: BreakpointObserver
  ) {
    let paramsService = this.activatedRoute.params.subscribe((params) => {
      this.partyId = params['partyId'];
      //Socket connection
      this.socket = io.connect(
        environment.defaultSocketConnection + '/partySync',
        { query: `partyId=${this.partyId}` }
      );
      this.videoAudioSocket = io.connect(
        environment.defaultSocketConnection + '/videoAudioStream',
        { query: `partyId=${this.partyId}` }
      );
    });

    this.subscription.add(paramsService);

    this.loggedInUserdId = this.cs.getItem('_uid');

    //Get party data
    let sharedService = this.ss.partyDetails.subscribe((data: any) => {
      this.partyData = data && data.partyData;

      if (!this.partyData) {
        return;
      }

      this.partyInviteURL = `${window.location.origin}/joinParty?v=${this.partyData._id}`;

      // console.log("PARTY DATA::", this.partyData)
      this.syncDataForVideoAudioChat();

      this.isHost = this.ls.isHost();
      this.isCoHost = this.ls.isCoHost();
      this.hasAccessForVideoControl = this.isHost || this.isCoHost;

      // y-sync interval
      if (this.partyData) {
        this.ySyncInterval = setInterval(() => {
          if (
            this.socket &&
            this.socket.connected &&
            this.playerStatus == MediaPlayerConstants.PLAYER_STATUS.playing
          ) {
            //Send signal to server for intelligent syncing...
            this.socket.emit('MY_CURRENT_SEEK', this.currentSeek);
          }
        }, GlobalConstants.DEFAULT_SEND_MY_SEEK_SYNC);
      }

      //Update Meta data of the page
      this.updateMetaData();
    });
    this.subscription.add(sharedService);

    let youtubePlayerService = this.ss.youtubePlayer.subscribe((data: any) => {
      this.player = data;
      this.totalVideoDuration = this.playerControls.getDuration(
        MediaPlayerConstants.TYPE.YOUTUBE,
        { player: this.player }
      );
      setInterval(() => {
        if (this.triggerSeeking) {
          this.currentSeek = this.playerControls.getCurrentTime(
            MediaPlayerConstants.TYPE.YOUTUBE,
            { player: this.player }
          );
        }
      }, 0);
    });

    this.subscription.add(youtubePlayerService);

    //Speaking animation...
    /* setInterval(() => {
      switch (this.speakingIcon) {
        case 'volume_mute':
          this.speakingIcon = 'volume_down';
          break;
        case 'volume_down':
          this.speakingIcon = 'volume_up';
          break;
        case 'volume_up':
          this.speakingIcon = 'volume_mute';
          break;
      }
    }, 300) */
  }

  ngOnInit(): void {
    let self = this;
    this.isPartyFull = false;
    this.overridePlayProtocol = false;
    this.partyData = null;
    this.player = null;
    this.currentSeek = 0;
    this.fullScreen = true;
    this.isExternalRequestToPlayPause = false;

    this.ss.setFullScreenMode(this.fullScreen);

    //Get feedback questions
    this.getFeedbackQuestions();

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

        //Refreshing video chat w.r.t the selection
        this.configureBroadcasting(
          this.localAudioEnabled,
          this.localVideoEnabled
        );

        this.cd.detectChanges();
      });
    //###################Media Query <ENDS HERE>###################

    //Socket related::

    this.socket.on('connect', () => {
      // console.log("Connected, triggering auth")
      let token = this.cs.getItem('_tkn');
      this.socket.emit('authentication', {
        token: token,
      });

      this.socket.on('authenticated', () => {
        // console.log("#authenticated")
        let data = {
          loggedInUser: this.loggedInUserdId,
          isHost: this.isHost,
        };
        this.userSessionAuthenticated = 'authenticated';
        this.socket.emit('CREATE_OR_JOIN_PARTY_ROOM', JSON.stringify(data));
      });

      this.socket.on('PARTY_IS_FULL', (err) => {
        // console.log("unauthorized", err)
        this.dialog.closeAll();
        this.isPartyFull = true;
      });

      this.socket.on('unauthorized', (err) => {
        // console.log("unauthorized", err)
        this.userSessionAuthenticated = 'unauthorised';
      });
    });

    this.socket.on('invalidPartyId', function () {
      // console.log("Party you are trying to join doesn't exists");
    });

    this.socket.on('hostAlreadyJoined', function () {
      // console.log("Already joined");
    });

    this.socket.on('USER_CREATED_OR_JOINED_PARTY', (response) => {
      // console.log('USER_CREATED_OR_JOINED_PARTY', guestData);
      this.hostJoinedTheParty(response);
    });

    this.socket.on('NO_LONGER_ACCESS_TO_PARTY', () => {
      this.dialog.closeAll();
      this.hasNoAccessToParty = true;
    });

    this.socket.on('HELLO_TO_EVERYONE', (guestData: any, socketId: any) => {
      this.addUserToPartyList(guestData, socketId);
    });

    this.socket.on(
      'CURRENT_PLAYER_STATUS',
      (currentSeek: any, partyStatus: any) => {
        // console.log({ currentSeek, partyStatus })
        this.currentSeek = currentSeek;
        this.partyStatus = partyStatus;

        let playerInterval = setInterval(() => {
          if (
            this.player &&
            this.player.g &&
            this.player.g.g &&
            this.player.g.g.host
          ) {
            // console.log("this.player::", this.player)
            if (partyStatus == MediaPlayerConstants.PARTY_STATUS.RESUME) {
              // console.log("INSIDE PLAYING...")
              this.hasPermissionToResume = true;
              this.hasPermissionToPause = false;
              this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
                player: this.player,
              });
            }
            if (currentSeek) {
              setTimeout(() => {
                this.triggerSeeking = true;
                this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
                  player: this.player,
                  seekTo: currentSeek,
                });
              }, 0);
            }
            clearInterval(playerInterval);
          }
        }, 1);
      }
    );

    this.socket.on('SEEK_TO', (seekTo: any) => {
      this.triggerSeeking = true;
      this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
        seekTo,
      });
      this.openSnackBar(`HOST has seeked the Video.`, '', 'bottom', 'center');
    });

    this.socket.on('PAUSE_THE_PARTY', (hostSessionId) => {
      //Pause video
      this.isExternalRequestToPlayPause = true;
      if (!this.hasAccessForVideoControl) {
        this.partyStatus = MediaPlayerConstants.PARTY_STATUS.PAUSE;
        this.hasPermissionToPause = true;
      }
      this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
        status: this.playerStatus,
      });
    });

    this.socket.on('RESUME_THE_PARTY', (hostSessionId, seekTo) => {
      // console.log("RESUME_THE_PARTY", hostSessionId, seekTo)
      // this.forcePausedVideo = false;
      this.isExternalRequestToPlayPause = true;
      if (!this.hasAccessForVideoControl) {
        this.partyStatus = MediaPlayerConstants.PARTY_STATUS.RESUME;
        this.hasPermissionToResume = true;
      }
      setTimeout(() => {
        this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
        });

        // this.openSnackBar(`HOST has played the video.`, '', 'bottom', 'center');
      }, 0);
    });

    this.socket.on('END_THE_PARTY', (endParty) => {
      endParty = JSON.parse(endParty);
      this.partyData = _.assignIn(this.partyData, endParty);
      this.dialog.closeAll();
      this.openSnackBar(`HOST has ended the Party.`, '', 'bottom', 'center');
    });

    this.socket.on('UPDATE_PARTY_DATA', (partyData: any) => {
      partyData = partyData ? JSON.parse(partyData) : null;
      partyData && this.ss.setPartyDetails({ partyData });
    });

    this.socket.on('ADD_REMOVE_GUESTS', (partyData: any) => {
      partyData = partyData ? JSON.parse(partyData) : null;
      partyData && this.ss.setPartyDetails({ partyData });

      //Remove guests who has been removed from party
      let allGuestIds = _.map(partyData.guests, (guest: any) => {
        return guest.userId._id;
      });
      this.allParticipants = _.filter(
        this.allParticipants,
        (participant: any) => {
          return allGuestIds.includes(participant.userId);
        }
      );
      this.syncDataForVideoAudioChat();

      if (!allGuestIds.includes(this.loggedInUserdId)) {
        this.closeAllConnections();
        this.hasNoAccessToParty = true;
      }
    });

    this.socket.on('UPDATE_VIDEO_CHAT_LIST', () => {
      let allGuestIds = _.map(this.partyData.guests, (guest: any) => {
        return guest.userId._id;
      });
      this.allParticipants = _.filter(
        this.allParticipants,
        (participant: any) => {
          return allGuestIds.includes(participant.userId);
        }
      );
      this.syncDataForVideoAudioChat();
    });

    this.socket.on(
      'PUSH_NOTIFICATION',
      (message: any, specialMessageData: any) => {
        if (message) {
          this.openSnackBar(`${message}`, '', 'bottom', 'center');
        } else {
          if (specialMessageData.type == 'roleUpdate') {
            let isLoggedInUser =
              specialMessageData.guestUserId == this.loggedInUserdId;
            if (specialMessageData.isAdd) {
              message = ` ${
                isLoggedInUser
                  ? 'YOU have '
                  : specialMessageData.guestName + ' has '
              }been added as CO-HOST.`;
            } else {
              message = ` ${
                isLoggedInUser
                  ? 'YOU have '
                  : specialMessageData.guestName + ' has '
              }been removed from CO-HOST role.`;
            }
          }
        }
        this.openSnackBar(`${message}`, '', 'bottom', 'center');
      }
    );

    this.socket.on('NO_ACCESS_PRIVATE_PARTY', () => {
      this.dialog.closeAll();
      this.userAccessedPrivateParty = true;
    });

    this.socket.on('RESET_SEEK', () => {
      this.currentSeek = 0;
    });

    this.socket.on('CONTINUE_WITH_CURRENT_SESSION', () => {
      window.location.reload();
    });

    this.socket.on('REDIRECT_TO_HOMEPAGE', () => {
      window.location.href = '';
    });

    this.socket.on('USER_CONNECTED', (userId: any) => {
      //Update participant staus as online
      this.updateParticipantsData(userId, { online: true });
    });

    this.socket.on('USER_DISCONNECTED', (userId: any) => {
      //Update participant staus as offline
      this.updateParticipantsData(userId, { online: false });

      //Remove user key from seek map
      let userExistsInSeekMap = _.has(this.connectedUsersSeekMap, userId);
      userExistsInSeekMap && delete this.connectedUsersSeekMap[userId];
    });

    this.socket.on('UPDATE_CONNECTION_DETAILS', (connectionMap: any = '{}') => {
      this.videoConnectionDetails = JSON.parse(connectionMap);
    });

    this.socket.on('MY_CURRENT_SEEK', (seek: any, userId: any) => {
      //Update the seek value map & know if user need to be catch up with friends

      this.connectedUsersSeekMap[this.loggedInUserdId] = parseInt(
        this.currentSeek
      );
      this.connectedUsersSeekMap[userId] = parseInt(seek);

      let allSeekValues = _.values(this.connectedUsersSeekMap);
      let highestSeekValue = _.max(_.values(allSeekValues));

      this.enableCatchup =
        highestSeekValue - this.currentSeek > 3 ? true : false;

      // console.log({ highestSeekValue, currentSeek: this.currentSeek, enableCatchup: this.enableCatchup })
    });

    this.socket.on('disconnect', () => {
      this.dialog.closeAll();
      // this.userSessionAuthenticated = "serverDisconnected";
      // console.log("Server disconnected...");
      //Need a proper mechanism here
    });

    //Audio Video socket

    this.videoAudioSocket.on('joinedVideoCall', (iceCredentials) => {
      // console.log("\n joinedVideoCall");

      if (environment.production && iceCredentials && iceCredentials.length) {
        iceCredentials = atob(iceCredentials);
        try {
          this.iceServerCredentials = JSON.parse(iceCredentials);
        } catch (e) {
          this.iceServerCredentials = null;
        }
      }

      setTimeout(() => {
        // console.log("triggering watcher")
        this.videoBroadCastLoading = false;
        this.videoAudioSocket.emit('hi_some_one_there');
      }, 2000);
    });

    this.videoAudioSocket.on('broadcaster', (id) => {
      // console.log("\n broadcaster", id);
      this.videoAudioSocket.emit('watcher', id);
    });

    this.videoAudioSocket.on('watcher', (id, userId) => {
      // console.log(`My userId is ${this.loggedInUserdId} & the watcher signal came from ${userId}`, this.localVideoStatus);
      if (this.localVideoStatus == 'loaded') {
        try {
          let peerConnection = <RTCPeerConnection>new RTCPeerConnection();

          if (environment.production && this.iceServerCredentials) {
            peerConnection = <RTCPeerConnection>(
              new RTCPeerConnection(this.iceServerCredentials)
            );
          }
          this.peerConnections[userId] = peerConnection;

          let stream = this.localVideo.srcObject;
          stream
            .getTracks()
            .forEach((track) => peerConnection.addTrack(track, stream));

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              this.videoAudioSocket.emit('candidate', id, event.candidate);
            } else {
              // console.log("there are no more candidates coming during this negotiation")
            }
          };

          peerConnection
            .createOffer()
            .then((offer) => {
              return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
              const desc = {
                type: peerConnection.localDescription.type,
                sdp: this.updateBandwidthRestriction(
                  peerConnection.localDescription.sdp,
                  250
                ),
              };
              this.videoAudioSocket.emit('offer', id, desc);
            })
            .catch((e) => {
              console.log('E::', e);
            });

          //Update connection related data
          this.rtcConnectionUpdate();
        } catch (e) {
          console.log('E::', e);
        }
      }
    });

    this.videoAudioSocket.on('candidate', (id, candidate, userId) => {
      // console.log(`My userId is ${this.loggedInUserdId} & the candidate signal came from ${userId}`);
      candidate = new RTCIceCandidate(candidate);
      this.peerConnections[userId].addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      this.updateParticipantsData(userId, { loading: false });

      //Send signal to save metrics
      /* let metricsData = {
        userId: this.loggedInUserdId,
        peerId: userId,
        transportPolicy: candidate.type,
        address: candidate.address
      };
      this.videoAudioSocket.emit("SAVE_TRANSPORT_POLICY_METRICS", metricsData); */

      //Update connection related data
      this.rtcConnectionUpdate();
    });

    this.videoAudioSocket.on('offer', (id, description, userId) => {
      // console.log(`My userId is ${this.loggedInUserdId} & the offer signal came from ${userId}`);
      let peerConnection = <RTCPeerConnection>new RTCPeerConnection();

      if (environment.production && this.iceServerCredentials) {
        peerConnection = <RTCPeerConnection>(
          new RTCPeerConnection(this.iceServerCredentials)
        );
      }
      this.peerConnections[userId] = peerConnection;

      // console.log("HERE 1")
      peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then((sdp) => peerConnection.setLocalDescription(sdp))
        .then(() => {
          const desc = {
            type: peerConnection.localDescription.type,
            sdp: this.updateBandwidthRestriction(
              peerConnection.localDescription.sdp,
              250
            ),
          };
          this.videoAudioSocket.emit('answer', id, desc);
        });
      peerConnection.ontrack = (event: any) => {
        let mediaObject = {};
        if (event && event.track.kind) {
          let track = event.track;
          switch (track.kind) {
            case 'audio':
              if (track.enabled) {
                mediaObject['audio'] = true;
              }
              break;
            case 'video':
              if (track.enabled) {
                mediaObject['video'] = true;
              }
              break;
          }
        }
        this.updateParticipantsData(userId, mediaObject);

        setTimeout(() => {
          let video = <any>document.getElementById(userId);
          video && (video.srcObject = event.streams[0]);
        }, 0);
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.videoAudioSocket.emit('candidate', id, event.candidate);
        } else {
          // console.log("there are no more candidates coming during this negotiation")
        }
      };

      //Update connection related data
      this.rtcConnectionUpdate();
    });

    this.videoAudioSocket.on('answer', (id, description, userId) => {
      // console.log(`My userId is ${this.loggedInUserdId} & the answer signal came from ${userId} & i have following connections ${JSON.stringify(_.keys(this.peerConnections))}`);
      this.peerConnections[userId].setRemoteDescription(description);

      //Update connection related data
      this.rtcConnectionUpdate();
    });

    this.videoAudioSocket.on(
      'broadcastData',
      (userId: any, broadcastData: any) => {
        // console.log(broadcastData)
        _.each(this.allParticipants, (participant: any) => {
          if (participant.userId == userId) {
            participant.loading =
              broadcastData &&
              broadcastData.status == GlobalConstants.STATUS_MAP.LOADING
                ? true
                : false;
            participant.hasVideo =
              broadcastData && broadcastData.video ? true : false;
            participant.hasAudio =
              broadcastData && broadcastData.audio ? true : false;

            // console.log({ participant })
          }
        });
      }
    );

    this.videoAudioSocket.on('disconnectPeer', (id, userId) => {
      // console.log(`My userId is ${this.loggedInUserdId} & the disconnectPeer signal came from ${userId}`);
      if (this.peerConnections[userId]) {
        this.updateParticipantsData(userId, {
          audio: false,
          video: false,
          loading: false,
        });
        this.peerConnections[userId].close();

        //Update connection related data
        this.rtcConnectionUpdate();
      }
    });
  }

  ngAfterViewInit() {
    //Audio Video socket

    this.videoAudioSocket.on('connect', () => {
      this.videoBroadCastLoading = true;
      let token = this.cs.getItem('_tkn');
      this.videoAudioSocket.emit('authentication', {
        token: token,
      });

      this.videoAudioSocket.on('authenticated', () => {
        setTimeout(() => {
          this.videoAudioSocket.emit('joinVideoCall');
        }, 1000);
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log("changes::", changes)
  }

  //###################General code <STARTS HERE>###################
  updateMetaData(isDefault?: any) {
    if (isDefault) {
      this.title.setTitle(environment.pageMetadata.default.title);
      this.meta.updateTag({
        name: 'description',
        content: environment.pageMetadata.default.description,
      });
      this.meta.updateTag({
        name: 'og:url',
        content: environment.pageMetadata.default.url,
      });
      return;
    }

    if (!this.partyData) {
      return;
    }
    this.title.setTitle(`Watch ${this.partyData.title} with your friends`);

    this.meta.updateTag({
      name: 'description',
      content: `WatchYaari lets you watch videos with your friends in real-time over a video chat & a text chat. Share ideas, opinions, laughs & learn with your friends while we takeup the challenge of synching the video & connecting you seamlessly.`,
    });
    if (this.partyData.videoSource == 'YOUTUBE') {
      this.meta.updateTag({
        name: 'og:url',
        content: `https://img.youtube.com/vi/${this.partyData.videoId}/0.jpg`,
      });
    }
  }

  getFeedbackQuestions() {
    this.partyService
      .getFeedbackQuestions({
        feedbackType: 'party',
        isActive: true,
      })
      .subscribe((resposne: any) => {
        if (resposne.Success) {
          this.feedbackQuestions = resposne.questions || [];
          this.feedbackQuestions = _.map(
            this.feedbackQuestions,
            (question: any) => {
              question.response = '';
              return question;
            }
          );
        }
      });
  }

  openSnackBar(
    message: any,
    action: any,
    verticalPosition?: any,
    horizontalPosition?: any
  ) {
    this._snackBar.open(message, action || 'close', {
      duration: 2000,
      verticalPosition: verticalPosition || 'bottom',
      horizontalPosition: horizontalPosition || 'right',
    });
  }

  getScheduledDiff(type: any, scheduledDate: any) {
    if (type == 'hours') {
      return moment(scheduledDate).diff(moment(), 'hours');
    }
    if (type == 'minutes') {
      return moment(scheduledDate).diff(moment(), 'minutes');
    }
    if (type == 'seconds') {
      return moment(scheduledDate).diff(moment(), 'seconds');
    }
  }

  showDefaultAvatarOfLocalUser() {
    return (
      this.partyData &&
      this.partyData.videoId &&
      this.userSessionAuthenticated == 'authenticated' &&
      this.localVideoStatus == 'disabled'
    );
  }
  //###################General code <ENDS HERE>###################

  //###################Party(Layout/controls) related code <STARTS HERE>###################

  addUserToPartyList(guestData: any, socketId: any) {
    let guestIndex =
      this.partyData &&
      _.findIndex(this.partyData.guests, function (o: any) {
        return o._id === guestData._id;
      });
    if (this.partyData && guestIndex < 0) {
      this.partyData.guests.push(guestData);

      this.ss.setPartyDetails({ partyData: this.partyData });

      this.syncDataForVideoAudioChat();
    }

    //Update participant staus as online
    this.updateParticipantsData(guestData.userId._id, { online: true });

    //Send ack. signal
    this.socket.emit('USER_CONNECTED', this.loggedInUserdId, socketId);
  }

  otherParticipants() {
    let peers = [];
    if (this.partyData && this.partyData.guests) {
      _.each(this.partyData.guests, (guest: any) => {
        if (guest.userId && guest.userId._id !== this.loggedInUserdId) {
          peers.push({
            id: guest.userId._id,
            value: guest.userId.fullName,
          });
        }
      });
    }
    return peers;
  }

  openChangeVideoModal() {
    if (!this.hasAccessForVideoControl) {
      this.openSnackBar(
        `Only Host or co-host can change the video.`,
        '',
        'bottom',
        'center'
      );
      return;
    }
    const dialogRef = this.dialog.open(ChangeVideoTrackComponent, {
      width: '800px',
      autoFocus: false,
      data: {
        videoId: this.partyData.videoId,
        videoSource: this.partyData.videoSource,
        isHost: this.isHost,
        isCoHost: this.isCoHost,
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.sendSignalToConnectedUsers) {
        this.currentSeek = 0;
        this.socket.emit('RESET_SEEK');

        //Send signal to connected users to update party video
        this.socket.emit('UPDATE_PARTY_DATA', this.partyData);
        if (result.message) {
          this.socket.emit('PUSH_NOTIFICATION', result.message);
        }
      }
    });

    this.subscription.add(modalResource);
  }

  openInviteGuestsModal() {
    /* if (!this.isHost) {
      this.openSnackBar(`Only host can invite guests to the party.`, '', 'bottom', 'center');
      return;
    } */
    const dialogRef = this.dialog.open(InviteGuestsComponent, {
      width: '800px',
      autoFocus: false,
      data: {
        socket: this.socket,
        partyId: this.partyData._id,
        isHost: this.isHost,
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.sendSignalToConnectedUsers) {
        //Send signal to connected users to update party video
      }
    });

    this.subscription.add(modalResource);
  }

  resizeTheLayout(data: any) {
    this.videoAreaLayout = data.layoutDimensions.videoAreaLayout;
    this.chatAreaLayout = data.layoutDimensions.chatAreaLayout;

    this.syncDataForVideoAudioChat();
  }

  getLayout(noOfGuests, loggedInUser) {
    let layoutInfo = { cols: 2, rows: 2 };
    switch (noOfGuests) {
      case 2:
        if (loggedInUser) {
          layoutInfo['cols'] = 4;
          layoutInfo['rows'] = 2;
        } else {
          layoutInfo['cols'] = 4;
          layoutInfo['rows'] = 2;
        }
        break;
      case 3:
        //If Chat area is minimised
        // console.log("this.videoAreaLayout", this.videoAreaLayout)
        if (this.videoAreaLayout <= 55) {
          if (loggedInUser) {
            layoutInfo['cols'] = 4;
            layoutInfo['rows'] = 1.5;
          } else {
            layoutInfo['cols'] = 2;
            layoutInfo['rows'] = 1.5;
          }
        } else {
          layoutInfo['cols'] = 4;
          layoutInfo['rows'] = 1;
        }
        break;
      case 4:
        layoutInfo['cols'] = 2;
        layoutInfo['rows'] = 2;
        break;
      case 5:
        if (loggedInUser) {
          layoutInfo['cols'] = 2;
          layoutInfo['rows'] = 4;
        } else {
          layoutInfo['cols'] = 1;
          layoutInfo['rows'] = 2;
        }
        break;
      default:
        if (loggedInUser) {
          layoutInfo['cols'] = 4;
          layoutInfo['rows'] = 4;
        }
        break;
    }
    return layoutInfo;
  }

  partyAreaStatus() {
    // console.log(this.userSessionAuthenticated)
    if (!this.partyData) {
      return {
        message: 'Loading...',
      }; //'LOADING';
    }
    if (this.partyData.status == 'ENDED') {
      return {
        message: 'The party is over.',
      }; //'';
    }

    if (this.partyData.status == 'DELETED') {
      return {
        message: 'Invalid url.',
      }; //'';
    }

    if (this.hasNoAccessToParty) {
      return {
        message: 'You no longer have access to this party.',
      }; //"NO_MORE_ACCESS";
    }
    if (this.userAccessedPrivateParty) {
      return {
        message:
          'The party room you are trying to enter is Private, Ask Party host to add you into their party guest list & refresh this page.',
      };
    }
    if (this.userSessionAuthenticated == 'loading') {
      return {
        message: 'Loading...',
      }; //'LOADING';
    }
    if (this.isPartyFull) {
      return {
        message: 'The Party Room is full!',
      }; //"PARTY_IS_FULL";
    }
    if (this.userSessionAuthenticated == 'serverDisconnected') {
      return {
        message: 'OOPS! Server Disconnected.',
      }; //"SERVER_DISCONNECTED";
    }
    if (this.userSessionAuthenticated == 'unauthorised') {
      return {
        message:
          'You are already in an active party. Click continue to proceed in the current browser tab.',
        action: 'ACTIVE_PARTY_LIMIT_EXCEEDED',
      }; //"DUPLICATE_SESSION";
    }
    if (['CREATED', 'ACTIVE', 'IN-ACTIVE'].includes(this.partyData.status)) {
      return {
        message: 'ACTIVE',
      };
    }
    /* if (this.partyData.status == 'SCHEDULED') {
      return 'SCHEDULED';
    } */
    return {
      message: 'Loading...',
    }; //'LOADING';
  }

  onCopyingInviteURL() {
    this.openSnackBar(`Invite URL copied successfully!`, '', '', 'center');
  }

  hostJoinedTheParty(response: any) {
    response = JSON.parse(response);
    let { userId, fullName, partyData } = response;
    let token = this.cs.getItem('_tkn');
    let expirationDate = this.jwtHelper.getTokenExpirationDate(token);
    const isExpired = this.jwtHelper.isTokenExpired(token);
    if (token && token.length && !isExpired) {
      this.cs.setItem(
        'crntPrtyId',
        response.partyId,
        expirationDate,
        '/',
        null,
        null
      );
      this.cs.setItem(
        '_scktId_' + this.partyId,
        response.socketId,
        this.ls.getTokenExpirationDate(),
        '/',
        null,
        null
      );
      if (response.isFirstToJoin) {
        return;
      }
    }

    //Add if a new user has joined using the public URL.
    // this.addUserToPartyList(userId, fullName);

    // console.log("AFTER::", this.partyList)
    let canTriggerHi = true;
    let sayHelloInterval = setInterval(() => {
      //Once video player is ready say hi to everyone
      if (canTriggerHi && this.player) {
        clearInterval(sayHelloInterval);

        this.partyData = partyData;
        this.ss.setPartyDetails({ partyData: this.partyData });

        // console.log("Triggering SAY_HELLO_TO_EVERYONE", this.partyData.guests);
        let guestData = _.filter(this.partyData.guests, (guest: any) => {
          return guest.userId._id == this.loggedInUserdId;
        });
        // console.log('guestData::', guestData)

        this.socket.emit('SAY_HELLO_TO_EVERYONE', guestData && guestData[0]);
        canTriggerHi = false;
      }
    }, 0);
  }

  togglePlayerArea(state: any) {
    if (state == 'minimize') {
      this.videoPlayerLayout = 91;
      this.videoPlayerControlsLayout = 5;
      this.isControlsAreaMinimised = true;
    } else {
      this.videoPlayerLayout = 70;
      this.videoPlayerControlsLayout = 25;
      this.isControlsAreaMinimised = false;
    }
  }

  toggleFullScreen() {
    this.fullScreen = !this.fullScreen;
    this.ss.setFullScreenMode(this.fullScreen);
  }

  exitParty() {
    let _self = this;
    const dialogRef = this.dialog.open(WarningModalComponent, {
      width: '1000px',
      autoFocus: false,
      data: {
        message: `Are you sure you wish to exit to the dashboard? You can rejoin this party later.`,
        actionText: 'EXIT PARTY',
        actionColor: 'primary',
        feedbackQuestions: this.feedbackQuestions,
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      //Save feedback response
      if (result && result.feedbackResponse) {
        this.displayProgressSpinner = true;
        this.partyService
          .submitFeedbackResponse({
            partyId: this.partyData._id,
            feedbackResponse: result.feedbackResponse,
          })
          .subscribe((res: any) => {
            this.displayProgressSpinner = false;
            postHandler();
          });
      } else {
        postHandler();
      }

      function postHandler() {
        if (result && result.yes) {
          _self.ss.setFullScreenMode(false);
          setTimeout(() => {
            _self.router.navigateByUrl('/joinParty');
          }, 0);
        }
      }
    });
    this.subscription.add(modalResource);
  }

  togglePartyPrivacy() {
    /* 
      To toggle party privacy b/w PUBLIC & PRIVATE.
      Users with party URL can enter PUBLIC parties.
      Users in the Guest lists can only enter PRIVATE parties.
    */
    this.updatingPartyPrivacy = true;
    this.partyService
      .togglePartyPrivacy({
        st: !this.partyData?.isPrivate,
        partyId: this.partyData._id,
      })
      .subscribe((response: any) => {
        this.updatingPartyPrivacy = false;
        if (response.Success) {
          this.partyData.isPrivate = !this.partyData.isPrivate;
          this.ss.setPartyDetails({ partyData: this.partyData });

          let message = `Successfully changed this room to ${
            this.partyData.isPrivate ? 'PRIVATE' : 'PUBLIC'
          }.`;
          this.openSnackBar(message, '', 'bottom', 'center');
        }
      });
  }

  canControlVideo() {
    return this.isHost || this.isCoHost;
  }

  endParty() {
    let _self = this;
    if (!this.isHost) {
      this.openSnackBar(`Only host can end the party`, '', 'bottom', 'center');
      return;
    }

    const dialogRef = this.dialog.open(WarningModalComponent, {
      width: '1000px',
      autoFocus: false,
      data: {
        message: `Are you sure you want to end this party? It will end permanently for all users.`,
        actionText: 'END PARTY',
        actionColor: 'warn',
        feedbackQuestions: this.feedbackQuestions,
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      //Save feedback response
      if (result && result.feedbackResponse) {
        this.displayProgressSpinner = true;
        this.partyService
          .submitFeedbackResponse({
            partyId: this.partyData._id,
            feedbackResponse: result.feedbackResponse,
          })
          .subscribe((res: any) => {
            this.displayProgressSpinner = false;
            postHandler();
          });
      } else {
        postHandler();
      }

      function postHandler() {
        if (result && result.yes) {
          let endParty = {
            _id: _self.partyData._id,
            endedOn: new Date().getTime(),
            isEnded: true,
            endedBy: _self.loggedInUserdId,
            status: 'ENDED',
          };
          _self.partyData = _.assignIn(_self.partyData, endParty);
          _self.socket.emit('END_PARTY', JSON.stringify(endParty));
          _self.closeAllConnections();

          _self.cs.removeItem('crntPrtyId', '/', null);
          _.each(_self.cs.keys(), (key) => {
            if (key.indexOf('_scktId_') == 0) {
              _self.cs.removeItem(key, '/', null);
            }
          });
          setTimeout(() => {
            _self.router.navigateByUrl('/');
          }, 0);
        }
      }
    });
    this.subscription.add(modalResource);
  }

  partStartsIn() {
    if (!this.partyData) {
      return;
    }
    let scheduledDate = this.partyData.scheduledDate;
    let diff = this.getScheduledDiff;
    let hours = diff('hours', scheduledDate).toString().padStart(2, '0');
    let minutes = (diff('minutes', scheduledDate) % 60)
      .toString()
      .padStart(2, '0');
    let seconds = (diff('seconds', scheduledDate) % 60)
      .toString()
      .padStart(2, '0');
    if (diff('seconds', scheduledDate) <= 0) {
      return '';
    }
    return `Party starts in ${hours}h :${minutes}m :${seconds}s`;
  }

  partyTimerFunction() {
    if (this.partyData && this.partyData.isStarted && this.isHost) {
      //tryToGetTimeFrom PartyDB, partyTimer
      let timer = 300,
        minutes,
        seconds;
      let interval = setInterval(() => {
        minutes = Math.ceil(timer / 60);
        seconds = timer % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        this.partyTimer = minutes + ':' + seconds;
        // this.cd.detectChanges();
        if (--timer < 0) {
          clearInterval(interval);
          this.partyTimer = 'Over';
        }
      }, 1000);
    }
  }
  //###################Party(Layout/controls) related code <ENDS HERE>###################

  //###################Video player related code <STARTS HERE>###################
  takeActionOnVideo(label: any) {
    if (label == 'PLAY') {
      this.partyPlayerStatus = {
        icon: 'pause',
        label: 'PAUSE',
      };
      this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
      });
      this.triggerSeeking = true;
    }
    if (label == 'PAUSE') {
      // console.log("this.player", this.player)
      this.partyPlayerStatus = {
        icon: 'play_arrow',
        label: 'PLAY',
      };
      this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
        status: this.playerStatus,
      });
      this.triggerSeeking = false;
    }
  }
  playVideo() {
    // YT.Player.playVideo
    this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
    });
  }

  getSliderTickInterval(): number | 'auto' {
    if (this.showTicks) {
      return this.autoTicks ? 'auto' : this.tickInterval;
    }

    return 0;
  }

  stopSeeking(event: any) {
    if (!this.hasAccessForVideoControl) {
      return;
    }
    this.triggerSeeking = false;
    this.currentSeek = event.value;
  }

  seekVideo(event: any) {
    // console.log("PAUSE_PARTY_AND_UPDATE_SEEK")
    if (!this.hasAccessForVideoControl) {
      if (
        [
          MediaPlayerConstants.PLAYER_STATUS.paused,
          MediaPlayerConstants.PLAYER_STATUS.unstarted,
        ].includes(this.playerStatus)
      ) {
        this.currentSeek = 0;
      }
      this.openSnackBar(
        `Only host can seek the video.`,
        '',
        'bottom',
        'center'
      );
      return;
    }

    this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      seekTo: event.value,
    });

    this.socket.emit('SEEK_TO', event.value);
  }

  catchUpVideoWithFriends() {
    //Calculate the highest seek value among connected users and show catchup if lagging
    this.fetchingSeek = true;

    let allSeekValues = _.values(this.connectedUsersSeekMap);
    let highestSeekValue = _.max(_.values(allSeekValues));

    this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      seekTo: highestSeekValue,
    });
    this.currentSeek = highestSeekValue;
    this.enableCatchup = false;
  }

  updatePartyPlayerStatus(status: any) {
    if (this.socket && this.hasAccessForVideoControl) {
      this.socket.emit('UPDATE_PARTY_PLAYER_STATUS', status);
    }
  }

  currentSeekDisplayVal(value: any) {
    if (value) {
      let dateObj = new Date(value * 1000);
      let hours = dateObj.getUTCHours();
      let minutes = dateObj.getUTCMinutes();
      let seconds = dateObj.getSeconds();
      let timeString =
        (hours ? hours.toString().padStart(2, '0') + ':' : '') +
        (minutes.toString().padStart(2, '0') + ':') +
        seconds.toString().padStart(2, '0');
      return timeString;
    }
    return '00:00';
  }

  onYTPlayerReady({ event, player }) {
    this.player = player;
    this.ss.setYoutubePlayer(player);
    this.partyPlayerStatus = {
      icon: 'play_arrow',
      label: 'PLAY',
    };

    //Set default volume
    this.playerControls.changeVolume(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      status: 'CHANGE',
      volume: MediaPlayerConstants.DEFAULT_VOLUME,
    });
  }

  onYTStateChange({ event, player }) {
    // console.log(event.data)
    this.player = player;
    this.ss.setYoutubePlayer(player);

    this.playerStatus = event.data;

    let hostSessionId = this.cs.getItem('_scktId_' + this.partyId);
    this.triggerSeeking = false;

    if (event.data == YT.PlayerState.BUFFERING) {
      this.fetchingSeek = true;
    }

    if (event.data == YT.PlayerState.PAUSED) {
      this.fetchingSeek = false;
      this.partyPlayerStatus = {
        icon: 'play_arrow',
        label: 'PLAY',
      };
      this.partyStatus = MediaPlayerConstants.PARTY_STATUS.PAUSE;
    }
    if (event.data == YT.PlayerState.PLAYING) {
      this.fetchingSeek = false;
      this.partyPlayerStatus = {
        icon: 'pause',
        label: 'PAUSE',
      };
      this.triggerSeeking = true;
      this.partyStatus = MediaPlayerConstants.PARTY_STATUS.RESUME;
    }

    if (this.hasAccessForVideoControl) {
      if (event.data == YT.PlayerState.PAUSED) {
        // this.socket.emit('PUSH_NOTIFICATION', `HOST has paused the video.`);
        if (!this.isExternalRequestToPlayPause) {
          this.updatePartyPlayerStatus(MediaPlayerConstants.PARTY_STATUS.PAUSE);
          this.socket.emit(
            'PAUSE_PARTY',
            JSON.stringify({ hostSessionId, seekTo: this.currentSeek })
          );
        }
        this.isExternalRequestToPlayPause = false;
      }

      if (event.data == YT.PlayerState.PLAYING) {
        // this.socket.emit('PUSH_NOTIFICATION', `HOST has resumed the video.`);
        if (!this.isExternalRequestToPlayPause) {
          this.updatePartyPlayerStatus(
            MediaPlayerConstants.PARTY_STATUS.RESUME
          );
          this.socket.emit(
            'RESUME_PARTY',
            JSON.stringify({ hostSessionId, seekTo: this.currentSeek })
          );
        }
        this.isExternalRequestToPlayPause = false;
      }
    } else {
      if (
        [YT.PlayerState.PAUSED, YT.PlayerState.PLAYING].includes(
          this.playerStatus
        )
      ) {
        // console.log('this.partyStatus::', this.partyStatus, " hasPermissionToPause::", this.hasPermissionToPause, " hasPermissionToResume::", this.hasPermissionToResume)
        if (YT.PlayerState.PAUSED == this.playerStatus) {
          if (
            !this.hasPermissionToPause &&
            this.partyStatus == MediaPlayerConstants.PARTY_STATUS.PAUSE
          ) {
            this.hasPermissionToResume = true;
            this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
              player: this.player,
            });
            return;
          } else {
            this.hasPermissionToResume = false;
          }
        }
        if (YT.PlayerState.PLAYING == this.playerStatus) {
          if (
            !this.hasPermissionToResume &&
            this.partyStatus == MediaPlayerConstants.PARTY_STATUS.RESUME
          ) {
            this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
              player: this.player,
              status: this.playerStatus,
            });
            this.hasPermissionToPause = true;
            return;
          } else {
            this.hasPermissionToPause = false;
          }
        }
      }
    }
  }

  changeVolumeState() {
    //3 states: volume_down, volume_up, volume_off
    switch (this.volumeButton.icon) {
      case 'volume_up':
        this.volumeButton = {
          icon: 'volume_off',
          label: 'UN MUTE',
          volume: 0,
        };

        //Mute player
        this.playerControls.changeVolume(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
          status: 'MUTE',
        });
        return;
      case 'volume_off':
        this.volumeButton = {
          icon: 'volume_up',
          label: 'MUTE',
          volume: MediaPlayerConstants.DEFAULT_VOLUME,
        };

        //Un-Mute player
        this.playerControls.changeVolume(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
          status: 'UN_MUTE',
        });
        return;
    }
  }

  changeVolume(event: any) {
    let volume = parseInt(event.value);
    this.volumeButton.icon = volume
      ? volume > 20
        ? 'volume_up'
        : 'volume_down'
      : 'volume_off';
    this.volumeButton.volume = volume;
    this.volumeButton.label = volume == 0 ? 'UN-MUTE' : 'MUTE';
    /* {
      icon: (volume) ? ((volume > 20) ? 'volume_up' : 'volume_down') : 'volume_off',
      label: 'MUTE',
      volume,
      showVolume: true
    }; */

    //Change volume
    this.playerControls.changeVolume(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      status: 'CHANGE',
      volume,
    });
  }

  //###################Video player related code <ENDS HERE>###################

  //###################Video/Text chat related code <STARTS HERE>###################
  updateParticipantsData(userId: any, status?: any) {
    _.each(this.allParticipants, (participant: any) => {
      if (participant.userId == userId) {
        status &&
          _.has(status, 'video') &&
          (participant.hasVideo = status.video);
        status &&
          _.has(status, 'audio') &&
          (participant.hasAudio = status.audio);
        status &&
          _.has(status, 'loading') &&
          (participant.loading = status.loading);
        status &&
          _.has(status, 'online') &&
          (participant.online = status.online);
      }
    });
  }

  syncDataForVideoAudioChat() {
    if (!this.partyData) {
      return;
    }
    this.allParticipants = this.allParticipants || [];
    _.each(this.partyData.guests, (guest: any) => {
      if (!guest || (guest && !guest.userId)) {
        return;
      }
      let existsingData = _.find(this.allParticipants, {
        userId: guest.userId._id,
      });
      let isLoggedInUser = guest.userId._id == this.loggedInUserdId;
      let layoutInfo = <any>(
        this.getLayout(this.partyData.guests.length, isLoggedInUser)
      );

      if (existsingData) {
        existsingData['cols'] = layoutInfo.cols;
        existsingData['rows'] = layoutInfo.rows;
        existsingData['loading'] = false;
      } else {
        let participant = {
          name: guest.userId.fullName,
          userId: guest.userId._id,
          loggedInUser: isLoggedInUser,
          hasVideo: existsingData ? existsingData.hasVideo : false,
          cols: layoutInfo.cols,
          rows: layoutInfo.rows,
          loading: false,
        };
        this.allParticipants.push(participant);
      }
    });
    this.allParticipants = _.sortBy(this.allParticipants, [
      (participant: any) => {
        return -participant.loggedInUser;
      },
    ]);
  }

  updateBandwidthRestriction(sdp, bandwidth) {
    let modifier = 'AS';
    if (adapter.browserDetails.browser === 'firefox') {
      bandwidth = (bandwidth >>> 0) * 1000;
      modifier = 'TIAS';
    }
    if (sdp.indexOf('b=' + modifier + ':') === -1) {
      // insert b= after c= line.
      sdp = sdp.replace(
        /c=IN (.*)\r\n/,
        'c=IN $1\r\nb=' + modifier + ':' + bandwidth + '\r\n'
      );
    } else {
      sdp = sdp.replace(
        new RegExp('b=' + modifier + ':.*\r\n'),
        'b=' + modifier + ':' + bandwidth + '\r\n'
      );
    }
    return sdp;
  }

  gotLocalMediaStream(mediaStream) {
    // console.log("mediaStream::", mediaStream)
    this.localStream = mediaStream;
    this.localVideo.srcObject = mediaStream;
  }

  handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
  }

  configureBroadcasting(audio: any, video: any) {
    // console.log({ audio, video })
    this.destroyLocalStream();
    let mediaStreamConstraints = <any>{};
    // this.localVideo = null;
    this.localVideoStatus = 'loading';
    this.localVideoEnabled = false;
    this.localAudioEnabled = false;
    if (!audio && !video) {
      this.localVideoStatus = 'disabled';
      this.videoAudioSocket.emit('disableVideo');
      return;
    }

    let constraints = <any>environment.mediaStreamConstraints.chrome;

    if (adapter.browserDetails.browser === 'firefox') {
      constraints = <any>environment.mediaStreamConstraints.firefox;
    }

    if (audio) {
      this.localAudioEnabled = true;
      mediaStreamConstraints['audio'] = true;
    } else {
      let audioTracks = this.localStream && this.localStream.getAudioTracks();
      audioTracks && audioTracks[0] && audioTracks[0].stop();
    }
    if (video) {
      this.localVideoEnabled = true;
      mediaStreamConstraints['video'] = constraints.video;
    } else {
      let videoTracks = this.localStream && this.localStream.getVideoTracks();
      videoTracks && videoTracks[0] && videoTracks[0].stop();
    }

    //Signal peers about the broadcast initialisation
    if (audio || video) {
      this.videoAudioSocket.emit('broadcastData', {
        audio: this.localAudioEnabled,
        video: this.localVideoEnabled,
        status: GlobalConstants.STATUS_MAP.LOADING,
      });
    }

    this.updateParticipantsData(this.loggedInUserdId, {
      audio: true,
      video: true,
      loading: false,
    });
    setTimeout(() => {
      this.localVideo = document.getElementById(this.loggedInUserdId);

      navigator.mediaDevices
        .getUserMedia(mediaStreamConstraints)
        .then((mediaStream) => {
          this.localVideoStatus = 'loaded';
          this.localStream = mediaStream;
          this.localVideo.srcObject = mediaStream;

          // console.log("Triggering broadcaster", this.localStream)
          //Send signal to all connected users...
          this.videoAudioSocket.emit('broadcaster');
        })
        .catch((error) => {
          this.localVideoStatus = 'disabled';
          this.localVideoEnabled = false;
          this.localAudioEnabled = false;

          this.handleLocalMediaStreamError(error);

          this.openSnackBar(
            `Error occurred accessing hardware. Please try again.`,
            '',
            '',
            'center'
          );
          this.videoAudioSocket.emit('broadcastData', {
            audio: false,
            video: false,
          });
        });
    }, 0);
  }

  rtcConnectionUpdate() {
    let allConnections = _.keys(this.peerConnections);
    _.each(allConnections, (connectionId: any) => {
      this.peerConnections[connectionId]
        .getStats()
        .then((stats) => {
          stats.forEach((report: any) => {
            if (report.type == 'candidate-pair') {
              this.getCandidates(
                this.peerConnections[connectionId],
                report.localCandidateId,
                report.remoteCandidateId,
                connectionId
              );
            }
          });
        })
        .catch(function (e) {
          console.log(e.name);
        });
    });
  }

  getCandidates(pc: any, localId: any, remoteId: any, connectionId) {
    pc.getStats(null)
      .then((stats: any) => {
        let localConnection, peerConnection;
        stats.forEach((report: any) => {
          if (report.id == localId) {
            localConnection = {
              type: report.candidateType,
              ip: report.ip,
            };
          } else if (report.id == remoteId) {
            peerConnection = {
              type: report.candidateType,
              ip: report.ip,
            };
          }
        });

        let details = {
          id: connectionId,
          details: {
            local: localConnection,
            peer: peerConnection,
          },
        };
        this.socket.emit('UPDATE_CONNECTION_DETAILS', details);
      })
      .catch(function (e) {
        console.log(e.name);
      });
  }

  disableLocalVideoStream() {
    this.localVideoStatus = 'disabled';
    this.videoAudioSocket.emit('disableVideo');
    this.localVideo.srcObject = null;
  }

  destroyLocalStream() {
    if (this.localStream && this.localStream.id) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
  }

  toggleChatInSmallScreens() {
    this.chatPreference == 'video'
      ? (this.chatPreference = 'text')
      : (this.chatPreference = 'video');
  }
  //###################Video/Text chat related code <ENDS HERE>###################

  //###################Clearing sessions related code <STARTS HERE>###################
  removeCurrentPartySession() {
    this.cs.removeItem('crntPrtyId', '/', null);
    _.each(this.cs.keys(), (key) => {
      if (key.indexOf('_scktId_') == 0) {
        this.cs.removeItem(key, '/', null);
      }
    });
  }

  closeAllPeerConnections() {
    let allConnections = _.keys(this.peerConnections);
    _.each(allConnections, (connection) => {
      this.peerConnections[connection] &&
        this.peerConnections[connection].close();
    });
  }

  closeAllConnections() {
    this.configureBroadcasting(false, false);

    setTimeout(() => {
      this.destroyLocalStream();
      this.localVideo = null;
      this.localVideoStatus = 'disabled';
      this.localVideoEnabled = false;
      this.localAudioEnabled = false;
      this.videoAudioSocket.emit('disableVideo');

      let audioTracks = this.localStream && this.localStream.getAudioTracks();
      audioTracks && audioTracks[0] && audioTracks[0].stop();

      let videoTracks = this.localStream && this.localStream.getVideoTracks();
      videoTracks && videoTracks[0] && videoTracks[0].stop();

      this.closeAllPeerConnections();
      this.removeCurrentPartySession();
      this.socket.close();
      this.videoAudioSocket.close();
      this.subscription.unsubscribe();

      this.player = null;
    }, 0);
  }

  closeOtherPartySessions(event: any) {
    //send signal to close other sessions.
    console.log('request to close other sessions recieved.');
    if (event.closeOtherSessions) {
      this.socket.emit(
        'RELEASE_ACTIVE_PARTY_SESSION_LOCK',
        this.loggedInUserdId
      );
    }
  }

  //###################Clearing sessions related code <ENDS HERE>###################

  ngOnDestroy() {
    this.ss.setPartyDetails(null);
    this.ss.setFullScreenMode(false);
    this.closeAllConnections();
    this.updateMetaData(true);
  }
}

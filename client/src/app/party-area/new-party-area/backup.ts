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

declare var YT: any;
declare var adapter: any;

/* interface Player extends YT.Player {
  videoId?: string | undefined;
} */

@Component({
  selector: 'app-new-party-area',
  templateUrl: './new-party-area.component.html',
  styleUrls: ['./new-party-area.component.css'],
})
export class NewPartyAreaComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  subscription: any = new Subscription();

  socket: SocketIOClient.Socket;
  videoAudioSocket: SocketIOClient.Socket;

  userSessionAuthenticated: any = 'loading';
  isPartyFull: any = false;

  hasNoAccessToParty = false;

  localVideoStatus: any = 'disabled';

  localVideoPreferences: any = null;

  partyData: any;
  streamURL: any;

  partyInviteURL: any;

  localVideo: any;
  localStream: any;

  partyId: any;
  loggedInUserdId: any;

  player: any;

  currentSeek: any;
  mrXSeekValue: any;
  totalVideoDuration: any;

  enableCatchup: any = false;

  autoTicks = false;
  showTicks = false;
  tickInterval = 0.1;

  triggerSeeking = true;
  canTriggerRegularSync = false;

  partyList: any = {};

  isHost: any;

  partyStatus: any = MediaPlayerConstants.PARTY_STATUS.PAUSE;
  playerStatus: any;

  partStartsInMessage: any;
  // forcePausedVideo = false;
  // hostRequestedToPause = false;

  //Video chat

  /* remoteVideo: any;
  remoteStream: any; */

  //Video call

  peerConnections: any = {};

  allParticipants: any = [];

  partyPlayerStatus: any = {
    icon: 'stop',
    label: 'WAIT',
  };

  ySyncInterval: any;

  showVideoControls: any = -1;

  videoAreaLayout: any = 55;
  chatAreaLayout: any = 45;

  videoPlayerLayout: any = 70;
  videoPlayerControlsLayout: any = 25;
  isControlsAreaMinimised: any = false;

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
    public dialog: MatDialog
  ) {
    this.partyData = null;

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

    let sharedService = this.ss.partyDetails.subscribe((data: any) => {
      this.partyData = data && data.partyData;
      if (!this.partyData) {
        return;
      }

      this.partyInviteURL = `${window.location.origin}/joinParty?v=${this.partyData._id}`;
      this.syncDataForVideoAudioChat();

      this.isHost = this.ls.isHost();

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
        }, 500 || this.partyData.ySync || 3000);
      }
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
  }

  ngOnInit(): void {
    let self = this;
    this.isPartyFull = false;

    let partyStartsInInterval = setInterval(() => {
      if (this.partyData) {
        if (this.partyData.status == 'SCHEDULED') {
          this.partStartsInMessage = this.partStartsIn();
          if (!this.partStartsInMessage) {
            let psSub = this.partyService
              .getPartyDetails({ partyId: this.partyData._id })
              .subscribe((res: any) => {
                this.ss.setPartyDetails({ partyData: res.data });
              });
            this.subscription.add(psSub);
            clearInterval(partyStartsInInterval);
            return;
          }
          this.cd.detectChanges();
        } else {
          clearInterval(partyStartsInInterval);
        }
      }
    }, 1000);

    //Socket relarted::
    this.socket.emit('ipaddr');

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
        };
        this.userSessionAuthenticated = 'authenticated';
        this.socket.emit('CREATE_OR_JOIN_PARTY_ROOM', JSON.stringify(data));
      });

      this.socket.on('PARTY_IS_FULL', (err) => {
        // console.log("unauthorized", err)
        this.isPartyFull = true;
      });

      this.socket.on('unauthorized', (err) => {
        // console.log("unauthorized", err)
        this.userSessionAuthenticated = 'unauthorised';
      });
    });

    this.socket.on(
      'CURRENT_PLAYER_STATUS',
      (currentSeek: any, playerStatus: any) => {
        this.currentSeek = currentSeek;
      }
    );

    this.socket.on('invalidPartyId', function () {
      // console.log("Party you are trying to join doesn't exists");
    });

    this.socket.on('hostAlreadyJoined', function () {
      // console.log("Already joined");
    });

    this.socket.on('USER_CREATED_OR_JOINED_PARTY', (guestData) => {
      // console.log('USER_CREATED_OR_JOINED_PARTY', guestData);
      this.hostJoinedTheParty(guestData);
    });

    this.socket.on('NO_LONGER_ACCESS_TO_PARTY', () => {
      this.hasNoAccessToParty = true;
    });

    this.socket.on(
      'HELLO_TO_EVERYONE',
      (guestSessionId: any, userId: any, fullName: any) => {
        // console.log("HELLO_TO_EVERYONE", guestSessionId, userId)
        //Update party list
        this.partyList[guestSessionId] = {
          ready: false,
        };

        this.addUserToPartyList(userId, fullName);

        if (this.isHost) {
          // console.log("I AM HOST")
          //Pause video
          let requiredState = this.playerStatus;
          // console.log("2#BEFORE::", requiredState)
          if (requiredState == MediaPlayerConstants.PLAYER_STATUS.playing) {
            this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
              player: this.player,
              status: this.playerStatus,
            });
          }
          // console.log("2#AFTER::", requiredState)

          let hostSessionId = this.cs.getItem('_scktId_' + this.partyId);
          this.socket.emit(
            'PAUSE_PARTY_AND_UPDATE_SEEK',
            JSON.stringify({
              hostSessionId,
              seekTo: this.currentSeek,
              requiredState,
            }),
            (reqSentTo) => {
              // console.log('reqSentTo::', reqSentTo);
              if (
                !reqSentTo &&
                requiredState == MediaPlayerConstants.PLAYER_STATUS.playing
              ) {
                this.playerControls.playVideo(
                  MediaPlayerConstants.TYPE.YOUTUBE,
                  { player: this.player }
                );
                this.triggerSeeking = true;
              }
            }
          );
        }
      }
    );

    this.socket.on(
      'UPDATE_SEEK_AND_PAUSE_PARTY',
      (seekTo, hostSessionId, requiredState) => {
        console.log('UPDATE_SEEK_AND_PAUSE_PARTY', seekTo);
        if (requiredState == MediaPlayerConstants.PLAYER_STATUS.playing) {
          this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
            player: this.player,
            status: this.playerStatus,
          });
        }

        setTimeout(() => {
          // console.log("this.player", this.player)
          this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
            player: this.player,
            seekTo,
          });

          //No need to emit for host himself
          if (hostSessionId !== this.cs.getItem('_scktId_' + this.partyId)) {
            this.socket.emit(
              'TELL_HOST_I_AM_READY',
              hostSessionId,
              requiredState
            );
          } else {
            // console.log("Playing video")
            this.socket.emit('TELL_EVERYONE_TO_RESUME_PARTY', requiredState);
          }
        }, 1000);
      }
    );

    this.socket.on('HOST_I_AM_READY', (guestId, requiredState) => {
      // console.log('HOST_I_AM_READY', guestId, requiredState)
      // console.log("this.partyList[guestId]::", this.partyList[guestId])
      if (!this.partyList) {
        this.partyList = {};
      }
      this.partyList[guestId] && (this.partyList[guestId].ready = true);

      // console.log("PARTY LIST::", this.partyList)

      let checkIfAllGuestsAreReady =
        _.findIndex(this.partyList, function (guest: any) {
          return !guest.ready;
        }) == -1;

      // console.log("checkIfAllGuestsAreReady::", checkIfAllGuestsAreReady)
      if (checkIfAllGuestsAreReady) {
        this.socket.emit('TELL_EVERYONE_TO_RESUME_PARTY', requiredState);
      }
    });

    this.socket.on('PROCEED_TO_PARTY', (requiredState) => {
      if (requiredState == MediaPlayerConstants.PLAYER_STATUS.playing) {
        this.triggerSeeking = true;
        this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
        });
      }
    });

    this.socket.on('GUEST_PLEASE_SEND_SEEK', (hostSessionId) => {
      // console.log("GUEST_PLEASE_SEND_SEEK", hostSessionId)
      //Pause video
      let requiredState = this.playerStatus;
      // console.log("1#BEFORE::", requiredState)
      if (requiredState == MediaPlayerConstants.PLAYER_STATUS.playing) {
        this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
          status: this.playerStatus,
        });
      }
      // console.log("1#AFTER::", requiredState)

      this.socket.emit(
        'PAUSE_PARTY_AND_UPDATE_SEEK',
        JSON.stringify({
          hostSessionId,
          seekTo: this.currentSeek,
          requiredState,
        }),
        (reqSentTo) => {
          // console.log('reqSentTo::', reqSentTo);
          if (
            !reqSentTo &&
            requiredState == MediaPlayerConstants.PLAYER_STATUS.playing
          ) {
            this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
              player: this.player,
            });
            this.triggerSeeking = true;
          }
        }
      );
    });

    this.socket.on('PAUSE_THE_PARTY', (hostSessionId) => {
      // console.log("PAUSE_THE_PARTY", hostSessionId)
      // this.forcePausedVideo = true;
      // this.hostRequestedToPause = true;
      //Pause video
      if (!this.isHost) {
        this.partyStatus = MediaPlayerConstants.PARTY_STATUS.PAUSE;
      }
      this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
        status: this.playerStatus,
      });
    });

    this.socket.on('RESUME_THE_PARTY', (hostSessionId, seekTo) => {
      // console.log("RESUME_THE_PARTY", hostSessionId, seekTo)
      // this.forcePausedVideo = false;
      // this.hostRequestedToPause = false;
      if (!this.isHost) {
        this.partyStatus = MediaPlayerConstants.PARTY_STATUS.RESUME;
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

      this.openSnackBar(`HOST has ended the Party.`, '', 'bottom', 'center');
    });

    this.socket.on('JUST_TESTING', () => {
      // console.log("JUST TESTING AT TRIGGERING SIDE")
    });

    this.socket.on('disconnect', () => {
      // console.log("Server disconnected...");
      //Need a proper mechanism here
    });

    this.socket.on(
      'CHECK_IF_YOU_ARE_LAGGING',
      (mrXId: any, seek: any, mrXsocketName: any) => {
        seek = parseInt(seek);
        this.mrXSeekValue = 0;
        if (mrXId != this.loggedInUserdId) {
          this.mrXSeekValue = seek + 1;
        }
        if (this.mrXSeekValue) {
          this.enableCatchup =
            Math.abs(this.currentSeek - this.mrXSeekValue) >= 3 ? true : false;
        }
      }
    );

    this.socket.on('UPDATE_PARTY_DATA', (partyData: any) => {
      partyData = partyData ? JSON.parse(partyData) : null;
      partyData && this.ss.setPartyDetails({ partyData });

      //Remove guests who has been removed from party
      let allGuestIds = _.map(this.partyData.guests, (guest: any) => {
        return guest.userId._id;
      });
      this.allParticipants = _.filter(
        this.allParticipants,
        (participant: any) => {
          return allGuestIds.includes(participant.userId);
        }
      );

      if (!allGuestIds.includes(this.loggedInUserdId)) {
        this.closeAllConnections();
        this.hasNoAccessToParty = true;
      }

      this.syncDataForVideoAudioChat();
    });

    this.socket.on('PUSH_NOTIFICATION', (message: any) => {
      this.openSnackBar(`${message}`, '', 'bottom', 'center');
    });

    //Audio Video

    this.videoAudioSocket.on('joinedVideoCall', (id) => {
      console.log('\n joinedVideoCall', id);
      setTimeout(() => {
        console.log('triggering watcher');
        this.videoAudioSocket.emit('hi_some_one_there');
      }, 2000);
    });

    this.videoAudioSocket.on('broadcaster', (id) => {
      console.log('\n broadcaster', id);
      this.videoAudioSocket.emit('watcher', id);
    });

    this.videoAudioSocket.on('watcher', (id) => {
      console.log('\n watcher', id);
      if (this.localVideoStatus == 'loaded') {
        const peerConnection = <any>(
          new RTCPeerConnection(<any>environment.iceServers)
        );
        this.peerConnections[id] = peerConnection;

        let stream = this.localVideo.srcObject;
        stream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, stream));

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.videoAudioSocket.emit('candidate', id, event.candidate);
          }
        };

        peerConnection
          .createOffer()
          .then((sdp) => {
            peerConnection.setLocalDescription(sdp);
          })
          .then(() => {
            const desc = {
              type: peerConnection.localDescription.type,
              sdp: this.updateBandwidthRestriction(
                peerConnection.localDescription.sdp,
                250
              ),
            };
            this.videoAudioSocket.emit('offer', id, desc, this.loggedInUserdId);
          });
      }
    });

    this.videoAudioSocket.on('candidate', (id, candidate) => {
      console.log('\n candidate', id);
      this.peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    });

    this.videoAudioSocket.on('offer', (id, description, userId) => {
      // console.log("\n offer", id);
      let peerConnection = <any>(
        new RTCPeerConnection(<any>environment.iceServers)
      );
      this.peerConnections[id] = peerConnection;

      console.log('HERE 1');
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
      peerConnection.ontrack = (event) => {
        this.updateParticipantsData(userId, true);

        setTimeout(() => {
          let video = <any>document.getElementById(userId);
          video && (video.srcObject = event.streams[0]);
        }, 0);
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(event.candidate);
          this.videoAudioSocket.emit('candidate', id, event.candidate);
        }
      };
    });

    this.videoAudioSocket.on('disconnectPeer', (id, userId) => {
      console.log('\n disconnectPeer', id);
      if (this.peerConnections[id]) {
        this.updateParticipantsData(userId, false);
        this.peerConnections[id].close();
      }
    });

    this.videoAudioSocket.on('answer', (id, description) => {
      console.log('\n HERE 2 answer', id);
      this.peerConnections[id].setRemoteDescription(description);
    });
  }

  ngAfterViewInit() {
    let self = this;

    //Audio Video

    this.videoAudioSocket.on('connect', () => {
      let token = this.cs.getItem('_tkn');
      this.videoAudioSocket.emit('authentication', {
        token: token,
      });

      this.socket.on('authenticated', () => {
        // this.userSessionAuthenticated = true;

        setTimeout(() => {
          this.videoAudioSocket.emit('joinVideoCall');
        }, 1000);
      });
    });

    //Video call
    // this.remoteVideo = document.getElementById('remoteVideo')
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('changes::', changes);
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

  hostJoinedTheParty(response: any) {
    response = JSON.parse(response);
    let { userId, fullName } = response;
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
    this.addUserToPartyList(userId, fullName);

    //Update party list with active users
    // console.log("BEFORE::", this.partyList)
    if (response.activeGuests) {
      _.each(response.activeGuests, (guestId) => {
        this.partyList[guestId] = {
          ready: true,
        };
      });
    }

    // console.log("AFTER::", this.partyList)
    let canTriggerHi = true;
    let sayHelloInterval = setInterval(() => {
      //Once video player is ready say hi to everyone
      if (canTriggerHi && this.player) {
        this.socket.emit(
          'SAY_HELLO_TO_EVERYONE',
          this.isHost,
          this.playerStatus
        );
        canTriggerHi = false;
        clearInterval(sayHelloInterval);
      }
    }, 0);
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
    if (!this.isHost) {
      return;
    }
    this.triggerSeeking = false;
    this.currentSeek = event.value;
  }

  seekVideo(event: any) {
    // console.log("PAUSE_PARTY_AND_UPDATE_SEEK")
    if (!this.isHost) {
      if (
        [
          MediaPlayerConstants.PLAYER_STATUS.paused,
          MediaPlayerConstants.PLAYER_STATUS.unstarted,
        ].includes(this.playerStatus)
      ) {
        this.currentSeek = 0;
      }
      this.openSnackBar(`Only host can seek the video`, '', 'bottom', 'center');
      return;
    }
    let allGuests = (this.partyList && _.keys(this.partyList)) || [];
    _.each(allGuests, (guestId) => {
      if (this.partyList[guestId]) {
        this.partyList[guestId].ready = false;
      }
    });

    //Pause video & update own seek
    let requiredState = this.playerStatus;
    // console.log("3#BEFORE::", requiredState)
    if (requiredState == MediaPlayerConstants.PLAYER_STATUS.playing) {
      this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
        player: this.player,
        status: this.playerStatus,
      });
    }
    // console.log("3#AFTER::", requiredState)
    this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      seekTo: event.value,
    });

    let hostSessionId = this.cs.getItem('_scktId_' + this.partyId);
    this.socket.emit(
      'PAUSE_PARTY_AND_UPDATE_SEEK',
      JSON.stringify({ hostSessionId, seekTo: event.value, requiredState }),
      (reqSentTo) => {
        // console.log('reqSentTo::', reqSentTo);
        if (
          !reqSentTo &&
          requiredState == MediaPlayerConstants.PLAYER_STATUS.playing
        ) {
          this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
            player: this.player,
          });
          this.triggerSeeking = true;
        }
      }
    );

    this.socket.emit('PUSH_NOTIFICATION', `HOST has seeked the video.`);
  }

  catchUpVideoWithFriends() {
    this.playerControls.seekTo(MediaPlayerConstants.TYPE.YOUTUBE, {
      player: this.player,
      seekTo: this.mrXSeekValue,
    });
    setTimeout(() => {
      this.openSnackBar(`Synced successfully!`, '', 'bottom', 'center');
    }, 1000);
  }

  onYTPlayerReady({ event, player }) {
    this.player = player;
    this.ss.setYoutubePlayer(player);
    this.partyPlayerStatus = {
      icon: 'play_arrow',
      label: 'PLAY',
    };
  }

  onYTStateChange({ event, player }) {
    // console.log(event, player)
    this.player = player;
    this.ss.setYoutubePlayer(player);

    this.playerStatus = event.data;

    let hostSessionId = this.cs.getItem('_scktId_' + this.partyId);
    this.triggerSeeking = false;

    if (event.data == YT.PlayerState.PAUSED) {
      this.partyPlayerStatus = {
        icon: 'play_arrow',
        label: 'PLAY',
      };
      this.updatePartyPlayerStatus(MediaPlayerConstants.PLAYER_STATUS.paused);
    }
    if (event.data == YT.PlayerState.PLAYING) {
      this.partyPlayerStatus = {
        icon: 'pause',
        label: 'PAUSE',
      };
      this.triggerSeeking = true;
      this.updatePartyPlayerStatus(MediaPlayerConstants.PLAYER_STATUS.playing);
    }

    if (this.isHost) {
      if (event.data == YT.PlayerState.PAUSED) {
        this.socket.emit('PUSH_NOTIFICATION', `HOST has paused the video.`);
        this.socket.emit(
          'PAUSE_PARTY',
          JSON.stringify({ hostSessionId, seekTo: this.currentSeek })
        );
      }

      if (event.data == YT.PlayerState.PLAYING) {
        this.socket.emit('PUSH_NOTIFICATION', `HOST has resumed the video.`);
        this.socket.emit(
          'RESUME_PARTY',
          JSON.stringify({ hostSessionId, seekTo: this.currentSeek })
        );
      }
    } else {
      // console.log("GUEST - " + hostSessionId + " :: " + this.partyStatus)
      if (this.partyStatus == MediaPlayerConstants.PARTY_STATUS.PAUSE) {
        this.playerControls.pauseVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
          status: this.playerStatus,
        });
        return;
      }

      if (this.partyStatus == MediaPlayerConstants.PARTY_STATUS.RESUME) {
        this.playerControls.playVideo(MediaPlayerConstants.TYPE.YOUTUBE, {
          player: this.player,
        });
        return;
      }
    }
  }

  videoAreaClicked(event: any) {
    // console.log(event);
    event.preventDefault();
  }

  updatePartyPlayerStatus(status: any) {
    if (this.socket && this.isHost) {
      this.socket.emit('UPDATE_PARTY_PLAYER_STATUS', status);
    }
  }

  localAudioEnabled: any = false;
  localVideoEnabled: any = false;
  configureBroadcasting(audio: any, video: any) {
    // console.log({ audio, video })
    this.destroyLocalStream();
    let mediaStreamConstraints = {};
    // this.localVideo = null;
    this.localVideoStatus = 'loading';
    this.localVideoEnabled = false;
    this.localAudioEnabled = false;
    if (!audio && !video) {
      this.localVideoStatus = 'disabled';
      this.videoAudioSocket.emit('disableVideo');
      return;
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
      mediaStreamConstraints['video'] =
        environment.mediaStreamConstraints.video;
    } else {
      let videoTracks = this.localStream && this.localStream.getVideoTracks();
      videoTracks && videoTracks[0] && videoTracks[0].stop();
    }

    this.updateParticipantsData(this.loggedInUserdId, true);
    setTimeout(() => {
      this.localVideo = document.getElementById(this.loggedInUserdId);

      navigator.mediaDevices
        .getUserMedia(mediaStreamConstraints)
        .then((mediaStream) => {
          this.localVideoStatus = 'loaded';
          this.localStream = mediaStream;
          this.localVideo.srcObject = mediaStream;

          console.log('Triggering broadcaster', this.localStream);
          //Send signal to all connected users...
          this.videoAudioSocket.emit('broadcaster');
        })
        .catch((error) => {
          this.localVideoStatus = 'disabled';
          this.handleLocalMediaStreamError(error);
        });
    }, 0);
  }

  disableLocalVideoStream() {
    this.localVideoStatus = 'disabled';
    this.videoAudioSocket.emit('disableVideo');
    this.localVideo.srcObject = null;
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

  showDefaultAvatarOfLocalUser() {
    return (
      this.partyData &&
      this.partyData.videoId &&
      this.userSessionAuthenticated == 'authenticated' &&
      this.localVideoStatus == 'disabled'
    );
  }

  destroyLocalStream() {
    if (this.localStream && this.localStream.id) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
  }

  closeAllPeerConnections() {
    let allConnections = _.keys(this.peerConnections);
    _.each(allConnections, (connection) => {
      this.peerConnections[connection] &&
        this.peerConnections[connection].close();
    });
  }

  updateParticipantsData(userId: any, status: any) {
    _.each(this.allParticipants, (participant: any) => {
      if (participant.userId == userId) {
        participant.hasVideo = status;
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
      } else {
        let participant = {
          name: guest.userId.fullName,
          userId: guest.userId._id,
          loggedInUser: isLoggedInUser,
          hasVideo: existsingData ? existsingData.hasVideo : false,
          cols: layoutInfo.cols,
          rows: layoutInfo.rows,
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

  getLayout(noOfGuess, loggedInUser) {
    let layoutInfo = { cols: 2, rows: 2 };
    switch (noOfGuess) {
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
        if (loggedInUser) {
          layoutInfo['cols'] = 2;
          layoutInfo['rows'] = 4;
        } else {
          layoutInfo['cols'] = 2;
          layoutInfo['rows'] = 2;
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
      console.log('this.player', this.player);
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

  partyAreaStatus() {
    if (!this.partyData) {
      return 'LOADING';
    }
    if (this.partyData.status == 'ENDED') {
      return '';
    }
    if (this.hasNoAccessToParty) {
      return 'NO_MORE_ACCESS';
    }
    if (this.userSessionAuthenticated == 'loading') {
      return 'LOADING';
    }
    if (this.isPartyFull) {
      this.closeAllConnections();
      return 'PARTY_IS_FULL';
    }
    if (this.userSessionAuthenticated == 'serverDisconnected') {
      return 'SERVER_DISCONNECTED';
    }
    if (this.userSessionAuthenticated == 'unauthorised') {
      return 'DUPLICATE_SESSION';
    }
    if (['CREATED', 'IN-PROGRESS'].includes(this.partyData.status)) {
      return 'ACTIVE';
    }
    if (this.partyData.status == 'SCHEDULED') {
      return 'SCHEDULED';
    }
    return 'LOADING';
  }

  onCopyingInviteURL() {
    this.openSnackBar(`Invite URL copied successfully!`, '', '', 'center');
  }

  openSnackBar(
    message: any,
    action: any,
    verticalPosition?: any,
    horizontalPosition?: any
  ) {
    this._snackBar.open(message, action, {
      duration: 2000,
      verticalPosition: verticalPosition || 'bottom',
      horizontalPosition: horizontalPosition || 'right',
    });
  }

  endParty() {
    if (!this.isHost) {
      this.openSnackBar(`Only host can end the party`, '', 'bottom', 'center');
      return;
    }

    const dialogRef = this.dialog.open(WarningModalComponent, {
      width: '400px',
      data: {
        message: `Are you sure, you want to end this party?`,
        actionText: 'Yes, End the Party.',
        actionColor: 'warn',
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.yes) {
        let endParty = {
          _id: this.partyData._id,
          endedOn: new Date().getTime(),
          isEnded: true,
          endedBy: this.loggedInUserdId,
          status: 'ENDED',
        };
        this.partyData = _.assignIn(this.partyData, endParty);
        this.socket.emit('END_PARTY', JSON.stringify(endParty));
        this.closeAllConnections();

        this.cs.removeItem('crntPrtyId', '/', null);
        _.each(this.cs.keys(), (key) => {
          if (key.indexOf('_scktId_') == 0) {
            this.cs.removeItem(key, '/', null);
          }
        });
        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 0);
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

  addUserToPartyList(userId: any, fullName: any) {
    let guestIndex =
      this.partyData &&
      _.findIndex(this.partyData.guests, function (o: any) {
        return o.userId._id === userId;
      });
    if (this.partyData && guestIndex < 0) {
      this.partyData.guests.push({
        userId: {
          _id: userId,
          fullName,
        },
      });
      this.syncDataForVideoAudioChat();
    }
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

  resizeTheLayout(data: any) {
    this.videoAreaLayout = data.layoutDimensions.videoAreaLayout;
    this.chatAreaLayout = data.layoutDimensions.chatAreaLayout;
  }

  togglePlayerArea(state: any) {
    if (state == 'minimize') {
      this.videoPlayerLayout = 91;
      this.videoPlayerControlsLayout = 6;
      this.isControlsAreaMinimised = true;
    } else {
      this.videoPlayerLayout = 70;
      this.videoPlayerControlsLayout = 25;
      this.isControlsAreaMinimised = false;
    }
  }

  openChangeVideoModal() {
    if (!this.isHost) {
      this.openSnackBar(
        `Only host can change the video`,
        '',
        'bottom',
        'center'
      );
      return;
    }
    const dialogRef = this.dialog.open(ChangeVideoTrackComponent, {
      width: '800px',
      data: {
        videoId: this.partyData.videoId,
        videoSource: this.partyData.videoSource,
      },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.sendSignalToConnectedUsers) {
        //Send signal to connected users to update party video
        this.socket.emit('UPDATE_PARTY_DATA', this.partyData);
        this.socket.emit(
          'PUSH_NOTIFICATION',
          `Video has been updated by the HOST.`
        );
      }
    });

    this.subscription.add(modalResource);
  }

  openInviteGuestsModal() {
    if (!this.isHost) {
      this.openSnackBar(
        `Only host can invite guests to the party.`,
        '',
        'bottom',
        'center'
      );
      return;
    }
    const dialogRef = this.dialog.open(InviteGuestsComponent, {
      width: '800px',
      data: { partyData: this.partyData },
    });

    let modalResource = dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.sendSignalToConnectedUsers) {
        //Send signal to connected users to update party video
        this.socket.emit('UPDATE_PARTY_DATA', this.partyData);
        this.socket.emit(
          'PUSH_NOTIFICATION',
          `HOST has updated the guests list.`
        );
      }
    });

    this.subscription.add(modalResource);
  }

  ngOnDestroy() {
    this.ss.setPartyDetails(null);
    this.closeAllConnections();
  }

  removeCurrentPartySession() {
    this.cs.removeItem('crntPrtyId', '/', null);
    _.each(this.cs.keys(), (key) => {
      if (key.indexOf('_scktId_') == 0) {
        this.cs.removeItem(key, '/', null);
      }
    });
  }

  closeAllConnections() {
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
  }
}

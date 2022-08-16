import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-video-audio-chat-area',
  templateUrl: './video-audio-chat-area.component.html',
  styleUrls: ['./video-audio-chat-area.component.css'],
})
export class VideoAudioChatAreaComponent implements OnInit, AfterViewInit {
  @Input() streamId: any;
  // @Input() buttonStatus: any;

  @Output() onStartAction = new EventEmitter<{ event: any; player: any }>();
  @Output() onCallAction = new EventEmitter<{
    buttonStatus: any;
    localStream: any;
    offerOptions: any;
  }>();

  mediaStreamConstraints: any = {
    video: {
      height: '390',
      width: '500',
    },
    // audio: true
  };

  buttonStatus = {
    startButton: {
      disabled: false,
    },
    callButton: {
      disabled: true,
    },
    hangupButton: {
      disabled: true,
    },
  };

  offerOptions: any = {
    offerToReceiveVideo: 1,
  };

  localVideo: any;
  localStream: any;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.localVideo = document.getElementById(this.streamId);

    // step-1::
    /* navigator.mediaDevices.getUserMedia(this.mediaStreamConstraints)
    .then((mediaStream)=>{
      this.gotLocalMediaStream(mediaStream);
    })
    .catch((error)=>{
      this.handleLocalMediaStreamError(error);
    }); */
  }

  gotLocalMediaStream(mediaStream) {
    this.localStream = mediaStream;
    this.localVideo.srcObject = mediaStream;
    if (this.streamId == 'localVideo') {
      this.buttonStatus.callButton.disabled = false;
    }
  }

  handleLocalMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
  }

  startAction() {
    this.buttonStatus.startButton.disabled = true;
    navigator.mediaDevices
      .getUserMedia(this.mediaStreamConstraints)
      .then((mediaStream) => {
        this.gotLocalMediaStream(mediaStream);
      })
      .catch((error) => {
        this.handleLocalMediaStreamError(error);
      });
    this.trace('Requesting local stream.');
  }

  callAction() {
    // this.onCallAction.emit({buttonStatus: this.buttonStatus, localStream: this.localStream, offerOptions: this.offerOptions});
  }

  trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
  }
}

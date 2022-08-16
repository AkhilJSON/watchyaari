import { NgModule } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { ReactiveFormsModule } from '@angular/forms';

import { PartyRoutingModule } from './party-routing.module';

import { RequiredMaterialModule } from '../required-material.module';
import { QuillModule } from 'ngx-quill';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { AppOverlayModule } from '../overlay/overlay.module';
import { ProgressSpinnerModule } from '../progress-spinner/progress-spinner.module';

//Components
import { NewPartyAreaComponent } from './new-party-area/new-party-area.component';
import { PartyChatComponent } from './party-chat/party-chat.component';
import { VideoAudioChatAreaComponent } from './video-audio-chat-area/video-audio-chat-area.component';
import { YoutubePlayerComponent } from './youtube-player/youtube-player.component';
import { ChangeVideoTrackComponent } from './change-video-track/change-video-track.component';
import { ProgressSpinnerComponent } from '../progress-spinner/progress-spinner.component';
import { InviteGuestsComponent } from './invite-guests/invite-guests.component';
import { WarningModalComponent } from './warning-modal/warning-modal.component';
import { PartyFeedbackComponent } from './party-feedback/party-feedback.component';

//Pipes

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelSpeed: 2,
  wheelPropagation: true,
};
@NgModule({
  declarations: [
    NewPartyAreaComponent,
    PartyChatComponent,
    VideoAudioChatAreaComponent,
    YoutubePlayerComponent,
    ChangeVideoTrackComponent,
    InviteGuestsComponent,
    WarningModalComponent,
    PartyFeedbackComponent,
  ],
  imports: [
    PartyRoutingModule,

    AppOverlayModule,
    ProgressSpinnerModule,

    RequiredMaterialModule,
    QuillModule.forRoot(),
    PerfectScrollbarModule,
    ReactiveFormsModule,
  ],
  entryComponents: [ProgressSpinnerComponent],
  providers: [Meta, Title],
})
export class PartyAreaModule {}

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoAudioChatAreaComponent } from './video-audio-chat-area.component';

describe('VideoAudioChatAreaComponent', () => {
  let component: VideoAudioChatAreaComponent;
  let fixture: ComponentFixture<VideoAudioChatAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideoAudioChatAreaComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoAudioChatAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

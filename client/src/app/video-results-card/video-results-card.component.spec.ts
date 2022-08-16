import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoResultsCardComponent } from './video-results-card.component';

describe('VideoResultsCardComponent', () => {
  let component: VideoResultsCardComponent;
  let fixture: ComponentFixture<VideoResultsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VideoResultsCardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoResultsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeVideoTrackComponent } from './change-video-track.component';

describe('ChangeVideoTrackComponent', () => {
  let component: ChangeVideoTrackComponent;
  let fixture: ComponentFixture<ChangeVideoTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeVideoTrackComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeVideoTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

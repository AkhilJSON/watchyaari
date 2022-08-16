import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyFeedbackComponent } from './party-feedback.component';

describe('PartyFeedbackComponent', () => {
  let component: PartyFeedbackComponent;
  let fixture: ComponentFixture<PartyFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PartyFeedbackComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartyFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

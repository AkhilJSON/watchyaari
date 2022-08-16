import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyChatComponent } from './party-chat.component';

describe('PartyChatComponent', () => {
  let component: PartyChatComponent;
  let fixture: ComponentFixture<PartyChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PartyChatComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartyChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchPartyComponent } from './launch-party.component';

describe('LaunchPartyComponent', () => {
  let component: LaunchPartyComponent;
  let fixture: ComponentFixture<LaunchPartyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LaunchPartyComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaunchPartyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

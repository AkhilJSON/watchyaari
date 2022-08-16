import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPartyAreaComponent } from './new-party-area.component';

describe('NewPartyAreaComponent', () => {
  let component: NewPartyAreaComponent;
  let fixture: ComponentFixture<NewPartyAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewPartyAreaComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPartyAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

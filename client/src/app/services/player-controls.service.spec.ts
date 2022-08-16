import { TestBed } from '@angular/core/testing';

import { PlayerControlsService } from './player-controls.service';

describe('PlayerControlsService', () => {
  let service: PlayerControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

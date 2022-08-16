import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private isUserLoggedInSubject = new BehaviorSubject<any>(null);
  private partDetailsSubject = new BehaviorSubject<any>(null);
  private youtubePlayerSubject = new BehaviorSubject<any>(null);
  private fullScreenSubject = new BehaviorSubject<any>(null);
  private userProfileSubject = new BehaviorSubject<any>(null);

  isUserLoggedIn = this.isUserLoggedInSubject.asObservable();
  setIsUserLoggedIn(obj?: any) {
    this.isUserLoggedInSubject.next(obj);
  }

  partyDetails = this.partDetailsSubject.asObservable();
  setPartyDetails(obj?: any) {
    this.partDetailsSubject.next(obj);
  }

  youtubePlayer = this.youtubePlayerSubject.asObservable();
  setYoutubePlayer(obj?: any) {
    this.youtubePlayerSubject.next(obj);
  }

  fullScreenMode = this.fullScreenSubject.asObservable();
  setFullScreenMode(obj?: any) {
    this.fullScreenSubject.next(obj);
  }

  loggedInUserProfile = this.userProfileSubject.asObservable();
  setLoggedInUserProfile(obj?: any) {
    this.userProfileSubject.next(obj);
  }
}

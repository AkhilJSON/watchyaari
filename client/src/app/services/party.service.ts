import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, startWith } from 'rxjs/operators';
import { empty } from 'rxjs';

import { environment } from '../../environments/environment';
import { MediaPlayerConstants } from '../common/media-player-constants';

@Injectable({
  providedIn: 'root',
})
export class PartyService {
  constructor(private http: HttpClient) {}

  validateURL(url: any, source: any) {
    switch (source) {
      case MediaPlayerConstants.TYPE.YOUTUBE:
        let regExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(\?\S*)?$/;
        return regExp.test(url);
    }
  }

  getVideoId(searhValue: any) {
    let videoURL = searhValue;
    let domain = 'YOUTUBE';
    switch (domain) {
      default:
        if (videoURL.length) {
          videoURL = new URL(videoURL);
          if (videoURL.hostname == 'youtu.be') {
            let { pathname } = videoURL;
            pathname = pathname.slice(1, pathname.length);
            if (pathname) {
              return pathname;
            }
          } else if (videoURL.hostname == 'www.youtube.com') {
            if (videoURL && videoURL.search) {
              videoURL = new URLSearchParams(videoURL.search).get('v');
              if (videoURL) {
                return videoURL;
              }
            }
          }
        }
        return '';
        break;
    }
  }

  launchParty(body: any) {
    return this.http.post(environment.common + 'launchParty', body);
  }

  getPartyDetails(body: any) {
    return this.http.post(environment.common + 'getPartyDetails', body);
  }

  getUserDetails(body: any) {
    return this.http.post(environment.common + 'getUserDetails', body);
  }

  joinParty(body: any) {
    return this.http.post(environment.common + 'joinParty', body);
  }

  getRecentPartyList(body: any) {
    return this.http.post(environment.common + 'getRPrtyList', body);
  }

  getUpcomingPartyList(body: any) {
    return this.http.post(environment.common + 'getUPrtyList', body);
  }

  fetchUsers(body: any): any {
    if (!body.search) {
      return empty();
    }
    return this.http.post(environment.common + 'fetchUsrs', body);
  }

  fetchBlockedUsers(body: any) {
    return this.http.post(environment.common + 'fetchBlckdUsrs', body);
  }

  unBlockUsers(body: any) {
    return this.http.post(environment.common + 'unBlckUsrs', body);
  }

  updateCoHosts(body: any) {
    return this.http.post(environment.common + 'updCohs', body);
  }

  searchVideos(body: any) {
    return this.http.post(environment.common + 'serchVids', body);
  }

  trendingVideos(body: any) {
    return this.http.post(environment.common + 'trendVids', body);
  }
  updateVideoInTheParty(body: any) {
    return this.http.post(environment.common + 'updateVideoInTheParty', body);
  }

  inviteGuestsInTheParty(body: any) {
    return this.http.post(environment.common + 'inviteGuestsInTheParty', body);
  }

  togglePartyPrivacy(body: any) {
    return this.http.post(environment.common + 'tglePrtPrvcy', body);
  }

  getFeedbackQuestions(body: any) {
    return this.http.post(
      environment.baseURL + 'secure/admin/getFeedbackQuestions',
      body
    );
  }

  submitFeedbackResponse(body: any) {
    return this.http.post(environment.common + 'submitFeedbackResponse', body);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private http: HttpClient) {}

  getChatHistory(body: any) {
    return this.http.post(environment.common + 'getChatHistory', body);
  }
}

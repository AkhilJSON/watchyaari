import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-party-feedback',
  templateUrl: './party-feedback.component.html',
  styleUrls: ['./party-feedback.component.css'],
})
export class PartyFeedbackComponent implements OnInit {
  @Input() feedbackQuestions: any = [];
  @Output() onFeedbackChange = new EventEmitter<{ feedbackResponse: any }>();

  currentHighlightedQuestion: any = -1;

  flexWeight = 100;

  constructor() {}

  ngOnInit(): void {
    if (this.feedbackQuestions && this.feedbackQuestions.length > 0) {
      this.flexWeight = 100 / this.feedbackQuestions.length;
    }
  }

  triggerChangeInResponse() {
    let response = _.map(this.feedbackQuestions, (question: any) => {
      return {
        questonId: question._id,
        response: question.response,
      };
    });
    this.onFeedbackChange.emit({ feedbackResponse: response });
  }
}

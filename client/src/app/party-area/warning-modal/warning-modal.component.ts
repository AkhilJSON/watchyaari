import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';

import { Subscription } from 'rxjs';

export interface WarningModalData {
  message: any;
  actionText: any;
  actionColor: any;
  feedbackQuestions: any;
}

@Component({
  selector: 'app-warning-modal',
  templateUrl: './warning-modal.component.html',
  styleUrls: ['./warning-modal.component.css'],
})
export class WarningModalComponent implements OnInit, OnDestroy {
  subscription: any = new Subscription();
  showFeedback: boolean = false;

  feedbackResponse: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public modalData: WarningModalData,
    public dialogRef: MatDialogRef<WarningModalComponent>
  ) {}

  ngOnInit(): void {}

  ok() {
    this.dialogRef.close({
      yes: true,
      feedbackResponse: this.feedbackResponse,
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  feedbackChange(event: any) {
    if (event && event.feedbackResponse) {
      this.feedbackResponse = event.feedbackResponse;
    }
  }
}

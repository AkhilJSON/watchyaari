import {
  Component,
  Input,
  OnDestroy,
  Inject,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div class="preloader">
    <div class="spinner">
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    </div>
  </div>`,
  styleUrls: ['./spinner.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SpinnerComponent {
  @Input() public backgroundColor = 'rgba(0, 115, 170, 0.69)';

  constructor() {}
}

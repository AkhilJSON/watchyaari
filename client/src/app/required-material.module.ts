import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRippleModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { AvatarModule } from 'ngx-avatar';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRadioModule } from '@angular/material/radio';

import { NoDataFoundComponent } from './common/no-data-found/no-data-found.component';
import { AvatarComponent } from './common/avatar/avatar.component';

import { SecondsToTimeStringPipe } from './pipes/seconds-to-time-string.pipe';
import { MomentPipe } from './pipes/moment.pipe';
import { ControlTextPipe } from './pipes/control-text.pipe';

@NgModule({
  imports: [CommonModule, FlexLayoutModule],
  declarations: [
    NoDataFoundComponent,
    AvatarComponent,

    SecondsToTimeStringPipe,
    MomentPipe,
    ControlTextPipe,
  ],
  exports: [
    CommonModule,

    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatRippleModule,
    MatListModule,
    MatGridListModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSliderModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTabsModule,
    MatSidenavModule,
    FlexLayoutModule,
    FormsModule,
    AvatarModule,
    ClipboardModule,
    MatSelectModule,
    MatBadgeModule,
    MatRadioModule,

    NoDataFoundComponent,
    AvatarComponent,

    SecondsToTimeStringPipe,
    MomentPipe,
    ControlTextPipe,
  ],
})
export class RequiredMaterialModule {}

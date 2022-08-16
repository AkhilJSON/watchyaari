import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CustomValidator } from '../../common/custom-validator';
import { ProfileService } from '../profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginAuthService } from 'src/app/services/login-auth.service';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  public profileForm: FormGroup;
  public passwordForm: FormGroup;

  dataLoading: any = false;
  updatingData: any = false;

  sendingVerificationRequest: any = false;

  isPasword: any = true;
  isConfirmPassword: any = true;

  passwordsDidNotMatch: any = false;

  profileData: any;

  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    private ls: LoginAuthService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private ss: SharedService
  ) {
    this.profileForm = this.fb.group({
      email: [
        null,
        Validators.compose([Validators.required, Validators.email]),
      ],
      fullName: [null, Validators.compose([Validators.required])],
    });
    this.passwordForm = this.fb.group({
      password: [
        '',
        Validators.compose([
          Validators.required,
          CustomValidator.passwordValidator,
        ]),
      ],
      confirmPassword: [
        '',
        Validators.compose([
          Validators.required,
          CustomValidator.passwordValidator,
        ]),
      ],
    });
  }

  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile() {
    this.dataLoading = true;
    this.profile.fetchProfile().subscribe((response: any) => {
      this.dataLoading = false;
      if (response.Success) {
        let profile = response.data;
        this.profileData = profile;
        this.profileForm.controls.email.setValue(profile.email);
        this.profileForm.controls.fullName.setValue(profile.fullName);
      }
    });
  }

  verifyMyEmail() {
    this.sendingVerificationRequest = true;
    this.profile.verifyMyEmail().subscribe((response: any) => {
      this.sendingVerificationRequest = false;
      if (response.Success) {
        this.profileData.emailVerificationSent = true;
      }
    });
  }

  updateProfile() {
    this.updatingData = true;
    console.log('this.profileForm.value::', this.profileForm.value);
    this.profile
      .updateProfile(this.profileForm.value)
      .subscribe((response: any) => {
        this.updatingData = false;
        if (response.Success) {
          this.profileData.fullName = this.profileForm.value.fullName;
          this.ss.setLoggedInUserProfile(this.profileData);
          this.openSnackBar(`Updated successfully...`, '', 'bottom', 'center');
        }
      });
  }

  updatePassword() {
    let data = this.passwordForm.value;
    if (data.password !== data.confirmPassword) {
      this.passwordsDidNotMatch = true;
      return;
    }
    delete data.confirmPassword;
    this.updatingData = true;
    this.profile.updateProfile(data).subscribe((response: any) => {
      this.updatingData = false;
      if (response.Success) {
        this.openSnackBar(
          `Password Changed successfully, Please Login again`,
          '',
          'bottom',
          'center'
        );

        setTimeout(() => {
          this.ls.logout();
        }, 1000);
      }
    });
  }

  openSnackBar(
    message: any,
    action: any,
    verticalPosition?: any,
    horizontalPosition?: any
  ) {
    this._snackBar.open(message, action || 'close', {
      duration: 2000,
      verticalPosition: verticalPosition || 'bottom',
      horizontalPosition: horizontalPosition || 'right',
    });
  }
}

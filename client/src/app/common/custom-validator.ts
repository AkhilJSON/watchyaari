export class CustomValidator {
  // Validates URL
  static partyURLValidator(url): any {
    if (url.pristine) {
      return null;
    }
    const URL_REGEXP = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/;
    url.markAsTouched();
    console.log(
      '##',
      url.value.indexOf('/partyArea/'),
      URL_REGEXP.test(url.value)
    );
    /* if(url.value.indexOf('/partyArea/') == -1){
         return {
            invalidUrl: true
         };
      } */
    if (URL_REGEXP.test(url.value)) {
      return null;
    }
    return {
      invalidUrl: true,
    };
  }

  //Validates Password

  static passwordValidator(password): any {
    if (password.pristine) {
      return null;
    }
    const PASS_REGEXP = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    password.markAsTouched();
    if (PASS_REGEXP.test(password.value)) {
      return null;
    }
    return {
      invalidPass: true,
    };
  }

  //Validates empty string

  static nonEmpty(string: any): any {
    if (string.value && string.value.trim().length) {
      return null;
    }

    return {
      empty: true,
    };
  }

  // Validates URL
  static urlValidator(url): any {
    if (url.pristine) {
      return null;
    }
    const URL_REGEXP = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/;
    url.markAsTouched();
    if (URL_REGEXP.test(url.value)) {
      return null;
    }
    return {
      invalidUrl: true,
    };
  }
  // Validates passwords
  static matchPassword(group): any {
    const password = group.controls.password;
    const confirm = group.controls.confirm;
    if (password.pristine || confirm.pristine) {
      return null;
    }
    group.markAsTouched();
    if (password.value === confirm.value) {
      return null;
    }
    return {
      invalidPassword: true,
    };
  }
  // Validates numbers
  static numberValidator(number): any {
    if (number.pristine) {
      return null;
    }
    const NUMBER_REGEXP = /^-?[\d.]+(?:e-?\d+)?$/;
    number.markAsTouched();
    if (NUMBER_REGEXP.test(number.value)) {
      return null;
    }
    return {
      invalidNumber: true,
    };
  }
  // Validates US SSN
  static ssnValidator(ssn): any {
    if (ssn.pristine) {
      return null;
    }
    const SSN_REGEXP = /^(?!219-09-9999|078-05-1120)(?!666|000|9\d{2})\d{3}-(?!00)\d{2}-(?!0{4})\d{4}$/;
    ssn.markAsTouched();
    if (SSN_REGEXP.test(ssn.value)) {
      return null;
    }
    return {
      invalidSsn: true,
    };
  }
  // Validates US phone numbers
  static phoneValidator(number): any {
    if (number.pristine) {
      return null;
    }
    const PHONE_REGEXP = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/;
    number.markAsTouched();
    if (PHONE_REGEXP.test(number.value)) {
      return null;
    }
    return {
      invalidNumber: true,
    };
  }
  // Validates zip codes
  static zipCodeValidator(zip): any {
    if (zip.pristine) {
      return null;
    }
    const ZIP_REGEXP = /^[0-9]{5}(?:-[0-9]{4})?$/;
    zip.markAsTouched();
    if (ZIP_REGEXP.test(zip.value)) {
      return null;
    }
    return {
      invalidZip: true,
    };
  }
}

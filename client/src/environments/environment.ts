// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseURL: 'http://localhost:3000/',
  common: 'http://localhost:3000/common/',
  defaultSocketConnection: 'http://localhost:3000',
  mediaStreamConstraints: {
    firefox: {
      video: {
        width: 400,
        height: 240,
      },
      audio: true,
    },
    chrome: {
      video: {
        width: {
          min: 314,
          max: 314,
        },
        height: {
          min: 240,
          max: 240,
        },
      },
      audio: true,
    },
  },
  pageMetadata: {
    default: {
      title: `WatchYaari | Watch Videos With Your Yaari`,
      description: `Create your own theater and watch videos seamlessly with friends. Have jolly time with friends and productive discussions on videos available online.`,
      url: `https://watchyaari.com`,
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.

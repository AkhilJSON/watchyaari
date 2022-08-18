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
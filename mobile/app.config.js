require('dotenv').config();

const appJson = require('./app.json');

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
if (!projectId) {
  throw new Error('Missing EXPO_PUBLIC_EAS_PROJECT_ID in environment/.env');
}
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!googleMapsApiKey) {
  throw new Error('Missing GOOGLE_MAPS_API_KEY in environment/.env');
}

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...(appJson.expo.android || {}),
      googleServicesFile: './google-services.json',
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...(appJson.expo.ios || {}),
      bundleIdentifier: 'com.anonymous.mobile',
    },
    extra: {
      ...(appJson.expo.extra || {}),
      eas: {
        projectId,
      },
    },
  },
};
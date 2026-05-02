require('dotenv').config();
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

// Handle google-services.json for EAS Cloud builds
if (process.env.GOOGLE_SERVICES_JSON && !fs.existsSync('./google-services.json')) {
  fs.writeFileSync('./google-services.json', process.env.GOOGLE_SERVICES_JSON);
}

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
if (!projectId && !process.env.EAS_BUILD) {
  throw new Error('Missing EXPO_PUBLIC_EAS_PROJECT_ID in environment/.env');
}

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!googleMapsApiKey && !process.env.EAS_BUILD) {
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
        projectId: projectId || "f28e9edd-ef28-4975-b051-4c3c0930125c",
      },
    },
  },
};
// expo.config.js
// This file is required to properly load environment variables in Expo

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      // Make environment variables available to the app
      EXPO_PUBLIC_HUBSPOT_TOKEN: process.env.EXPO_PUBLIC_HUBSPOT_TOKEN,
      EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      // Add any other environment variables you need
      eas: {
        projectId: "your-project-id" // Replace with your actual EAS project ID if using EAS
      }
    }
  };
};
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pitchpredict.app',
  appName: 'Pitch Predict',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['*.onrender.com'],
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pikol.legends',
  appName: 'Pikol Legends',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07080c'
    },
    SplashScreen: {
      backgroundColor: '#07080c',
      launchShowDuration: 2000,
      showSpinner: false
    }
  }
};

export default config;

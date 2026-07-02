import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drogueriepro.app',
  appName: 'DrogueriePro',
  webDir: 'dist',
  server: {
    url: 'https://YOUR-VERCEL-LINK.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
};

export default config;

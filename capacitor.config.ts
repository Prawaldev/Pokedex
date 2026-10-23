import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pokedex.app',
  appName: 'Pokedex',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

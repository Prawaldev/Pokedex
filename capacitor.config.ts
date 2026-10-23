import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prawaldev.pokedex',
  appName: 'Pokédex',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

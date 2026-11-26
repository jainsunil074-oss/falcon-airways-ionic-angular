import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.falconairways.app',
  appName: 'Falcon Airways',
  // Angular's application builder writes the browser bundle to www/browser.
  webDir: 'www/browser',
  server: {
    // Serve the app from https:// so Web Crypto, secure cookies and
    // postMessage origin checks behave the same as on the web.
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  android: {
    // Never allow mixed http content inside the Capacitor WebView.
    allowMixedContent: false,
    // Enable chrome://inspect only for debug builds (set by the build type in CI).
    webContentsDebuggingEnabled: false,
  },
  ios: {
    // WKWebView: let content flow under the notch; Ionic handles safe areas.
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;

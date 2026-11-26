/**
 * Runtime configuration. In a real project this file is swapped per
 * environment (dev / uat / prod) through angular.json fileReplacements.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
  /** Mock backend interceptor answers /api/* locally so the demo runs offline. */
  useMockBackend: true,
  /**
   * Origins that hosted web modules (payment, check-in, offers) may be loaded from.
   * The bridge rejects messages from any other origin.
   */
  trustedWebOrigins: ['self', 'https://pay.falconairways.example', 'https://checkin.falconairways.example'],
  /** Hosts the in-app / native WebView is allowed to navigate to. */
  allowedWebHosts: ['localhost', 'falconairways.example', 'pay.falconairways.example', 'checkin.falconairways.example'],
  flightStatusPollMs: 5000,
};

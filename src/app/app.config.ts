import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  PreloadAllModules,
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app.routes';
import { apiHeadersInterceptor } from './core/interceptors/api-headers.interceptor';
import { mockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { SettingsService } from './core/settings/settings.service';
import { registerAppIcons } from './shared/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // iOS look on both platforms; icon-only back button so it never shows an untranslated label.
    provideIonicAngular({ mode: 'ios', backButtonText: '' }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Feature areas are lazy loaded; preloading warms them after first paint.
    // Route params (e.g. :pnr) bind straight to component inputs.
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiHeadersInterceptor, mockBackendInterceptor])),
    provideAppInitializer(() => {
      registerAppIcons();
      // Restore language (LTR/RTL) and theme before the first screen renders.
      return inject(SettingsService).restore();
    }),
  ],
};

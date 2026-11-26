import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

/**
 * Adds headers every API call needs: language for localised content and a
 * correlation id so mobile requests can be traced end-to-end in observability tools.
 */
export const apiHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  const settings = inject(SettingsService);
  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': settings.language(),
        'X-Correlation-Id': crypto.randomUUID(),
        'X-Client': 'falcon-hybrid-app',
      },
    }),
  );
};

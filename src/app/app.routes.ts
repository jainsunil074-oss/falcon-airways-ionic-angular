import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/tabs/tabs.routes').then((m) => m.TABS_ROUTES),
  },
  {
    path: 'booking',
    loadChildren: () => import('./features/booking/booking.routes').then((m) => m.BOOKING_ROUTES),
  },
  {
    path: 'check-in/:pnr',
    loadComponent: () =>
      import('./features/check-in/check-in.page').then((m) => m.CheckInPage),
  },
  {
    path: 'trips/:pnr',
    loadComponent: () =>
      import('./features/trips/trip-detail.page').then((m) => m.TripDetailPage),
  },
  {
    path: 'assistant',
    loadComponent: () =>
      import('./features/assistant/assistant.page').then((m) => m.AssistantPage),
  },
  {
    path: 'hybrid-lab',
    loadComponent: () =>
      import('./features/hybrid-lab/hybrid-lab.page').then((m) => m.HybridLabPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];

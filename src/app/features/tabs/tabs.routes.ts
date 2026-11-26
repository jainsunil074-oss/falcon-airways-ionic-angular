import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const TABS_ROUTES: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      { path: 'home', loadComponent: () => import('../home/home.page').then((m) => m.HomePage) },
      { path: 'book', loadChildren: () => import('../flights/flights.routes').then((m) => m.FLIGHTS_ROUTES) },
      { path: 'trips', loadComponent: () => import('../trips/trips.page').then((m) => m.TripsPage) },
      { path: 'status', loadComponent: () => import('../flight-status/flight-status.page').then((m) => m.FlightStatusPage) },
      { path: 'more', loadComponent: () => import('../more/more.page').then((m) => m.MorePage) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
];

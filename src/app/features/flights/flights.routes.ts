import { Routes } from '@angular/router';

export const FLIGHTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./search/flight-search.page').then((m) => m.FlightSearchPage) },
  { path: 'results', loadComponent: () => import('./results/flight-results.page').then((m) => m.FlightResultsPage) },
];

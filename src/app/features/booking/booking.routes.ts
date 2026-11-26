import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { BookingFlowStore } from '../../core/state/booking-flow.store';

/** Funnel guard: you can't reach passengers/payment without a selected flight. */
const flightSelected: CanActivateFn = () =>
  inject(BookingFlowStore).flight() ? true : inject(Router).parseUrl('/tabs/book');

const readyToPay: CanActivateFn = () =>
  inject(BookingFlowStore).canPay() ? true : inject(Router).parseUrl('/booking/passengers');

export const BOOKING_ROUTES: Routes = [
  {
    path: 'passengers',
    canActivate: [flightSelected],
    loadComponent: () => import('./passengers/passengers.page').then((m) => m.PassengersPage),
  },
  {
    path: 'payment',
    canActivate: [flightSelected, readyToPay],
    loadComponent: () => import('./payment/payment.page').then((m) => m.PaymentPage),
  },
  { path: '', redirectTo: 'passengers', pathMatch: 'full' },
];

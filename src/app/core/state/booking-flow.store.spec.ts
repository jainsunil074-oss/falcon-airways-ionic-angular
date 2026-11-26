import { TestBed } from '@angular/core/testing';
import { Flight } from '../models/flight.model';
import { BookingFlowStore } from './booking-flow.store';

const flight = { id: 'f1', price: 1000, currency: 'AED' } as Flight;
const passenger = {
  title: 'Mr' as const,
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'a@b.com',
  phone: '+971500000000',
  passportNumber: 'N1234567',
};

describe('BookingFlowStore', () => {
  let store: BookingFlowStore;

  beforeEach(() => {
    store = TestBed.inject(BookingFlowStore);
    store.setQuery({ from: 'AUH', to: 'LHR', date: '2026-12-01', passengers: 2, cabin: 'economy' });
  });

  it('computes the total from price × passengers', () => {
    store.selectFlight(flight);
    expect(store.total()).toBe(2000);
  });

  it('can only pay once every passenger is entered', () => {
    store.selectFlight(flight);
    store.setPassengers([passenger]);
    expect(store.canPay()).toBe(false);
    store.setPassengers([passenger, passenger]);
    expect(store.canPay()).toBe(true);
  });

  it('a new search clears the previous selection', () => {
    store.selectFlight(flight);
    store.setQuery({ from: 'AUH', to: 'CDG', date: '2026-12-02', passengers: 1, cabin: 'business' });
    expect(store.flight()).toBeNull();
  });
});

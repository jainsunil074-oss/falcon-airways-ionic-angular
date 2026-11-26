import { Injectable, computed, signal } from '@angular/core';
import { Booking, Passenger } from '../models/booking.model';
import { Flight, FlightSearchQuery } from '../models/flight.model';

/**
 * Signal-based store for the in-progress booking funnel
 * (search → select flight → passengers → payment).
 * Feature pages read signals; only the store mutates them.
 */
@Injectable({ providedIn: 'root' })
export class BookingFlowStore {
  private readonly _query = signal<FlightSearchQuery | null>(null);
  private readonly _flight = signal<Flight | null>(null);
  private readonly _passengers = signal<Passenger[]>([]);
  private readonly _booking = signal<Booking | null>(null);

  readonly query = this._query.asReadonly();
  readonly flight = this._flight.asReadonly();
  readonly passengers = this._passengers.asReadonly();
  readonly booking = this._booking.asReadonly();

  readonly passengerCount = computed(() => this._query()?.passengers ?? 1);
  readonly total = computed(() => (this._flight()?.price ?? 0) * this.passengerCount());
  readonly canPay = computed(
    () => !!this._flight() && this._passengers().length === this.passengerCount(),
  );

  setQuery(query: FlightSearchQuery): void {
    this._query.set(query);
    this._flight.set(null);
    this._passengers.set([]);
    this._booking.set(null);
  }

  selectFlight(flight: Flight): void {
    this._flight.set(flight);
  }

  setPassengers(passengers: Passenger[]): void {
    this._passengers.set(passengers);
  }

  setBooking(booking: Booking): void {
    this._booking.set(booking);
  }

  reset(): void {
    this._query.set(null);
    this._flight.set(null);
    this._passengers.set([]);
    this._booking.set(null);
  }
}

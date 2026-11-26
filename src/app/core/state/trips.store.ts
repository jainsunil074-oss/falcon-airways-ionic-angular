import { Injectable, computed, inject, signal } from '@angular/core';
import { findAirport } from '../data/airports';
import { Booking } from '../models/booking.model';
import { StorageService } from '../storage/storage.service';

const KEY = 'trips';

/**
 * Offline-first trips: bookings are persisted on device, so "My Trips" and the
 * boarding pass still open with no network (a common airline requirement).
 */
@Injectable({ providedIn: 'root' })
export class TripsStore {
  private readonly storage = inject(StorageService);
  private readonly _trips = signal<Booking[]>([]);
  private loaded = false;

  readonly trips = this._trips.asReadonly();
  readonly upcoming = computed(() =>
    [...this._trips()].sort((a, b) => a.flight.departure.localeCompare(b.flight.departure)),
  );

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    const saved = await this.storage.get<Booking[]>(KEY, []);
    this._trips.set(saved.length ? saved : [demoTrip()]);
    this.loaded = true;
  }

  find(pnr: string): Booking | undefined {
    return this._trips().find((t) => t.pnr === pnr);
  }

  async upsert(booking: Booking): Promise<void> {
    await this.load();
    const others = this._trips().filter((t) => t.pnr !== booking.pnr);
    this._trips.set([booking, ...others]);
    await this.storage.set(KEY, this._trips());
  }

  async markCheckedIn(pnr: string, seat: string): Promise<void> {
    const trip = this.find(pnr);
    if (trip) {
      await this.upsert({ ...trip, checkedIn: true, seat });
    }
  }

  async clear(): Promise<void> {
    await this.storage.remove(KEY);
    this.loaded = false;
    this._trips.set([]);
  }
}

/** Seed trip so the Trips tab and boarding pass have something to show on first run. */
function demoTrip(): Booking {
  const departure = new Date(Date.now() + 2 * 24 * 3600_000);
  departure.setHours(9, 40, 0, 0);
  const arrival = new Date(departure.getTime() + 470 * 60_000);
  return {
    pnr: 'FX7K2Q',
    flight: {
      id: 'demo',
      flightNumber: 'FA211',
      from: findAirport('AUH')!,
      to: findAirport('LHR')!,
      departure: departure.toISOString(),
      arrival: arrival.toISOString(),
      durationMinutes: 470,
      aircraft: 'Boeing 787-10',
      cabin: 'economy',
      price: 2450,
      currency: 'AED',
      seatsLeft: 4,
      stops: 0,
    },
    passengers: [
      {
        title: 'Mr',
        firstName: 'Alex',
        lastName: 'Morgan',
        email: 'demo@example.com',
        phone: '+971500000000',
        passportNumber: 'X0000000',
      },
    ],
    totalAmount: 2450,
    currency: 'AED',
    paymentStatus: 'paid',
    checkedIn: false,
    createdAt: new Date().toISOString(),
  };
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, Passenger } from '../models/booking.model';
import { Flight } from '../models/flight.model';

export interface PaymentSession {
  sessionId: string;
  url: string;
  pnr: string;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  create(flight: Flight, passengers: Passenger[]): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, {
      flight,
      passengers,
      totalAmount: flight.price * passengers.length,
      currency: flight.currency,
    });
  }

  createPaymentSession(pnr: string, amount: number): Observable<PaymentSession> {
    return this.http.post<PaymentSession>(`${this.base}/payments/session`, { pnr, amount });
  }
}

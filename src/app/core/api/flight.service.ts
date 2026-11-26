import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, distinctUntilChanged, shareReplay, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Flight, FlightSearchQuery, FlightStatus } from '../models/flight.model';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  search(query: FlightSearchQuery): Observable<Flight[]> {
    const params = new HttpParams({ fromObject: { ...query, passengers: query.passengers } });
    return this.http.get<Flight[]>(`${this.base}/flights`, { params });
  }

  status(flightNumber: string): Observable<FlightStatus> {
    return this.http.get<FlightStatus>(`${this.base}/flight-status/${flightNumber.toUpperCase()}`);
  }

  /**
   * Live status via polling. switchMap cancels an in-flight request when the
   * next tick fires; shareReplay lets several widgets share one poll.
   */
  watchStatus(flightNumber: string, intervalMs = environment.flightStatusPollMs): Observable<FlightStatus> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.status(flightNumber)),
      distinctUntilChanged((a, b) => a.status === b.status && a.estimatedDeparture === b.estimatedDeparture && a.progress === b.progress),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}

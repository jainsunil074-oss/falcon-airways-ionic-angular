import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AIRPORTS, findAirport } from '../data/airports';
import { Booking } from '../models/booking.model';
import { CabinClass, Flight, FlightStatus, FlightStatusCode } from '../models/flight.model';

/**
 * Fake backend so the demo runs with no server. Swap `useMockBackend` off and
 * the same services talk to a real API, which is the point of keeping HTTP
 * calls in services and faking at the interceptor layer.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockBackend || !req.url.startsWith('/api/')) {
    return next(req);
  }
  const path = req.url.replace(/^\/api\//, '');
  try {
    const body = route(req, path);
    return of(new HttpResponse({ status: 200, body })).pipe(delay(400 + Math.random() * 400));
  } catch (e) {
    const status = e instanceof MockHttpError ? e.status : 500;
    return throwError(
      () => new HttpErrorResponse({ status, statusText: String(e), url: req.url }),
    ).pipe(delay(300));
  }
};

class MockHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function route(req: HttpRequest<unknown>, path: string): unknown {
  if (req.method === 'GET' && path === 'flights') {
    const p = req.params;
    return searchFlights(
      p.get('from') ?? 'AUH',
      p.get('to') ?? 'LHR',
      p.get('date') ?? new Date().toISOString().slice(0, 10),
      (p.get('cabin') as CabinClass) ?? 'economy',
    );
  }
  const status = path.match(/^flight-status\/([A-Z0-9]+)$/);
  if (req.method === 'GET' && status) {
    return flightStatus(status[1]);
  }
  if (req.method === 'POST' && path === 'bookings') {
    const draft = req.body as Omit<Booking, 'pnr' | 'createdAt' | 'paymentStatus' | 'checkedIn'>;
    const booking: Booking = {
      ...draft,
      pnr: makePnr(),
      paymentStatus: 'pending',
      checkedIn: false,
      createdAt: new Date().toISOString(),
    };
    return booking;
  }
  if (req.method === 'POST' && path === 'payments/session') {
    const { pnr, amount } = req.body as { pnr: string; amount: number };
    // A real PSP returns a one-time hosted payment page URL.
    return { sessionId: crypto.randomUUID(), url: 'web/payment.html', pnr, amount };
  }
  throw new MockHttpError(404, `No mock for ${req.method} ${path}`);
}

// ---------- data generators (deterministic per query) ----------

function seeded(seedText: string): () => number {
  let h = 2166136261;
  for (const ch of seedText) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const AIRCRAFT = ['Boeing 787-9', 'Boeing 787-10', 'Airbus A350-1000', 'Airbus A321LR', 'Boeing 777-300ER'];
const CABIN_MULTIPLIER: Record<CabinClass, number> = { economy: 1, business: 3.4, first: 6.5 };

function searchFlights(from: string, to: string, date: string, cabin: CabinClass): Flight[] {
  const origin = findAirport(from);
  const dest = findAirport(to);
  if (!origin || !dest || from === to) {
    throw new MockHttpError(400, 'Invalid route');
  }
  const rand = seeded(`${from}-${to}-${date}`);
  const baseDuration = 120 + Math.floor(rand() * 720);
  const count = 4 + Math.floor(rand() * 3);
  return Array.from({ length: count }, (_, i) => {
    const departHour = 1 + Math.floor((i * 23) / count + rand() * 2);
    const departure = new Date(`${date}T00:00:00`);
    departure.setHours(departHour, Math.floor(rand() * 4) * 15);
    const stops = rand() > 0.75 ? 1 : 0;
    const duration = baseDuration + stops * 150 + Math.floor(rand() * 40);
    const arrival = new Date(departure.getTime() + duration * 60_000);
    const base = 600 + baseDuration * 3.2 + rand() * 900 - stops * 250;
    return {
      id: `${from}${to}${date}${i}`,
      flightNumber: `FA${100 + Math.floor(rand() * 800)}`,
      from: origin,
      to: dest,
      departure: departure.toISOString(),
      arrival: arrival.toISOString(),
      durationMinutes: duration,
      aircraft: AIRCRAFT[Math.floor(rand() * AIRCRAFT.length)],
      cabin,
      price: Math.round((base * CABIN_MULTIPLIER[cabin]) / 5) * 5,
      currency: 'AED' as const,
      seatsLeft: 1 + Math.floor(rand() * 9),
      stops,
    };
  }).sort((a, b) => a.departure.localeCompare(b.departure));
}

/** Keep the seeded demo trip consistent with its live status. */
const KNOWN_ROUTES: Record<string, string> = { FA211: 'LHR' };

const STATUS_SEQUENCE: FlightStatusCode[] = ['scheduled', 'boarding', 'departed', 'in-air', 'in-air', 'landed'];

function flightStatus(flightNumber: string): FlightStatus {
  const rand = seeded(flightNumber);
  const dest =
    findAirport(KNOWN_ROUTES[flightNumber] ?? '') ??
    AIRPORTS[1 + Math.floor(rand() * (AIRPORTS.length - 1))];
  // Status advances every 30s so polling visibly updates during a demo.
  const step = Math.floor(Date.now() / 30_000) % STATUS_SEQUENCE.length;
  const delayed = rand() > 0.8 && step === 0;
  const scheduled = new Date();
  scheduled.setMinutes(0, 0, 0);
  const estimated = new Date(scheduled.getTime() + (delayed ? 45 : 0) * 60_000);
  return {
    flightNumber,
    route: `AUH → ${dest.code}`,
    status: delayed ? 'delayed' : STATUS_SEQUENCE[step],
    gate: `${'ABCDE'[Math.floor(rand() * 5)]}${1 + Math.floor(rand() * 40)}`,
    terminal: 'A',
    scheduledDeparture: scheduled.toISOString(),
    estimatedDeparture: estimated.toISOString(),
    progress: Math.min(1, Math.max(0, (step - 1) / (STATUS_SEQUENCE.length - 2))),
    updatedAt: new Date().toISOString(),
  };
}

function makePnr(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

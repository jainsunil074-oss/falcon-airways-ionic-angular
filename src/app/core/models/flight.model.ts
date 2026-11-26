export type CabinClass = 'economy' | 'business' | 'first';

export interface Airport {
  code: string;
  city: string;
  cityAr: string;
  country: string;
}

export interface FlightSearchQuery {
  from: string;
  to: string;
  date: string; // ISO yyyy-MM-dd
  passengers: number;
  cabin: CabinClass;
}

export interface Flight {
  id: string;
  flightNumber: string;
  from: Airport;
  to: Airport;
  departure: string; // ISO datetime
  arrival: string; // ISO datetime
  durationMinutes: number;
  aircraft: string;
  cabin: CabinClass;
  price: number;
  currency: 'AED';
  seatsLeft: number;
  stops: number;
}

export type FlightStatusCode = 'scheduled' | 'boarding' | 'departed' | 'in-air' | 'landed' | 'delayed';

export interface FlightStatus {
  flightNumber: string;
  route: string;
  status: FlightStatusCode;
  gate: string;
  terminal: string;
  scheduledDeparture: string;
  estimatedDeparture: string;
  progress: number; // 0..1 of the journey
  updatedAt: string;
}

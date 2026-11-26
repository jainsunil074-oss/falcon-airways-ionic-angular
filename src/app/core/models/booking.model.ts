import { Flight } from './flight.model';

export type PassengerTitle = 'Mr' | 'Ms' | 'Mrs' | 'Dr';

export interface Passenger {
  title: PassengerTitle;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Booking {
  pnr: string;
  flight: Flight;
  passengers: Passenger[];
  totalAmount: number;
  currency: 'AED';
  paymentStatus: PaymentStatus;
  checkedIn: boolean;
  seat?: string;
  createdAt: string;
}

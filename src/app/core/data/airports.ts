import { Airport } from '../models/flight.model';

/** Reference data used by the mock backend and the search form. */
export const AIRPORTS: readonly Airport[] = [
  { code: 'AUH', city: 'Abu Dhabi', cityAr: 'أبوظبي', country: 'AE' },
  { code: 'LHR', city: 'London', cityAr: 'لندن', country: 'GB' },
  { code: 'CDG', city: 'Paris', cityAr: 'باريس', country: 'FR' },
  { code: 'JFK', city: 'New York', cityAr: 'نيويورك', country: 'US' },
  { code: 'BOM', city: 'Mumbai', cityAr: 'مومباي', country: 'IN' },
  { code: 'DEL', city: 'Delhi', cityAr: 'دلهي', country: 'IN' },
  { code: 'SIN', city: 'Singapore', cityAr: 'سنغافورة', country: 'SG' },
  { code: 'NRT', city: 'Tokyo', cityAr: 'طوكيو', country: 'JP' },
  { code: 'SYD', city: 'Sydney', cityAr: 'سيدني', country: 'AU' },
  { code: 'CAI', city: 'Cairo', cityAr: 'القاهرة', country: 'EG' },
];

export const HUB = 'AUH';

export function findAirport(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code);
}

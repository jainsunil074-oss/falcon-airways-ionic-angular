import { InjectionToken, Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FlightService } from '../api/flight.service';
import { Language } from '../i18n/translations';
import { TripsStore } from '../state/trips.store';

export interface AssistantAction {
  label: string;
  route: string;
}

export interface AssistantReply {
  text: string;
  actions?: AssistantAction[];
}

/**
 * The assistant is behind an interface so the UI doesn't care what answers:
 * the on-device rule engine below (works offline, zero cost), or an LLM
 * provider that calls a backend endpoint which holds the API key and applies
 * guardrails. Swap via the ASSISTANT_PROVIDER token.
 */
export interface AssistantProvider {
  reply(message: string, language: Language): Promise<AssistantReply>;
}

export const ASSISTANT_PROVIDER = new InjectionToken<AssistantProvider>('ASSISTANT_PROVIDER', {
  providedIn: 'root',
  factory: () => inject(RuleBasedAssistant),
});

@Injectable({ providedIn: 'root' })
export class RuleBasedAssistant implements AssistantProvider {
  private readonly trips = inject(TripsStore);
  private readonly flights = inject(FlightService);

  async reply(message: string, lang: Language): Promise<AssistantReply> {
    const text = message.toLowerCase();
    const ar = lang === 'ar';

    const flightNo = message.toUpperCase().match(/\bFA\s?\d{2,4}\b/)?.[0].replace(/\s/, '');
    if (flightNo || /status|delay|gate|حالة|تأخ/.test(text)) {
      const no = flightNo ?? this.trips.upcoming()[0]?.flight.flightNumber ?? 'FA211';
      const s = await firstValueFrom(this.flights.status(no));
      return {
        text: ar
          ? `الرحلة ${s.flightNumber} (${s.route}): الحالة ${s.status}، البوابة ${s.gate}.`
          : `Flight ${s.flightNumber} (${s.route}) is ${s.status}. Gate ${s.gate}, terminal ${s.terminal}.`,
        actions: [{ label: ar ? 'تتبع مباشر' : 'Track live', route: '/tabs/status' }],
      };
    }
    if (/bag|luggage|kg|أمتع|حقيب/.test(text)) {
      return {
        text: ar
          ? 'السياحية: حقيبة واحدة 23 كجم + حقيبة يد 7 كجم. رجال الأعمال: حقيبتان 32 كجم. (بيانات تجريبية)'
          : 'Economy: 1 × 23 kg checked + 7 kg cabin bag. Business: 2 × 32 kg. (Demo policy data.)',
      };
    }
    if (/check.?in|seat|boarding pass|تسجيل|مقعد/.test(text)) {
      const trip = this.trips.upcoming().find((t) => !t.checkedIn);
      return {
        text: ar
          ? 'يفتح تسجيل الوصول عبر الإنترنت قبل 30 ساعة من المغادرة.'
          : 'Online check-in opens 30 hours before departure. You can pick your seat in the check-in web module.',
        actions: trip ? [{ label: ar ? `تسجيل الوصول ${trip.pnr}` : `Check in ${trip.pnr}`, route: `/check-in/${trip.pnr}` }] : [],
      };
    }
    if (/trip|booking|pnr|رحل|حجز/.test(text)) {
      const next = this.trips.upcoming()[0];
      return next
        ? {
            text: ar
              ? `رحلتك القادمة ${next.flight.flightNumber} من ${next.flight.from.code} إلى ${next.flight.to.code}.`
              : `Your next trip is ${next.flight.flightNumber} from ${next.flight.from.code} to ${next.flight.to.code} (PNR ${next.pnr}).`,
            actions: [{ label: ar ? 'عرض الرحلة' : 'View trip', route: `/trips/${next.pnr}` }],
          }
        : { text: ar ? 'لا توجد رحلات محفوظة.' : 'You have no saved trips yet.' };
    }
    if (/book|flight to|fly|احجز|طيران/.test(text)) {
      return {
        text: ar ? 'لنبحث عن رحلة.' : "Let's find you a flight.",
        actions: [{ label: ar ? 'ابحث عن رحلات' : 'Search flights', route: '/tabs/book' }],
      };
    }
    return {
      text: ar
        ? 'يمكنني المساعدة في الأمتعة وتسجيل الوصول وحالة الرحلة والحجوزات.'
        : 'I can help with baggage, check-in, flight status and bookings. Try "status of FA211".',
    };
  }
}

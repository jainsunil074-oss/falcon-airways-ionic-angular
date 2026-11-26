import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import QRCode from 'qrcode';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TripsStore } from '../../core/state/trips.store';
import { FlightCardComponent } from '../../shared/components/flight-card/flight-card.component';

@Component({
  selector: 'fa-trip-detail',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton, IonIcon,
    DatePipe, RouterLink, TranslatePipe, FlightCardComponent,
  ],
  templateUrl: './trip-detail.page.html',
  styleUrl: './trip-detail.page.scss',
})
export class TripDetailPage {
  /** Bound from the :pnr route param via withComponentInputBinding(). */
  // Not input.required: Ionic's outlet can read it before the router binds the :pnr param.
  readonly pnr = input('');

  private readonly trips = inject(TripsStore);
  protected readonly trip = computed(() => this.trips.trips().find((t) => t.pnr === this.pnr()));
  protected readonly qr = signal<string | null>(null);

  /** Boarding starts 40 minutes before departure. */
  protected readonly boardingTime = computed(() => {
    const t = this.trip();
    return t ? new Date(new Date(t.flight.departure).getTime() - 40 * 60_000) : null;
  });

  constructor() {
    void this.trips.load();
    effect(() => {
      const t = this.trip();
      if (t?.checkedIn) {
        // Simplified BCBP-style payload. Works offline: generated on device.
        const payload = `M1${t.passengers[0].lastName.toUpperCase()}/${t.passengers[0].firstName.toUpperCase()} ${t.pnr} ${t.flight.from.code}${t.flight.to.code}${t.flight.flightNumber} ${t.seat ?? ''}`;
        void QRCode.toDataURL(payload, { margin: 1, width: 220 }).then((url) => this.qr.set(url));
      }
    });
  }
}

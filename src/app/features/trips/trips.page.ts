import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBadge, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TripsStore } from '../../core/state/trips.store';
import { FlightCardComponent } from '../../shared/components/flight-card/flight-card.component';

@Component({
  selector: 'fa-trips',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonBadge, RouterLink, TranslatePipe, FlightCardComponent],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar><ion-title>{{ 'trips.title' | t }}</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="fa-surface">
      @for (trip of trips.upcoming(); track trip.pnr) {
        <div class="fa-section-title fa-row">
          <span>PNR {{ trip.pnr }}</span>
          <span class="fa-spacer"></span>
          @if (trip.checkedIn) {
            <ion-badge color="success">{{ 'trips.checkedIn' | t }}</ion-badge>
          }
        </div>
        <a [routerLink]="['/trips', trip.pnr]" class="link">
          <fa-flight-card [flight]="trip.flight" [showPrice]="false" />
        </a>
      } @empty {
        <p class="ion-padding ion-text-center fa-muted">{{ 'trips.empty' | t }}</p>
      }
    </ion-content>
  `,
  styles: `.link { text-decoration: none; }`,
})
export class TripsPage {
  protected readonly trips = inject(TripsStore);

  constructor() {
    void this.trips.load();
  }
}

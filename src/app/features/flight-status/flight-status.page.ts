import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonProgressBar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { FlightService } from '../../core/api/flight.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translations';
import { FlightStatusCode } from '../../core/models/flight.model';

const STATUS_COLOR: Record<FlightStatusCode, string> = {
  scheduled: 'medium',
  boarding: 'warning',
  departed: 'primary',
  'in-air': 'primary',
  landed: 'success',
  delayed: 'danger',
};

@Component({
  selector: 'fa-flight-status',
  imports: [
    FormsModule, DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton,
    IonCard, IonCardContent, IonBadge, IonProgressBar, TranslatePipe,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar><ion-title>{{ 'status.title' | t }}</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="fa-surface">
      <ion-list [inset]="true">
        <ion-item>
          <ion-input
            [(ngModel)]="query"
            [placeholder]="'status.placeholder' | t"
            autocapitalize="characters"
            (keyup.enter)="track()"
          />
          <ion-button slot="end" (click)="track()">{{ 'status.track' | t }}</ion-button>
        </ion-item>
      </ion-list>

      @if (status(); as s) {
        <ion-card class="fa-card">
          <ion-card-content>
            <div class="fa-row">
              <h2 class="flight">{{ s.flightNumber }}</h2>
              <span class="fa-spacer"></span>
              <ion-badge [color]="color(s.status)">{{ statusKey(s.status) | t }}</ion-badge>
            </div>
            <p class="route">{{ s.route }}</p>
            <ion-progress-bar [value]="s.progress" [color]="color(s.status)" />
            <div class="grid">
              <div><small>{{ 'trips.gate' | t }}</small>{{ s.gate }}</div>
              <div><small>Terminal</small>{{ s.terminal }}</div>
              <div><small>STD</small>{{ s.scheduledDeparture | date: 'HH:mm' }}</div>
              <div><small>ETD</small>{{ s.estimatedDeparture | date: 'HH:mm' }}</div>
            </div>
            <p class="fa-muted live">● {{ 'status.live' | t }} · {{ s.updatedAt | date: 'HH:mm:ss' }}</p>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: `
    .flight { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .route { margin: 4px 0 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; font-weight: 600; }
    small { display: block; font-size: 0.7rem; color: var(--ion-color-medium); font-weight: 400; }
    .live { margin-top: 12px; font-size: 0.75rem; }
  `,
})
export class FlightStatusPage {
  private readonly api = inject(FlightService);

  protected query = 'FA211';
  private readonly tracked = signal('FA211');

  /** Switching flights cancels the previous poll (switchMap); leaving the page stops it (toSignal). */
  protected readonly status = toSignal(
    toObservable(this.tracked).pipe(
      switchMap((no) => this.api.watchStatus(no).pipe(catchError(() => EMPTY))),
    ),
  );

  protected track(): void {
    const value = this.query.trim().toUpperCase();
    if (/^[A-Z]{2}[0-9]{2,4}$/.test(value)) {
      this.tracked.set(value);
    }
  }

  protected color(s: FlightStatusCode): string {
    return STATUS_COLOR[s];
  }

  protected statusKey(s: FlightStatusCode): TranslationKey {
    return `status.${s}`;
  }
}

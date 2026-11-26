import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonCard,
  IonCardContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { FlightService } from '../../../core/api/flight.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Flight, FlightSearchQuery } from '../../../core/models/flight.model';
import { BookingFlowStore } from '../../../core/state/booking-flow.store';
import { FlightCardComponent } from '../../../shared/components/flight-card/flight-card.component';

type ResultsState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'loaded'; flights: Flight[] };

@Component({
  selector: 'fa-flight-results',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton,
    IonRefresher, IonRefresherContent, IonSkeletonText, IonCard, IonCardContent,
    DatePipe, TranslatePipe, FlightCardComponent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/book" /></ion-buttons>
        <ion-title>
          @if (store.query(); as q) {
            {{ q.from }} → {{ q.to }} · {{ q.date | date: 'd MMM' }}
          } @else {
            {{ 'results.title' | t }}
          }
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="fa-surface">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @switch (state().kind) {
        @case ('loading') {
          @for (i of [1, 2, 3]; track i) {
            <ion-card class="fa-card"><ion-card-content>
              <ion-skeleton-text [animated]="true" style="width: 60%; height: 22px" />
              <ion-skeleton-text [animated]="true" style="width: 90%" />
              <ion-skeleton-text [animated]="true" style="width: 40%" />
            </ion-card-content></ion-card>
          }
        }
        @case ('error') {
          <div class="ion-padding ion-text-center">
            <p>Could not load flights.</p>
            <ion-button (click)="reload.set(reload() + 1)">{{ 'common.retry' | t }}</ion-button>
          </div>
        }
        @case ('loaded') {
          @for (f of flights(); track f.id) {
            <fa-flight-card [flight]="f" [selectable]="true" (selected)="choose($event)" />
          } @empty {
            <p class="ion-padding ion-text-center fa-muted">{{ 'results.empty' | t }}</p>
          }
        }
      }
    </ion-content>
  `,
})
export class FlightResultsPage {
  protected readonly store = inject(BookingFlowStore);
  private readonly api = inject(FlightService);
  private readonly router = inject(Router);

  protected readonly reload = signal(0);

  // query + reload counter → request; switchMap drops stale responses.
  protected readonly state = toSignal(
    toObservable(this.reload).pipe(
      map(() => this.store.query()),
      filter((q): q is FlightSearchQuery => !!q),
      switchMap((q) =>
        this.api.search(q).pipe(
          map((flights): ResultsState => ({ kind: 'loaded', flights })),
          catchError(() => of<ResultsState>({ kind: 'error' })),
          startWith<ResultsState>({ kind: 'loading' }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as ResultsState },
  );

  protected flights(): Flight[] {
    const s = this.state();
    return s.kind === 'loaded' ? s.flights : [];
  }

  constructor() {
    if (!this.store.query()) {
      void this.router.navigateByUrl('/tabs/book');
    }
  }

  protected refresh(event: CustomEvent): void {
    this.reload.update((n) => n + 1);
    setTimeout(() => (event.target as HTMLIonRefresherElement).complete(), 600);
  }

  protected choose(flight: Flight): void {
    this.store.selectFlight(flight);
    void this.router.navigateByUrl('/booking/passengers');
  }
}

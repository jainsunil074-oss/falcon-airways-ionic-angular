import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonBadge, IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Flight } from '../../../core/models/flight.model';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'fa-flight-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCard, IonCardContent, IonBadge, IonIcon, DatePipe, DecimalPipe, DurationPipe, TranslatePipe],
  template: `
    @let f = flight();
    <ion-card class="fa-card" [button]="selectable()" (click)="selectable() && selected.emit(f)">
      <ion-card-content>
        <div class="times">
          <div>
            <div class="time">{{ f.departure | date: 'HH:mm' }}</div>
            <div class="code">{{ f.from.code }}</div>
          </div>
          <div class="middle">
            <div class="fa-muted small">{{ f.durationMinutes | duration }}</div>
            <div class="line"><ion-icon name="airplane" class="fa-flip-rtl" /></div>
            <div class="fa-muted small">
              {{ (f.stops ? 'results.stops' : 'results.nonstop') | t }}
            </div>
          </div>
          <div class="end">
            <div class="time">{{ f.arrival | date: 'HH:mm' }}</div>
            <div class="code">{{ f.to.code }}</div>
          </div>
        </div>
        <div class="fa-row footer">
          <span class="fa-muted small">{{ f.flightNumber }} · {{ f.aircraft }}</span>
          <span class="fa-spacer"></span>
          @if (f.seatsLeft <= 3) {
            <ion-badge color="warning">{{ f.seatsLeft }} {{ 'results.seatsLeft' | t }}</ion-badge>
          }
          @if (showPrice()) {
            <strong class="price">{{ 'common.aed' | t }} {{ f.price | number: '1.0-0' }}</strong>
          }
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    .times { display: flex; align-items: center; gap: 12px; }
    .time { font-size: 1.4rem; font-weight: 700; color: var(--ion-text-color); }
    .code { font-weight: 600; color: var(--ion-color-medium); }
    .end { text-align: end; }
    .middle { flex: 1; text-align: center; }
    .line { position: relative; height: 18px; color: var(--ion-color-primary); }
    .line::before { content: ''; position: absolute; inset-inline: 0; top: 50%; border-top: 1px dashed var(--ion-color-medium); }
    .line ion-icon { position: relative; background: var(--ion-card-background, var(--ion-background-color)); padding: 0 4px; }
    .small { font-size: 0.75rem; }
    .footer { margin-top: 12px; }
    .price { color: var(--ion-color-primary); font-size: 1.05rem; white-space: nowrap; }
  `,
})
export class FlightCardComponent {
  readonly flight = input.required<Flight>();
  readonly selectable = input(false);
  readonly showPrice = input(true);
  readonly selected = output<Flight>();
}

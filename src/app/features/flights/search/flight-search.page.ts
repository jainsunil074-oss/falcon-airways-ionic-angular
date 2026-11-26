import { Component, inject } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AIRPORTS, HUB } from '../../../core/data/airports';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CabinClass } from '../../../core/models/flight.model';
import { TranslationKey } from '../../../core/i18n/translations';
import { SettingsService } from '../../../core/settings/settings.service';
import { BookingFlowStore } from '../../../core/state/booking-flow.store';

const differentAirports = (group: AbstractControl): ValidationErrors | null =>
  group.get('from')?.value === group.get('to')?.value ? { sameAirport: true } : null;

@Component({
  selector: 'fa-flight-search',
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonSelect, IonSelectOption,
    IonInput, IonButton, IonIcon, IonSegment, IonSegmentButton, IonLabel, TranslatePipe,
  ],
  templateUrl: './flight-search.page.html',
  styles: `
    .swap { display: flex; justify-content: center; margin: -8px 0; position: relative; z-index: 1; }
    .swap ion-button { --border-radius: 50%; width: 40px; height: 40px; }
    ion-segment { margin: 16px; width: auto; }
    .submit { margin: 16px; }
  `,
})
export class FlightSearchPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(BookingFlowStore);
  protected readonly settings = inject(SettingsService);

  protected readonly airports = AIRPORTS;
  protected readonly cabins: CabinClass[] = ['economy', 'business', 'first'];
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly form = this.fb.group(
    {
      from: [HUB, Validators.required],
      to: ['LHR', Validators.required],
      date: [this.inDays(7), Validators.required],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
      cabin: ['economy' as CabinClass],
    },
    { validators: differentAirports },
  );

  protected cabinKey(c: CabinClass): TranslationKey {
    return `cabin.${c}`;
  }

  protected swap(): void {
    const { from, to } = this.form.getRawValue();
    this.form.patchValue({ from: to, to: from });
  }

  protected search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.store.setQuery({ ...v, passengers: Number(v.passengers) });
    void this.router.navigate(['/tabs/book/results']);
  }

  private inDays(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  }
}

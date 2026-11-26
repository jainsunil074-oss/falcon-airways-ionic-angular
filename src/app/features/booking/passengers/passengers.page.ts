import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonListHeader,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Passenger, PassengerTitle } from '../../../core/models/booking.model';
import { BookingFlowStore } from '../../../core/state/booking-flow.store';
import { FlightCardComponent } from '../../../shared/components/flight-card/flight-card.component';

@Component({
  selector: 'fa-passengers',
  imports: [
    ReactiveFormsModule, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonListHeader,
    IonLabel, IonItem, IonInput, IonSelect, IonSelectOption, IonFooter, IonButton,
    TranslatePipe, FlightCardComponent,
  ],
  templateUrl: './passengers.page.html',
})
export class PassengersPage {
  protected readonly store = inject(BookingFlowStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  protected readonly titles: PassengerTitle[] = ['Mr', 'Ms', 'Mrs', 'Dr'];

  protected readonly form = this.fb.group({
    passengers: this.fb.array(
      Array.from({ length: this.store.passengerCount() }, (_, i) => this.passengerGroup(this.store.passengers()[i])),
    ),
  });

  protected get passengers(): FormArray {
    return this.form.controls.passengers;
  }

  private passengerGroup(p?: Passenger) {
    return this.fb.group({
      title: [p?.title ?? ('Mr' as PassengerTitle), Validators.required],
      firstName: [p?.firstName ?? '', [Validators.required, Validators.pattern(/^[\p{L} '-]{2,40}$/u)]],
      lastName: [p?.lastName ?? '', [Validators.required, Validators.pattern(/^[\p{L} '-]{2,40}$/u)]],
      email: [p?.email ?? '', [Validators.required, Validators.email]],
      phone: [p?.phone ?? '', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
      passportNumber: [p?.passportNumber ?? '', [Validators.required, Validators.pattern(/^[A-Z0-9]{6,9}$/i)]],
    });
  }

  protected continue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.setPassengers(this.form.getRawValue().passengers);
    void this.router.navigateByUrl('/booking/payment');
  }
}

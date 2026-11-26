import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingService, PaymentSession } from '../../../core/api/booking.service';
import { WebToHostMessage } from '../../../core/hybrid/bridge-protocol';
import { WebModuleLauncher } from '../../../core/hybrid/web-module-launcher.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Booking } from '../../../core/models/booking.model';
import { SettingsService } from '../../../core/settings/settings.service';
import { BookingFlowStore } from '../../../core/state/booking-flow.store';
import { TripsStore } from '../../../core/state/trips.store';
import { SecureWebviewComponent } from '../../../shared/components/secure-webview/secure-webview.component';

/**
 * Hosted payment page pattern: the PSP's web page handles card data inside a
 * sandboxed WebView (keeps the app out of PCI-DSS scope). The app only receives
 * a validated { status, reference } message over the bridge.
 */
@Component({
  selector: 'fa-payment',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonNote, IonSpinner,
    TranslatePipe, SecureWebviewComponent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/booking/passengers" /></ion-buttons>
        <ion-title>{{ 'payment.title' | t }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="fa-surface ion-padding">
      <ion-note>{{ 'payment.hint' | t }}</ion-note>
      @if (session(); as s) {
        <div class="frame">
          @for (attempt of [attempt()]; track attempt) {
            <fa-secure-webview
              [src]="s.url"
              title="Payment"
              [context]="context()"
              [initialHeight]="520"
              (message)="onMessage($event)"
            />
          }
        </div>
      } @else {
        <div class="ion-text-center ion-padding"><ion-spinner /></div>
      }
    </ion-content>
  `,
  styles: `.frame { margin-top: 12px; border-radius: var(--fa-radius); overflow: hidden; background: var(--ion-card-background, #fff); }`,
})
export class PaymentPage {
  private readonly api = inject(BookingService);
  private readonly flow = inject(BookingFlowStore);
  private readonly trips = inject(TripsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  private readonly alert = inject(AlertController);
  private readonly settings = inject(SettingsService);
  private readonly launcher = inject(WebModuleLauncher);

  protected readonly session = signal<PaymentSession | null>(null);
  protected readonly attempt = signal(0);
  private booking: Booking | null = null;

  protected readonly context = computed(() =>
    this.launcher.hostContext({
      amount: this.flow.total(),
      pnr: this.session()?.pnr ?? '',
      sessionId: this.session()?.sessionId ?? '',
    }),
  );

  constructor() {
    void this.start();
  }

  private async start(): Promise<void> {
    const flight = this.flow.flight();
    if (!flight) return;
    this.booking = await firstValueFrom(this.api.create(flight, this.flow.passengers()));
    this.flow.setBooking(this.booking);
    this.session.set(await firstValueFrom(this.api.createPaymentSession(this.booking.pnr, this.booking.totalAmount)));
  }

  protected async onMessage(msg: WebToHostMessage): Promise<void> {
    if (msg.type !== 'payment.result' || !this.booking) return;

    if (msg.payload.status === 'paid') {
      const paid: Booking = { ...this.booking, paymentStatus: 'paid' };
      await this.trips.upsert(paid);
      this.flow.reset();
      const t = await this.toast.create({
        message: `${this.settings.translate('payment.success')} · ${paid.pnr}`,
        color: 'success',
        duration: 2500,
        icon: 'checkmark-circle',
      });
      await t.present();
      await this.router.navigate(['/trips', paid.pnr], { replaceUrl: true });
    } else {
      const a = await this.alert.create({
        header: this.settings.translate('payment.failed'),
        message: `Ref ${msg.payload.reference}`,
        buttons: [{ text: this.settings.translate('common.retry'), handler: () => this.attempt.update((n) => n + 1) }],
      });
      await a.present();
    }
  }
}

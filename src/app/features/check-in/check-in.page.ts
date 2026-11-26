import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { WebToHostMessage } from '../../core/hybrid/bridge-protocol';
import { WebModuleLauncher } from '../../core/hybrid/web-module-launcher.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SettingsService } from '../../core/settings/settings.service';
import { TripsStore } from '../../core/state/trips.store';
import { SecureWebviewComponent } from '../../shared/components/secure-webview/secure-webview.component';

/**
 * Online check-in is a web journey (often owned by another team / vendor).
 * Default: embedded <iframe> inside the Ionic page.
 * On device: can also open in a dedicated native WebView via the custom plugin.
 * The same check-in page and bridge contract work in both containers.
 */
@Component({
  selector: 'fa-check-in',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent,
    TranslatePipe, SecureWebviewComponent,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button [defaultHref]="'/trips/' + pnr()" /></ion-buttons>
        <ion-title>{{ 'checkin.title' | t }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openNative()" title="Open in native WebView">
            <ion-icon slot="icon-only" name="open-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="fa-surface ion-padding">
      @if (trip(); as t) {
        <fa-secure-webview
          src="web/check-in.html"
          title="Check-in"
          [context]="context()"
          [initialHeight]="640"
          (message)="onMessage($event)"
        />
      } @else {
        <p class="fa-muted">Trip not found.</p>
      }
      @if (nativeOpen()) {
        <p class="fa-muted ion-text-center">Check-in is open in the native WebView…</p>
      }
    </ion-content>
  `,
})
export class CheckInPage {
  // Not input.required: Ionic's outlet can read it before the router binds the :pnr param.
  readonly pnr = input('');

  private readonly trips = inject(TripsStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  private readonly settings = inject(SettingsService);
  private readonly launcher = inject(WebModuleLauncher);
  private nativeSub?: Subscription;

  protected readonly nativeOpen = signal(false);
  protected readonly trip = computed(() => this.trips.trips().find((t) => t.pnr === this.pnr()));
  protected readonly context = computed(() => {
    const t = this.trip();
    return this.launcher.hostContext(
      t
        ? {
            pnr: t.pnr,
            passenger: `${t.passengers[0].firstName} ${t.passengers[0].lastName}`,
            flightNumber: t.flight.flightNumber,
            route: `${t.flight.from.code} → ${t.flight.to.code}`,
          }
        : {},
    );
  });

  constructor() {
    void this.trips.load();
    inject(DestroyRef).onDestroy(() => this.nativeSub?.unsubscribe());
  }

  protected openNative(): void {
    this.nativeSub?.unsubscribe();
    this.nativeOpen.set(true);
    this.nativeSub = this.launcher
      .openNative('web/check-in.html', this.context().data, 'Check-in')
      .subscribe({
        next: (msg) => void this.onMessage(msg),
        complete: () => this.nativeOpen.set(false),
        error: () => this.nativeOpen.set(false),
      });
  }

  protected async onMessage(msg: WebToHostMessage): Promise<void> {
    if (msg.type !== 'checkin.completed') return;
    this.nativeSub?.unsubscribe();
    await this.trips.markCheckedIn(this.pnr(), msg.payload.seat);
    const t = await this.toast.create({
      message: `${this.settings.translate('checkin.done')} · ${msg.payload.seat}`,
      color: 'success',
      duration: 2000,
    });
    await t.present();
    await this.router.navigate(['/trips', this.pnr()], { replaceUrl: true });
  }
}

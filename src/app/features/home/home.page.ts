import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular';
import { WebToHostMessage } from '../../core/hybrid/bridge-protocol';
import { WebModuleLauncher } from '../../core/hybrid/web-module-launcher.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translations';
import { TripsStore } from '../../core/state/trips.store';
import { FlightCardComponent } from '../../shared/components/flight-card/flight-card.component';
import { SecureWebviewComponent } from '../../shared/components/secure-webview/secure-webview.component';

interface QuickAction {
  icon: string;
  label: TranslationKey;
  link: string;
}

@Component({
  selector: 'fa-home',
  imports: [IonContent, IonIcon, IonRippleEffect, RouterLink, TranslatePipe, FlightCardComponent, SecureWebviewComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly trips = inject(TripsStore);
  private readonly router = inject(Router);
  private readonly launcher = inject(WebModuleLauncher);

  protected readonly nextTrip = computed(() => this.trips.upcoming()[0]);
  protected readonly offersContext = computed(() => this.launcher.hostContext());

  protected readonly actions: QuickAction[] = [
    { icon: 'search-outline', label: 'tabs.book', link: '/tabs/book' },
    { icon: 'ticket-outline', label: 'tabs.trips', link: '/tabs/trips' },
    { icon: 'pulse-outline', label: 'tabs.status', link: '/tabs/status' },
    { icon: 'sparkles-outline', label: 'more.assistant', link: '/assistant' },
  ];

  constructor() {
    void this.trips.load();
  }

  /** The offers web module can only request allowlisted routes (validated by the bridge). */
  protected onOffersMessage(msg: WebToHostMessage): void {
    if (msg.type === 'web.navigate') {
      void this.router.navigateByUrl(msg.payload.route);
    }
  }
}

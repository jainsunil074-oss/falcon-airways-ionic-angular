import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { NetworkStatusService } from './core/platform/network-status.service';
import { TranslatePipe } from './core/i18n/translate.pipe';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, TranslatePipe],
  template: `
    <ion-app>
      @if (!network.online()) {
        <div class="fa-offline-banner" role="status">{{ 'common.offline' | t }}</div>
      }
      <ion-router-outlet />
    </ion-app>
  `,
})
export class App {
  protected readonly network = inject(NetworkStatusService);
}

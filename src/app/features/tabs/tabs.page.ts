import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'fa-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, TranslatePipe],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home-outline" />
          <ion-label>{{ 'tabs.home' | t }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="book">
          <ion-icon name="search-outline" />
          <ion-label>{{ 'tabs.book' | t }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="trips">
          <ion-icon name="ticket-outline" />
          <ion-label>{{ 'tabs.trips' | t }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="status">
          <ion-icon name="pulse-outline" />
          <ion-label>{{ 'tabs.status' | t }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="more">
          <ion-icon name="ellipsis-horizontal" />
          <ion-label>{{ 'tabs.more' | t }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {}

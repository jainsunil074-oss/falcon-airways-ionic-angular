import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'fa-more',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, RouterLink, TranslatePipe],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar><ion-title>{{ 'more.title' | t }}</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="fa-surface">
      <ion-list [inset]="true">
        <ion-item routerLink="/assistant" [detail]="true">
          <ion-icon slot="start" name="sparkles-outline" color="primary" />
          <ion-label>{{ 'more.assistant' | t }}</ion-label>
        </ion-item>
        <ion-item routerLink="/hybrid-lab" [detail]="true">
          <ion-icon slot="start" name="layers-outline" color="primary" />
          <ion-label>{{ 'more.hybridLab' | t }}</ion-label>
        </ion-item>
        <ion-item routerLink="/settings" [detail]="true">
          <ion-icon slot="start" name="settings-outline" color="primary" />
          <ion-label>{{ 'more.settings' | t }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class MorePage {}

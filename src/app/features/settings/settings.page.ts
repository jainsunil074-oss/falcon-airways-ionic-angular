import { Component, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Language } from '../../core/i18n/translations';
import { SettingsService } from '../../core/settings/settings.service';
import { TripsStore } from '../../core/state/trips.store';

@Component({
  selector: 'fa-settings',
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonItem,
    IonLabel, IonToggle, IonIcon, IonNote, IonSegment, IonSegmentButton, TranslatePipe,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/more" /></ion-buttons>
        <ion-title>{{ 'settings.title' | t }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="fa-surface">
      <ion-list [inset]="true">
        <ion-item>
          <ion-icon slot="start" name="globe-outline" />
          <ion-label>{{ 'settings.language' | t }}</ion-label>
        </ion-item>
        <ion-segment [value]="settings.language()" (ionChange)="setLanguage($event.detail.value)">
          <ion-segment-button value="en"><ion-label>English</ion-label></ion-segment-button>
          <ion-segment-button value="ar"><ion-label>العربية</ion-label></ion-segment-button>
        </ion-segment>
        <ion-item>
          <ion-icon slot="start" name="moon-outline" />
          <ion-toggle [checked]="settings.darkMode()" (ionChange)="settings.setDarkMode($event.detail.checked)">
            {{ 'settings.darkMode' | t }}
          </ion-toggle>
        </ion-item>
      </ion-list>

      <ion-list [inset]="true">
        <ion-item [button]="true" (click)="clear()">
          <ion-icon slot="start" name="trash-outline" color="danger" />
          <ion-label color="danger">{{ 'settings.clearData' | t }}</ion-label>
        </ion-item>
        <ion-item>
          <ion-label>{{ 'settings.platform' | t }}</ion-label>
          <ion-note slot="end">{{ platform }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: `ion-segment { margin: 0 16px 12px; width: auto; }`,
})
export class SettingsPage {
  protected readonly settings = inject(SettingsService);
  private readonly trips = inject(TripsStore);
  private readonly toast = inject(ToastController);
  protected readonly platform = `${Capacitor.getPlatform()}${Capacitor.isNativePlatform() ? ' (native)' : ' (browser)'}`;

  protected setLanguage(value: unknown): void {
    if (value === 'en' || value === 'ar') {
      this.settings.setLanguage(value satisfies Language);
    }
  }

  protected async clear(): Promise<void> {
    await this.trips.clear();
    const t = await this.toast.create({ message: 'Cleared', duration: 1500 });
    await t.present();
  }
}

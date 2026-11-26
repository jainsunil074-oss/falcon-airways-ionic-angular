import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ASSISTANT_PROVIDER, AssistantAction } from '../../core/ai/assistant.provider';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SettingsService } from '../../core/settings/settings.service';

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  actions?: AssistantAction[];
}

@Component({
  selector: 'fa-assistant',
  imports: [
    FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonFooter,
    IonInput, IonButton, IonIcon, IonChip, IonLabel, TranslatePipe,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/more" /></ion-buttons>
        <ion-title>{{ 'assistant.title' | t }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content #content class="fa-surface ion-padding">
      <div class="bubble bot">{{ 'assistant.welcome' | t }}</div>
      @for (m of messages(); track $index) {
        <div class="bubble" [class.user]="m.from === 'user'" [class.bot]="m.from === 'bot'">{{ m.text }}</div>
        @if (m.actions?.length) {
          <div class="actions">
            @for (a of m.actions; track a.route) {
              <ion-chip [routerLink]="a.route" color="primary"><ion-label>{{ a.label }}</ion-label></ion-chip>
            }
          </div>
        }
      }
      @if (thinking()) {
        <div class="bubble bot typing">…</div>
      }
      <div class="suggestions">
        @for (s of suggestions; track s) {
          <ion-chip [outline]="true" (click)="send(s)"><ion-label>{{ s }}</ion-label></ion-chip>
        }
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <form class="composer" (ngSubmit)="send(draft)">
          <ion-input name="draft" [(ngModel)]="draft" [placeholder]="'assistant.placeholder' | t" maxlength="300" />
          <ion-button type="submit" fill="clear" [disabled]="!draft.trim()">
            <ion-icon slot="icon-only" name="paper-plane" class="fa-flip-rtl" />
          </ion-button>
        </form>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: `
    .bubble { max-width: 80%; padding: 10px 14px; border-radius: 18px; margin: 6px 0; line-height: 1.35; width: fit-content; }
    .bot { background: var(--ion-card-background, #fff); border-end-start-radius: 4px; }
    .user { background: var(--ion-color-primary); color: #fff; margin-inline-start: auto; border-end-end-radius: 4px; }
    .typing { opacity: 0.6; }
    .actions, .suggestions { display: flex; flex-wrap: wrap; gap: 4px; }
    .suggestions { margin-top: 16px; }
    .composer { display: flex; align-items: center; padding-inline-start: 12px; }
  `,
})
export class AssistantPage {
  private readonly assistant = inject(ASSISTANT_PROVIDER);
  private readonly settings = inject(SettingsService);
  private readonly content = viewChild.required<IonContent>('content');

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly thinking = signal(false);
  protected draft = '';
  protected readonly suggestions = ['Status of FA211', 'Baggage allowance', 'Check in', 'My trip'];

  protected async send(text: string): Promise<void> {
    const message = text.trim();
    if (!message || this.thinking()) return;
    this.draft = '';
    this.messages.update((m) => [...m, { from: 'user', text: message }]);
    this.thinking.set(true);
    try {
      const reply = await this.assistant.reply(message, this.settings.language());
      this.messages.update((m) => [...m, { from: 'bot', ...reply }]);
    } catch {
      this.messages.update((m) => [...m, { from: 'bot', text: 'Sorry, something went wrong.' }]);
    } finally {
      this.thinking.set(false);
      setTimeout(() => void this.content().scrollToBottom(250));
    }
  }
}

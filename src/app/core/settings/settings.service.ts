import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { DICTIONARIES, Language, TranslationKey } from '../i18n/translations';
import { StorageService } from '../storage/storage.service';

interface SavedSettings {
  language: Language;
  darkMode: boolean;
}

/**
 * App-wide preferences. Switching to Arabic flips <html dir="rtl">, and Ionic
 * components mirror automatically because they use CSS logical properties.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  readonly language = signal<Language>('en');
  readonly darkMode = signal(false);

  constructor() {
    effect(() => {
      const lang = this.language();
      const html = this.document.documentElement;
      html.lang = lang;
      html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
    effect(() => {
      this.document.documentElement.classList.toggle('ion-palette-dark', this.darkMode());
    });
  }

  async restore(): Promise<void> {
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const saved = await this.storage.get<SavedSettings>('settings', { language: 'en', darkMode: prefersDark });
    this.language.set(saved.language);
    this.darkMode.set(saved.darkMode);
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    void this.persist();
  }

  setDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    void this.persist();
  }

  translate(key: TranslationKey): string {
    return DICTIONARIES[this.language()][key] ?? key;
  }

  private persist(): Promise<void> {
    return this.storage.set<SavedSettings>('settings', {
      language: this.language(),
      darkMode: this.darkMode(),
    });
  }
}

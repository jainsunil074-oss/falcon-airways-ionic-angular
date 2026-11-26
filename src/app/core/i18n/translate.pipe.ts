import { Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import { TranslationKey } from './translations';

/**
 * `{{ 'search.title' | t }}` — reads the language signal, so templates
 * re-render on language change. Keys are type-checked against the EN dictionary.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly settings = inject(SettingsService);

  transform(key: TranslationKey): string {
    return this.settings.translate(key);
  }
}

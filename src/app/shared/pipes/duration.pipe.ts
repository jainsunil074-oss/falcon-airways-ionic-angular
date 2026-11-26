import { Pipe, PipeTransform } from '@angular/core';

/** 470 → "7h 50m" */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes == null || minutes < 0 || !Number.isFinite(minutes)) {
      return '';
    }
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }
}

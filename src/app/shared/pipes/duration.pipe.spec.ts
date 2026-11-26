import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formats hours and minutes', () => {
    expect(pipe.transform(470)).toBe('7h 50m');
    expect(pipe.transform(125)).toBe('2h 05m');
  });

  it('formats minutes only', () => {
    expect(pipe.transform(45)).toBe('45m');
  });

  it('returns empty for invalid input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(-1)).toBe('');
  });
});


import { parseDatestring, extractTimeOfDatestring, getTimezoneOfLocation } from '../lib/iso-8601-datetime-utils';

// Note: import explicitly to use the types shiped with jest.
import {it} from '@jest/globals';

debugger 

it('parses date string correctly', () => {
  const d = new Date();
  const ts = d.getTimezoneOffset();
  expect(ts).toBe(-120);

  const p = parseDatestring('2020-03-30T11:38:00+02:00');
  expect(p.year).toBe('2020');
  expect(p.hour).toBe('11');
  expect(p.tz_hour).toBe('02');
  expect(p.timezoneOffset).toBe(-120);

  const t = extractTimeOfDatestring('2020-03-30T11:38:00+02:00');
  expect(t).toBe('11:38');
});

it('get timezone of location correctly', () => {
  const tz1 = getTimezoneOfLocation({ latitude: 50.73438, longitude: 7.09549 }); // Bonn
  expect(tz1).toBe('Europe/Berlin');
  const tz2 = getTimezoneOfLocation({ latitude: 38.71667, longitude: -9.13333 }); // Lisbon
  expect(tz2).toBe('Europe/Lisbon');
});
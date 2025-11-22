// worker/src/businessRules.ts
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Customer } from './sheetsClient';

dayjs.extend(customParseFormat);

export function dueInNextNDaysOrToday(list: Customer[], days = 7) {
  const today = dayjs().startOf('day');

  return list.filter((c) => {
    if (!c.consent) return false;

    const d = dayjs(c.inspectionDate, 'DD.MM.YYYY', true);
    if (!d.isValid()) return false;

    const diff = d.startOf('day').diff(today, 'day');
    return diff === 0 || (diff > 0 && diff <= days);
  });
}

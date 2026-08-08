export const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Formats a Date object cleanly (e.g. "30 Jul").
 */
export const formatDatePickerDate = (date: Date, showYear: boolean = true): string => {
  const day = date.getDate();
  const month = SHORT_MONTHS[date.getMonth()];
  if (!showYear) return `${day} ${month}`;
  
  const year = date.getFullYear();
  const yearStr = year >= 2000 && year < 2100 ? `${year.toString().slice(2)}` : `${year}`;
  
  return `${day} ${month} ${yearStr}`;
};

interface MonthBounds {
  from: Date;
  to: Date;
}

export function getMonthBounds(year: number, month: number): MonthBounds {
  const from = new Date(year, month, 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(year, month + 1, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

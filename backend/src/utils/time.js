export const addHours = (date, hours) => new Date(date.getTime() + hours * 3600 * 1000);
export const addDays = (date, days) => new Date(date.getTime() + days * 86400 * 1000);

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // handle month overflow (e.g. Jan 31 + 1 month)
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export const daysBetween = (a, b) =>
  Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

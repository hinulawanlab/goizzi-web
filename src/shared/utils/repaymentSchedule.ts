export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function resolveMaturityDate(startDate: string, termMonths: number): string | null {
  if (termMonths <= 0) {
    return null;
  }
  const parsed = Date.parse(startDate);
  if (Number.isNaN(parsed)) {
    return null;
  }
  const start = new Date(parsed);
  if (termMonths === 1) {
    const maturity = new Date(start);
    maturity.setDate(maturity.getDate() + 30);
    return maturity.toISOString().split("T")[0];
  }

  const targetMonthStart = new Date(start.getFullYear(), start.getMonth() + termMonths, 1);
  const targetMonth = targetMonthStart.getMonth();
  const targetYear = targetMonthStart.getFullYear();
  const startDay = start.getDate();
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  if (targetMonth === 1 && startDay > (isLeapYear(targetYear) ? 29 : 28)) {
    return new Date(targetYear, targetMonth + 1, 1).toISOString().split("T")[0];
  }

  const day = Math.min(startDay, daysInTargetMonth);
  return new Date(targetYear, targetMonth, day).toISOString().split("T")[0];
}

export function buildRepaymentSchedule(startDate: string, termMonths: number, paymentFrequency: number): string[] {
  if (termMonths <= 0 || paymentFrequency <= 0) {
    return [];
  }
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return [];
  }

  const schedule: string[] = [];
  if (termMonths === 1) {
    const intervalDays = Math.ceil(30 / paymentFrequency);
    let current = new Date(start);
    for (let index = 0; index < paymentFrequency; index += 1) {
      current = new Date(current);
      current.setDate(current.getDate() + intervalDays);
      schedule.push(current.toISOString().split("T")[0]);
    }
    const maturity = resolveMaturityDate(startDate, termMonths);
    if (maturity && schedule.length) {
      schedule[schedule.length - 1] = maturity;
    }
    return schedule;
  }

  const totalPayments = termMonths * paymentFrequency;
  let current = new Date(start);
  for (let index = 0; index < totalPayments; index += 1) {
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const intervalDays = Math.ceil(daysInMonth / paymentFrequency);
    current = new Date(current);
    current.setDate(current.getDate() + intervalDays);
    schedule.push(current.toISOString().split("T")[0]);
  }

  return schedule;
}

export function resolveNextDueDate(schedule: string[]): string | null {
  if (!schedule.length) {
    return null;
  }
  const today = new Date().toISOString().split("T")[0];
  return schedule.find((date) => date >= today) ?? schedule[0];
}

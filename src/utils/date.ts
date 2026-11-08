const DATE_INPUT_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MS_PER_DAY = 86_400_000;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseDateInput(value: string): string | null {
  const match = DATE_INPUT_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

export function formatDateInput(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }

  return formatDateInput(iso) || '—';
}

export function todayDateInput(): string {
  const now = new Date();

  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

export function todayIsoAtUtcNoon(): string {
  return parseDateInput(todayDateInput()) ?? new Date().toISOString();
}

export function isFutureDateInput(value: string): boolean {
  const parsed = parseDateInput(value);
  const today = parseDateInput(todayDateInput());

  if (!parsed || !today) {
    return false;
  }

  return new Date(parsed).getTime() > new Date(today).getTime();
}

export function differenceInUtcCalendarDays(laterIso: string, earlierIso: string): number {
  const later = new Date(laterIso);
  const earlier = new Date(earlierIso);

  if (Number.isNaN(later.getTime()) || Number.isNaN(earlier.getTime())) {
    return 0;
  }

  const laterDay = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  const earlierDay = Date.UTC(
    earlier.getUTCFullYear(),
    earlier.getUTCMonth(),
    earlier.getUTCDate(),
  );

  return Math.round((laterDay - earlierDay) / MS_PER_DAY);
}

export function formatKm(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)} km`;
}

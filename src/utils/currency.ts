export function parseCurrencyToCents(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  const withoutCurrency = trimmed.replace(/R\$\s?/gi, '').replace(/\s/g, '');

  if (!/^[0-9.,-]+$/.test(withoutCurrency) || withoutCurrency.includes('-')) {
    return null;
  }

  let normalized: string;

  if (withoutCurrency.includes(',')) {
    normalized = withoutCurrency.replace(/\./g, '').replace(',', '.');
  } else {
    const dotCount = (withoutCurrency.match(/\./g) ?? []).length;

    if (dotCount > 1) {
      normalized = withoutCurrency.replace(/\./g, '');
    } else if (dotCount === 1) {
      const [, decimals = ''] = withoutCurrency.split('.');
      normalized = decimals.length === 3 ? withoutCurrency.replace('.', '') : withoutCurrency;
    } else {
      normalized = withoutCurrency;
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatCents(cents: number | null): string {
  if (cents === null) {
    return '—';
  }

  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

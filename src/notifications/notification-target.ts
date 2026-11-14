import type { Href } from 'expo-router';

import { parsePositiveInteger } from '@/utils/numbers';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    return parsePositiveInteger(value);
  }

  return null;
}

const HOME_TARGET: Href = { pathname: '/' };

/**
 * Destino de navegação para o dado anexado à notificação tocada.
 * Notificações antigas ou com dados inválidos caem na Home.
 */
export function resolveNotificationTarget(data: unknown): Href {
  if (!isRecord(data)) {
    return HOME_TARGET;
  }

  if (data.kind === 'maintenance') {
    const itemId = toPositiveInteger(data.itemId);

    if (itemId !== null) {
      return { pathname: '/items/[id]', params: { id: String(itemId) } };
    }
  }

  return HOME_TARGET;
}

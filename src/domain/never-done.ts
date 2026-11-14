import type { MaintenanceItemSnapshot } from './types';

/**
 * Item sem nenhum registro de execução. Nesse caso o vencimento é contado a
 * partir do baseline imutável do item, não do odômetro/data atuais.
 */
export function isNeverDone(item: MaintenanceItemSnapshot): boolean {
  return item.lastDoneKm === null && item.lastDoneAt === null;
}

import type { MaintenanceItemSnapshot, VehicleSnapshot } from './types';

/**
 * Referência para contar o intervalo por km: última execução, senão o baseline
 * imutável do item. O veículo só é usado como último recurso para dados antigos
 * que ainda não têm baseline gravado.
 */
export function resolveBaselineKm(item: MaintenanceItemSnapshot, vehicle: VehicleSnapshot): number {
  return item.lastDoneKm ?? item.baselineKm ?? vehicle.odometerKm;
}

/**
 * Referência para contar o intervalo por tempo. O baseline é gravado uma única
 * vez na criação do item e não muda quando o odômetro é atualizado.
 */
export function resolveBaselineAt(item: MaintenanceItemSnapshot, vehicle: VehicleSnapshot): string {
  return item.lastDoneAt ?? item.baselineAt ?? vehicle.odometerUpdatedAt;
}

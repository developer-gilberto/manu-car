export interface VehicleSnapshot {
  odometerKm: number;
  odometerUpdatedAt: string;
}

export interface MaintenanceItemSnapshot {
  intervalKm: number | null;
  intervalMonths: number | null;
  lastDoneKm: number | null;
  lastDoneAt: string | null;
  /**
   * Referência fixa (não recalculada a cada leitura do odômetro) usada para
   * contar o intervalo quando o item nunca foi feito.
   */
  baselineKm: number | null;
  baselineAt: string | null;
}

export interface OdometerReadingSnapshot {
  km: number;
  readAt: string;
}

export interface NextDue {
  dueKm: number | null;
  dueAt: string | null;
}

export type MaintenanceStatus = 'ok' | 'atencao' | 'vencido';

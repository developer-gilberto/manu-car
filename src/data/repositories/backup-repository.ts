import { maintenanceItems, maintenanceLogs, odometerReadings, vehicles } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';
import type { BackupData } from '@/domain/backup';

function earliestReadingsByVehicle(
  readings: BackupData['odometerReadings'],
): Map<number, { km: number; readAt: string; id: number }> {
  const earliest = new Map<number, { km: number; readAt: string; id: number }>();

  for (const reading of readings) {
    const current = earliest.get(reading.vehicleId);

    if (
      !current ||
      reading.readAt < current.readAt ||
      (reading.readAt === current.readAt && reading.id < current.id)
    ) {
      earliest.set(reading.vehicleId, reading);
    }
  }

  return earliest;
}

/**
 * Garante que itens importados sempre tenham baseline. Backups antigos ou
 * editados à mão podem trazer `null`; nesse caso usamos a mesma regra de
 * reconstrução: última execução > primeira leitura > estado do veículo.
 */
function withResolvedBaselines(data: BackupData): BackupData['maintenanceItems'] {
  const vehiclesById = new Map(data.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const earliestReadings = earliestReadingsByVehicle(data.odometerReadings);

  return data.maintenanceItems.map((item) => {
    const vehicle = vehiclesById.get(item.vehicleId);
    const reading = earliestReadings.get(item.vehicleId);

    return {
      ...item,
      baselineKm: item.baselineKm ?? item.lastDoneKm ?? reading?.km ?? vehicle?.odometerKm ?? null,
      baselineAt:
        item.baselineAt ?? item.lastDoneAt ?? reading?.readAt ?? vehicle?.odometerUpdatedAt ?? null,
    };
  });
}

/**
 * Lê e substitui todo o conteúdo do banco para backup.
 * Telas não usam este repositório diretamente: passam pela camada de backup.
 */
export class BackupRepository {
  constructor(private readonly db: AppDatabase) {}

  exportData(): BackupData {
    return {
      vehicles: this.db.select().from(vehicles).orderBy(vehicles.id).all(),
      odometerReadings: this.db.select().from(odometerReadings).orderBy(odometerReadings.id).all(),
      maintenanceItems: this.db.select().from(maintenanceItems).orderBy(maintenanceItems.id).all(),
      maintenanceLogs: this.db.select().from(maintenanceLogs).orderBy(maintenanceLogs.id).all(),
    };
  }

  /**
   * Apaga tudo e grava o conteúdo do backup numa única transação.
   * Se qualquer insert falhar (ex.: violação de chave estrangeira), a
   * transação inteira é desfeita e os dados atuais permanecem intactos.
   */
  replaceAll(data: BackupData): void {
    this.db.transaction((tx) => {
      // Ordem: filhos antes dos pais (o cascade também cobre, mas fica explícito).
      tx.delete(maintenanceLogs).run();
      tx.delete(odometerReadings).run();
      tx.delete(maintenanceItems).run();
      tx.delete(vehicles).run();

      if (data.vehicles.length > 0) {
        tx.insert(vehicles).values(data.vehicles).run();
      }

      if (data.maintenanceItems.length > 0) {
        tx.insert(maintenanceItems).values(withResolvedBaselines(data)).run();
      }

      if (data.odometerReadings.length > 0) {
        tx.insert(odometerReadings).values(data.odometerReadings).run();
      }

      if (data.maintenanceLogs.length > 0) {
        tx.insert(maintenanceLogs).values(data.maintenanceLogs).run();
      }
    });
  }
}

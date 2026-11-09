import { maintenanceItems, maintenanceLogs, odometerReadings, vehicles } from '@/data/db/schema';
import type { AppDatabase } from '@/data/db/types';
import type { BackupData } from '@/domain/backup';

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
        tx.insert(maintenanceItems).values(data.maintenanceItems).run();
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

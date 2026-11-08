import { getDatabase } from '@/data/db/client';
import type { AppDatabase } from '@/data/db/types';

import { LogRepository } from './log-repository';
import { MaintenanceItemRepository } from './maintenance-item-repository';
import { OdometerRepository } from './odometer-repository';
import { VehicleRepository } from './vehicle-repository';

export interface Repositories {
  vehicles: VehicleRepository;
  maintenanceItems: MaintenanceItemRepository;
  odometer: OdometerRepository;
  logs: LogRepository;
}

export function createRepositories(db: AppDatabase): Repositories {
  return {
    vehicles: new VehicleRepository(db),
    maintenanceItems: new MaintenanceItemRepository(db),
    odometer: new OdometerRepository(db),
    logs: new LogRepository(db),
  };
}

export function getRepositories(): Repositories {
  return createRepositories(getDatabase());
}

export { LogRepository, MaintenanceItemRepository, OdometerRepository, VehicleRepository };

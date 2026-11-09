import { getDatabase } from '@/data/db/client';
import type { AppDatabase } from '@/data/db/types';

import { BackupRepository } from './backup-repository';
import { LogRepository } from './log-repository';
import { MaintenanceItemRepository } from './maintenance-item-repository';
import { NotificationSettingsRepository } from './notification-settings-repository';
import { OdometerRepository } from './odometer-repository';
import { VehicleRepository } from './vehicle-repository';

export interface Repositories {
  vehicles: VehicleRepository;
  maintenanceItems: MaintenanceItemRepository;
  odometer: OdometerRepository;
  logs: LogRepository;
  notificationSettings: NotificationSettingsRepository;
  backup: BackupRepository;
}

export function createRepositories(db: AppDatabase): Repositories {
  return {
    vehicles: new VehicleRepository(db),
    maintenanceItems: new MaintenanceItemRepository(db),
    odometer: new OdometerRepository(db),
    logs: new LogRepository(db),
    notificationSettings: new NotificationSettingsRepository(),
    backup: new BackupRepository(db),
  };
}

export function getRepositories(): Repositories {
  return createRepositories(getDatabase());
}

export {
  BackupRepository,
  LogRepository,
  MaintenanceItemRepository,
  NotificationSettingsRepository,
  OdometerRepository,
  VehicleRepository,
};

import { z } from 'zod';

/** Versão atual do formato de backup. Incremente ao mudar o formato. */
export const BACKUP_SCHEMA_VERSION = 2;

const SUPPORTED_BACKUP_VERSIONS = [1, 2] as const;

const isoDateTime = z.iso.datetime({ message: 'data ISO 8601 inválida' });
const nonNegativeInt = z
  .number()
  .int('deve ser um número inteiro')
  .nonnegative('não pode ser negativo');
const positiveId = z.number().int('deve ser um número inteiro').positive('deve ser maior que zero');

const vehicleSchema = z.object({
  id: positiveId,
  name: z.string().trim().min(1, 'nome vazio').max(60),
  plate: z.string().trim().max(10).nullable(),
  odometerKm: nonNegativeInt,
  odometerUpdatedAt: isoDateTime,
});

const odometerReadingSchema = z.object({
  id: positiveId,
  vehicleId: positiveId,
  km: nonNegativeInt,
  readAt: isoDateTime,
});

const maintenanceItemSchemaV1 = z.object({
  id: positiveId,
  vehicleId: positiveId,
  name: z.string().trim().min(1, 'nome vazio').max(80),
  intervalKm: nonNegativeInt.nullable(),
  intervalMonths: nonNegativeInt.nullable(),
  lastDoneKm: nonNegativeInt.nullable(),
  lastDoneAt: isoDateTime.nullable(),
  notifyEnabled: z.boolean(),
  archived: z.boolean(),
});

const maintenanceItemSchemaV2 = maintenanceItemSchemaV1.extend({
  baselineKm: nonNegativeInt.nullable(),
  baselineAt: isoDateTime.nullable(),
});

const maintenanceLogSchema = z.object({
  id: positiveId,
  itemId: positiveId,
  doneAt: isoDateTime,
  km: nonNegativeInt,
  costCents: nonNegativeInt.nullable(),
  notes: z.string().max(500).nullable(),
});

export const backupV1Schema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: isoDateTime,
  vehicles: z.array(vehicleSchema),
  odometerReadings: z.array(odometerReadingSchema),
  maintenanceItems: z.array(maintenanceItemSchemaV1),
  maintenanceLogs: z.array(maintenanceLogSchema),
});

export const backupV2Schema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: isoDateTime,
  vehicles: z.array(vehicleSchema),
  odometerReadings: z.array(odometerReadingSchema),
  maintenanceItems: z.array(maintenanceItemSchemaV2),
  maintenanceLogs: z.array(maintenanceLogSchema),
});

export type BackupV1 = z.infer<typeof backupV1Schema>;
export type BackupV2 = z.infer<typeof backupV2Schema>;
export type BackupVehicle = z.infer<typeof vehicleSchema>;
export type BackupOdometerReading = z.infer<typeof odometerReadingSchema>;
export type BackupMaintenanceItem = z.infer<typeof maintenanceItemSchemaV2>;
export type BackupMaintenanceLog = z.infer<typeof maintenanceLogSchema>;

/** Conteúdo do banco, sem metadados de versão. */
export type BackupData = Omit<BackupV2, 'schemaVersion' | 'exportedAt'>;

export type BackupErrorCode =
  'INVALID_JSON' | 'NOT_A_BACKUP' | 'UNSUPPORTED_VERSION' | 'INVALID_CONTENT' | 'INTEGRITY';

export interface BackupError {
  code: BackupErrorCode;
  message: string;
  details: string[];
}

export type ParseBackupResult = { ok: true; backup: BackupV2 } | { ok: false; error: BackupError };

export interface BackupSummary {
  exportedAt: string;
  vehicles: number;
  maintenanceItems: number;
  maintenanceLogs: number;
  odometerReadings: number;
}

const MAX_DETAILS = 5;

/** Primeira leitura de cada veículo, usada para reconstruir o baseline em backups v1. */
function earliestReadingsByVehicle(
  readings: readonly BackupOdometerReading[],
): Map<number, BackupOdometerReading> {
  const earliest = new Map<number, BackupOdometerReading>();

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
 * Backups v1 não tinham baseline. Reconstruímos a referência a partir do que
 * existir de mais antigo (última execução > primeira leitura > estado do
 * veículo), para que o item nunca passe a vencer "do zero" a cada leitura.
 */
function upgradeV1ToV2(backup: BackupV1): BackupV2 {
  const vehiclesById = new Map(backup.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const earliestReadings = earliestReadingsByVehicle(backup.odometerReadings);

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: backup.exportedAt,
    vehicles: backup.vehicles,
    odometerReadings: backup.odometerReadings,
    maintenanceItems: backup.maintenanceItems.map((item) => {
      const vehicle = vehiclesById.get(item.vehicleId);
      const earliestReading = earliestReadings.get(item.vehicleId);

      return {
        ...item,
        baselineKm: item.lastDoneKm ?? earliestReading?.km ?? vehicle?.odometerKm ?? null,
        baselineAt:
          item.lastDoneAt ?? earliestReading?.readAt ?? vehicle?.odometerUpdatedAt ?? null,
      };
    }),
    maintenanceLogs: backup.maintenanceLogs,
  };
}

export function buildBackup(data: BackupData, exportedAt: string): BackupV2 {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    vehicles: data.vehicles,
    odometerReadings: data.odometerReadings,
    maintenanceItems: data.maintenanceItems,
    maintenanceLogs: data.maintenanceLogs,
  };
}

export function serializeBackup(backup: BackupV2): string {
  return JSON.stringify(backup, null, 2);
}

/** Confere ids duplicados e referências entre tabelas. */
export function findBackupIntegrityProblems(data: BackupData): string[] {
  const problems: string[] = [];
  const vehicleIds = new Set<number>();
  const itemIds = new Set<number>();

  const checkUnique = (label: string, ids: number[]) => {
    const seen = new Set<number>();

    for (const id of ids) {
      if (seen.has(id)) {
        problems.push(`${label} com id ${id} duplicado.`);
      }

      seen.add(id);
    }
  };

  checkUnique(
    'Veículo',
    data.vehicles.map((vehicle) => vehicle.id),
  );
  checkUnique(
    'Item',
    data.maintenanceItems.map((item) => item.id),
  );

  data.vehicles.forEach((vehicle) => vehicleIds.add(vehicle.id));
  data.maintenanceItems.forEach((item) => itemIds.add(item.id));

  for (const item of data.maintenanceItems) {
    if (!vehicleIds.has(item.vehicleId)) {
      problems.push(`Item "${item.name}" aponta para um veículo inexistente (${item.vehicleId}).`);
    }
  }

  for (const reading of data.odometerReadings) {
    if (!vehicleIds.has(reading.vehicleId)) {
      problems.push(`Leitura de odômetro ${reading.id} aponta para um veículo inexistente.`);
    }
  }

  for (const log of data.maintenanceLogs) {
    if (!itemIds.has(log.itemId)) {
      problems.push(`Registro de manutenção ${log.id} aponta para um item inexistente.`);
    }
  }

  return problems;
}

function describeZodIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, MAX_DETAILS).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'arquivo';
    return `${path}: ${issue.message}`;
  });
}

function fail(code: BackupErrorCode, message: string, details: string[] = []): ParseBackupResult {
  return { ok: false, error: { code, message, details } };
}

/**
 * Valida o texto de um backup antes de qualquer gravação.
 * Nada é gravado aqui: só devolve o backup válido ou o motivo da rejeição.
 */
export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return fail('INVALID_JSON', 'O conteúdo colado não é um JSON válido.');
  }

  if (typeof raw !== 'object' || raw === null || !('schemaVersion' in raw)) {
    return fail('NOT_A_BACKUP', 'Este texto não parece um backup do ManuCar.');
  }

  const version = (raw as { schemaVersion: unknown }).schemaVersion;

  if (version !== 1 && version !== 2) {
    return fail(
      'UNSUPPORTED_VERSION',
      `Versão de backup desconhecida (${String(version)}). Este app lê as versões ${SUPPORTED_BACKUP_VERSIONS.join(' e ')}. Atualize o app para importar este arquivo.`,
    );
  }

  let backup: BackupV2;

  if (version === 1) {
    const parsedV1 = backupV1Schema.safeParse(raw);

    if (!parsedV1.success) {
      return fail(
        'INVALID_CONTENT',
        'O backup tem campos inválidos.',
        describeZodIssues(parsedV1.error),
      );
    }

    backup = upgradeV1ToV2(parsedV1.data);
  } else {
    const parsedV2 = backupV2Schema.safeParse(raw);

    if (!parsedV2.success) {
      return fail(
        'INVALID_CONTENT',
        'O backup tem campos inválidos.',
        describeZodIssues(parsedV2.error),
      );
    }

    backup = parsedV2.data;
  }

  const problems = findBackupIntegrityProblems(backup);

  if (problems.length > 0) {
    return fail('INTEGRITY', 'O backup tem referências quebradas.', problems.slice(0, MAX_DETAILS));
  }

  return { ok: true, backup };
}

export function summarizeBackup(backup: BackupV2): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    vehicles: backup.vehicles.length,
    maintenanceItems: backup.maintenanceItems.length,
    maintenanceLogs: backup.maintenanceLogs.length,
    odometerReadings: backup.odometerReadings.length,
  };
}

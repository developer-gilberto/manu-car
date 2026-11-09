import { z } from 'zod';

/** Versão atual do formato de backup. Incremente ao mudar o formato. */
export const BACKUP_SCHEMA_VERSION = 1;

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

const maintenanceItemSchema = z.object({
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

const maintenanceLogSchema = z.object({
  id: positiveId,
  itemId: positiveId,
  doneAt: isoDateTime,
  km: nonNegativeInt,
  costCents: nonNegativeInt.nullable(),
  notes: z.string().max(500).nullable(),
});

export const backupV1Schema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: isoDateTime,
  vehicles: z.array(vehicleSchema),
  odometerReadings: z.array(odometerReadingSchema),
  maintenanceItems: z.array(maintenanceItemSchema),
  maintenanceLogs: z.array(maintenanceLogSchema),
});

export type BackupV1 = z.infer<typeof backupV1Schema>;
export type BackupVehicle = z.infer<typeof vehicleSchema>;
export type BackupOdometerReading = z.infer<typeof odometerReadingSchema>;
export type BackupMaintenanceItem = z.infer<typeof maintenanceItemSchema>;
export type BackupMaintenanceLog = z.infer<typeof maintenanceLogSchema>;

/** Conteúdo do banco, sem metadados de versão. */
export type BackupData = Omit<BackupV1, 'schemaVersion' | 'exportedAt'>;

export type BackupErrorCode =
  'INVALID_JSON' | 'NOT_A_BACKUP' | 'UNSUPPORTED_VERSION' | 'INVALID_CONTENT' | 'INTEGRITY';

export interface BackupError {
  code: BackupErrorCode;
  message: string;
  details: string[];
}

export type ParseBackupResult = { ok: true; backup: BackupV1 } | { ok: false; error: BackupError };

export interface BackupSummary {
  exportedAt: string;
  vehicles: number;
  maintenanceItems: number;
  maintenanceLogs: number;
  odometerReadings: number;
}

const MAX_DETAILS = 5;

export function buildBackup(data: BackupData, exportedAt: string): BackupV1 {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    vehicles: data.vehicles,
    odometerReadings: data.odometerReadings,
    maintenanceItems: data.maintenanceItems,
    maintenanceLogs: data.maintenanceLogs,
  };
}

export function serializeBackup(backup: BackupV1): string {
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
    return fail('NOT_A_BACKUP', 'Este texto não parece um backup do Manu Car.');
  }

  const version = (raw as { schemaVersion: unknown }).schemaVersion;

  if (version !== BACKUP_SCHEMA_VERSION) {
    return fail(
      'UNSUPPORTED_VERSION',
      `Versão de backup desconhecida (${String(version)}). Este app lê apenas a versão ${BACKUP_SCHEMA_VERSION}. Atualize o app para importar este arquivo.`,
    );
  }

  const parsed = backupV1Schema.safeParse(raw);

  if (!parsed.success) {
    return fail(
      'INVALID_CONTENT',
      'O backup tem campos inválidos.',
      describeZodIssues(parsed.error),
    );
  }

  const problems = findBackupIntegrityProblems(parsed.data);

  if (problems.length > 0) {
    return fail('INTEGRITY', 'O backup tem referências quebradas.', problems.slice(0, MAX_DETAILS));
  }

  return { ok: true, backup: parsed.data };
}

export function summarizeBackup(backup: BackupV1): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    vehicles: backup.vehicles.length,
    maintenanceItems: backup.maintenanceItems.length,
    maintenanceLogs: backup.maintenanceLogs.length,
    odometerReadings: backup.odometerReadings.length,
  };
}

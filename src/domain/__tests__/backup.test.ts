import {
  BACKUP_SCHEMA_VERSION,
  buildBackup,
  parseBackup,
  serializeBackup,
  summarizeBackup,
  type BackupData,
} from '@/domain/backup';

const EXPORTED_AT = '2026-03-01T12:00:00.000Z';

const data: BackupData = {
  vehicles: [
    {
      id: 1,
      name: 'Gol',
      plate: 'ABC1D23',
      odometerKm: 50_000,
      odometerUpdatedAt: '2026-02-20T10:00:00.000Z',
    },
  ],
  odometerReadings: [{ id: 1, vehicleId: 1, km: 50_000, readAt: '2026-02-20T10:00:00.000Z' }],
  maintenanceItems: [
    {
      id: 1,
      vehicleId: 1,
      name: 'Óleo do motor',
      intervalKm: 10_000,
      intervalMonths: 6,
      lastDoneKm: 45_000,
      lastDoneAt: null,
      notifyEnabled: true,
      archived: false,
    },
  ],
  maintenanceLogs: [
    {
      id: 1,
      itemId: 1,
      doneAt: '2026-01-10T08:00:00.000Z',
      km: 45_000,
      costCents: 12_990,
      notes: 'Troca feita',
    },
  ],
};

function validText(): string {
  return serializeBackup(buildBackup(data, EXPORTED_AT));
}

describe('backup', () => {
  it('gera o backup com schemaVersion atual', () => {
    const backup = buildBackup(data, EXPORTED_AT);

    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(backup.exportedAt).toBe(EXPORTED_AT);
  });

  it('faz roundtrip: exporta e reimporta sem perda', () => {
    const result = parseBackup(validText());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.vehicles).toEqual(data.vehicles);
      expect(result.backup.maintenanceItems).toEqual(data.maintenanceItems);
      expect(result.backup.maintenanceLogs).toEqual(data.maintenanceLogs);
      expect(result.backup.odometerReadings).toEqual(data.odometerReadings);
    }
  });

  it('rejeita JSON malformado', () => {
    const result = parseBackup('{ isto não é json');

    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_JSON' } });
  });

  it('rejeita um JSON que não é backup', () => {
    expect(parseBackup('[1, 2, 3]')).toMatchObject({
      ok: false,
      error: { code: 'NOT_A_BACKUP' },
    });
    expect(parseBackup('{"vehicles": []}')).toMatchObject({
      ok: false,
      error: { code: 'NOT_A_BACKUP' },
    });
    expect(parseBackup('null')).toMatchObject({ ok: false, error: { code: 'NOT_A_BACKUP' } });
  });

  it('rejeita versão desconhecida sem tentar interpretar o conteúdo', () => {
    const future = JSON.parse(validText());
    future.schemaVersion = 2;

    const result = parseBackup(JSON.stringify(future));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNSUPPORTED_VERSION');
      expect(result.error.message).toContain('2');
      expect(result.error.message).toContain(String(BACKUP_SCHEMA_VERSION));
    }
  });

  it('rejeita versão ausente ou em formato errado', () => {
    const noVersion = JSON.parse(validText());
    delete noVersion.schemaVersion;
    expect(parseBackup(JSON.stringify(noVersion))).toMatchObject({
      ok: false,
      error: { code: 'NOT_A_BACKUP' },
    });

    const stringVersion = JSON.parse(validText());
    stringVersion.schemaVersion = '1';
    expect(parseBackup(JSON.stringify(stringVersion))).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_VERSION' },
    });
  });

  it('rejeita campos inválidos e aponta onde está o erro', () => {
    const broken = JSON.parse(validText());
    broken.vehicles[0].odometerKm = -5;
    broken.maintenanceLogs[0].costCents = 12.5;

    const result = parseBackup(JSON.stringify(broken));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CONTENT');
      expect(result.error.details.join('\n')).toContain('vehicles.0.odometerKm');
      expect(result.error.details.join('\n')).toContain('maintenanceLogs.0.costCents');
    }
  });

  it('rejeita data ISO inválida', () => {
    const broken = JSON.parse(validText());
    broken.exportedAt = 'ontem';

    expect(parseBackup(JSON.stringify(broken))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_CONTENT' },
    });
  });

  it('rejeita arquivo sem as listas obrigatórias', () => {
    const broken = JSON.parse(validText());
    delete broken.maintenanceItems;

    expect(parseBackup(JSON.stringify(broken))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_CONTENT' },
    });
  });

  it('rejeita item apontando para veículo inexistente', () => {
    const broken = JSON.parse(validText());
    broken.maintenanceItems[0].vehicleId = 99;

    const result = parseBackup(JSON.stringify(broken));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTEGRITY');
      expect(result.error.details[0]).toContain('veículo inexistente');
    }
  });

  it('rejeita registros de manutenção sem item e ids duplicados', () => {
    const broken = JSON.parse(validText());
    broken.maintenanceLogs[0].itemId = 42;
    broken.vehicles.push({ ...broken.vehicles[0] });

    const result = parseBackup(JSON.stringify(broken));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INTEGRITY');
      expect(result.error.details.join('\n')).toContain('item inexistente');
      expect(result.error.details.join('\n')).toContain('duplicado');
    }
  });

  it('resume o conteúdo para a confirmação', () => {
    const result = parseBackup(validText());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(summarizeBackup(result.backup)).toEqual({
        exportedAt: EXPORTED_AT,
        vehicles: 1,
        maintenanceItems: 1,
        maintenanceLogs: 1,
        odometerReadings: 1,
      });
    }
  });
});

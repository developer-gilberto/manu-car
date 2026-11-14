import { buildBackupFileName } from '../backup-file';

describe('buildBackupFileName', () => {
  it('usa DD-MM-AAAA e o timestamp em milissegundos', () => {
    const now = new Date(2026, 0, 5, 10, 30, 12, 7);

    expect(buildBackupFileName(now)).toBe(`manucar-backup-05-01-2026_${now.getTime()}.json`);
  });

  it('mantém dia e mês com dois dígitos', () => {
    const now = new Date(2026, 10, 14, 23, 59, 59, 999);

    expect(buildBackupFileName(now)).toBe(`manucar-backup-14-11-2026_${now.getTime()}.json`);
  });

  it('usa o epoch em milissegundos no fim do nome', () => {
    expect(buildBackupFileName(new Date(1_763_150_000_123))).toMatch(/_1763150000123\.json$/);
  });
});

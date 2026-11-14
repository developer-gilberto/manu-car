export const BACKUP_MIME_TYPES = ['application/json', 'text/plain', 'application/octet-stream'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Nome do arquivo de backup: manucar-backup-DD-MM-AAAA_EPOCH.json, com a data
 * local e o timestamp Unix em milissegundos (ex.: 1763150000123).
 */
export function buildBackupFileName(now: Date): string {
  const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;

  return `manucar-backup-${date}_${now.getTime()}.json`;
}

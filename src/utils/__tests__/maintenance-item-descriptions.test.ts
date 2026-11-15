import { DEFAULT_MAINTENANCE_ITEM_NAMES } from '@/data/db/default-maintenance-items';
import { getMaintenanceItemDescription } from '@/utils/maintenance-item-descriptions';

describe('getMaintenanceItemDescription', () => {
  it('tem descrição para todos os itens padrão', () => {
    for (const name of DEFAULT_MAINTENANCE_ITEM_NAMES) {
      expect(getMaintenanceItemDescription(name)).toEqual(expect.any(String));
      expect(getMaintenanceItemDescription(name)?.length).toBeGreaterThan(0);
    }
  });

  it('ignora maiúsculas e espaços nas extremidades', () => {
    expect(getMaintenanceItemDescription('  VELAS DE IGNIÇÃO  ')).toBe(
      getMaintenanceItemDescription('velas de ignição'),
    );
  });

  it('retorna null para itens personalizados', () => {
    expect(getMaintenanceItemDescription('turbo')).toBeNull();
  });
});

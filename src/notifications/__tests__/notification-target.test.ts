import { resolveNotificationTarget } from '../notification-target';

describe('resolveNotificationTarget', () => {
  it('abre o detalhe do item em uma notificação de manutenção', () => {
    expect(resolveNotificationTarget({ kind: 'maintenance', vehicleId: 1, itemId: 7 })).toEqual({
      pathname: '/items/[id]',
      params: { id: '7' },
    });
  });

  it('aceita itemId serializado como string', () => {
    expect(resolveNotificationTarget({ kind: 'maintenance', itemId: '12' })).toEqual({
      pathname: '/items/[id]',
      params: { id: '12' },
    });
  });

  it('abre a Home para o lembrete semanal de odômetro', () => {
    expect(resolveNotificationTarget({ kind: 'weekly-odometer' })).toEqual({ pathname: '/' });
  });

  it('abre a Home para a notificação de teste', () => {
    expect(resolveNotificationTarget({ kind: 'test' })).toEqual({ pathname: '/' });
  });

  it.each([
    { kind: 'maintenance', vehicleId: 1 },
    { kind: 'maintenance', itemId: 0 },
    { kind: 'maintenance', itemId: -3 },
    { kind: 'maintenance', itemId: 1.5 },
    { kind: 'maintenance', itemId: 'abc' },
    { kind: 'desconhecido' },
    {},
  ])('cai na Home quando os dados não apontam para um item: %j', (data) => {
    expect(resolveNotificationTarget(data)).toEqual({ pathname: '/' });
  });

  it.each([null, undefined, 'texto', 42, []])('cai na Home para dados inválidos: %j', (data) => {
    expect(resolveNotificationTarget(data)).toEqual({ pathname: '/' });
  });
});

import Storage from 'expo-sqlite/kv-store';

import { NotificationSettingsRepository } from '@/data/repositories/notification-settings-repository';
import { DEFAULT_WEEKLY_REMINDER } from '@/domain';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
  },
}));

const getItemAsync = Storage.getItemAsync as jest.MockedFunction<typeof Storage.getItemAsync>;
const setItemAsync = Storage.setItemAsync as jest.MockedFunction<typeof Storage.setItemAsync>;

const WEEKLY_KEY = 'notifications.weeklyReminder';

describe('NotificationSettingsRepository', () => {
  let repository: NotificationSettingsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemAsync.mockResolvedValue(null);
    setItemAsync.mockResolvedValue(undefined);
    repository = new NotificationSettingsRepository();
  });

  describe('weekly reminder', () => {
    it('retorna o padrão quando nada foi salvo', async () => {
      await expect(repository.getWeeklyReminder()).resolves.toEqual(DEFAULT_WEEKLY_REMINDER);
      expect(getItemAsync).toHaveBeenCalledWith(WEEKLY_KEY);
    });

    it('retorna o horário salvo', async () => {
      getItemAsync.mockResolvedValue(JSON.stringify({ weekday: 6, hour: 18, minute: 30 }));

      await expect(repository.getWeeklyReminder()).resolves.toEqual({
        weekday: 6,
        hour: 18,
        minute: 30,
      });
    });

    it('volta ao padrão quando o JSON está corrompido', async () => {
      getItemAsync.mockResolvedValue('{não é json');

      await expect(repository.getWeeklyReminder()).resolves.toEqual(DEFAULT_WEEKLY_REMINDER);
    });

    it('volta ao padrão quando o valor salvo é inválido', async () => {
      getItemAsync.mockResolvedValue(JSON.stringify({ weekday: 9, hour: 9, minute: 0 }));

      await expect(repository.getWeeklyReminder()).resolves.toEqual(DEFAULT_WEEKLY_REMINDER);
    });

    it('salva o horário como JSON', async () => {
      await repository.setWeeklyReminder({ weekday: 3, hour: 7, minute: 15 });

      expect(setItemAsync).toHaveBeenCalledWith(
        WEEKLY_KEY,
        JSON.stringify({ weekday: 3, hour: 7, minute: 15 }),
      );
    });
  });

  describe('permission prompt flag', () => {
    it('começa como não solicitada e grava a marcação', async () => {
      await expect(repository.hasPromptedPermission()).resolves.toBe(false);

      getItemAsync.mockResolvedValue('true');
      await expect(repository.hasPromptedPermission()).resolves.toBe(true);

      await repository.markPermissionPrompted();
      expect(setItemAsync).toHaveBeenCalledWith('notifications.permissionPrompted', 'true');
    });
  });

  describe('enabled flag', () => {
    it('é verdadeiro por padrão, quando nunca foi gravado', async () => {
      await expect(repository.isEnabled()).resolves.toBe(true);
      expect(getItemAsync).toHaveBeenCalledWith('notifications.enabled');
    });

    it('respeita um desligamento explícito', async () => {
      getItemAsync.mockResolvedValue('false');
      await expect(repository.isEnabled()).resolves.toBe(false);

      getItemAsync.mockResolvedValue('true');
      await expect(repository.isEnabled()).resolves.toBe(true);
    });

    it('persiste true/false como texto', async () => {
      await repository.setEnabled(true);
      expect(setItemAsync).toHaveBeenLastCalledWith('notifications.enabled', 'true');

      await repository.setEnabled(false);
      expect(setItemAsync).toHaveBeenLastCalledWith('notifications.enabled', 'false');
    });
  });
});

import type { NotificationPermissionInfo } from '../permissions';
import {
  type InitialPermissionDeps,
  promptForNotificationPermissionOnce,
} from '../initial-permission';

const GRANTED: NotificationPermissionInfo = { state: 'granted', canAskAgain: true };
const DENIED: NotificationPermissionInfo = { state: 'denied', canAskAgain: true };

function makeDeps(overrides: {
  prompted?: boolean;
  enabled?: boolean;
  permission?: NotificationPermissionInfo;
}): InitialPermissionDeps & {
  setEnabled: jest.Mock;
  markPermissionPrompted: jest.Mock;
  ensurePermission: jest.Mock;
  refresh: jest.Mock;
} {
  const setEnabled = jest.fn().mockResolvedValue(undefined);
  const markPermissionPrompted = jest.fn().mockResolvedValue(undefined);
  const ensurePermission = jest.fn().mockResolvedValue(overrides.permission ?? GRANTED);
  const refresh = jest.fn().mockResolvedValue({ scheduledCount: 1, error: null });

  return {
    settings: {
      isEnabled: jest.fn().mockResolvedValue(overrides.enabled ?? true),
      setEnabled,
      hasPromptedPermission: jest.fn().mockResolvedValue(overrides.prompted ?? false),
      markPermissionPrompted,
    },
    ensurePermission,
    refresh,
    setEnabled,
    markPermissionPrompted,
  };
}

describe('promptForNotificationPermissionOnce', () => {
  it('pede a permissão na primeira abertura e agenda quando concedida', async () => {
    const deps = makeDeps({ permission: GRANTED });

    await promptForNotificationPermissionOnce(deps);

    expect(deps.ensurePermission).toHaveBeenCalledTimes(1);
    expect(deps.markPermissionPrompted).toHaveBeenCalledTimes(1);
    expect(deps.refresh).toHaveBeenCalledTimes(1);
    expect(deps.setEnabled).not.toHaveBeenCalled();
  });

  it('desliga os lembretes quando a permissão é negada', async () => {
    const deps = makeDeps({ permission: DENIED });

    await promptForNotificationPermissionOnce(deps);

    expect(deps.markPermissionPrompted).toHaveBeenCalledTimes(1);
    expect(deps.setEnabled).toHaveBeenCalledWith(false);
    expect(deps.refresh).not.toHaveBeenCalled();
  });

  it('não pede de novo depois da primeira vez', async () => {
    const deps = makeDeps({ prompted: true });

    await promptForNotificationPermissionOnce(deps);

    expect(deps.ensurePermission).not.toHaveBeenCalled();
    expect(deps.markPermissionPrompted).not.toHaveBeenCalled();
  });

  it('não pede quando o usuário desligou os lembretes explicitamente', async () => {
    const deps = makeDeps({ enabled: false });

    await promptForNotificationPermissionOnce(deps);

    expect(deps.ensurePermission).not.toHaveBeenCalled();
    expect(deps.markPermissionPrompted).not.toHaveBeenCalled();
  });

  it('marca como solicitada mesmo se o sistema não puder mais perguntar', async () => {
    const deps = makeDeps({
      permission: { state: 'denied', canAskAgain: false },
    });

    await promptForNotificationPermissionOnce(deps);

    expect(deps.markPermissionPrompted).toHaveBeenCalledTimes(1);
    expect(deps.setEnabled).toHaveBeenCalledWith(false);
  });
});

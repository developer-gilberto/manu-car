import type { NotificationSettingsRepository } from '@/data/repositories/notification-settings-repository';

import { type NotificationPermissionInfo, ensureNotificationPermission } from './permissions';
import { refreshScheduledNotifications } from './scheduler';

export interface InitialPermissionDeps {
  settings: Pick<
    NotificationSettingsRepository,
    'isEnabled' | 'setEnabled' | 'hasPromptedPermission' | 'markPermissionPrompted'
  >;
  ensurePermission: () => Promise<NotificationPermissionInfo>;
  refresh: () => Promise<unknown>;
}

/**
 * Pede a permissão de notificações uma única vez, na primeira abertura do app.
 *
 * - Se o usuário conceder, agenda os lembretes.
 * - Se negar, desliga os lembretes para o switch refletir a situação. Ele pode
 *   religar em Configurações, onde o app explica como liberar a permissão.
 * - Se os lembretes estiverem desligados explicitamente, não pede nada.
 */
export async function promptForNotificationPermissionOnce(
  deps: InitialPermissionDeps,
): Promise<void> {
  if (await deps.settings.hasPromptedPermission()) {
    return;
  }

  if (!(await deps.settings.isEnabled())) {
    return;
  }

  const permission = await deps.ensurePermission();

  await deps.settings.markPermissionPrompted();

  if (permission.state === 'granted') {
    await deps.refresh();
    return;
  }

  await deps.settings.setEnabled(false);
}

let inFlight: Promise<void> | null = null;

/**
 * Versão para o app: usa o repositório real e garante uma única execução por
 * sessão, mesmo se o componente montar mais de uma vez.
 */
export function requestNotificationPermissionOnFirstRun(
  settings: InitialPermissionDeps['settings'],
): Promise<void> {
  inFlight ??= promptForNotificationPermissionOnce({
    settings,
    ensurePermission: ensureNotificationPermission,
    refresh: () => refreshScheduledNotifications(),
  }).finally(() => {
    inFlight = null;
  });

  return inFlight;
}

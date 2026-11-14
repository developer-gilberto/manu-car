import { useEffect } from 'react';

import { getRepositories } from '@/data/repositories';

import { requestNotificationPermissionOnFirstRun } from './initial-permission';

/**
 * Dispara o pedido de permissão de notificações logo que o app abre pela
 * primeira vez. Fica dentro do DatabaseGate para só agir com o banco pronto.
 */
export function InitialNotificationPermissionPrompt() {
  useEffect(() => {
    const { notificationSettings } = getRepositories();

    requestNotificationPermissionOnFirstRun(notificationSettings).catch(() => {
      // Falhas aqui não devem travar o app; o usuário pode ativar em Configurações.
    });
  }, []);

  return null;
}

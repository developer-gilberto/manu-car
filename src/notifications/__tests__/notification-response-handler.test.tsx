import { render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { NotificationResponseHandler } from '../notification-response-handler';

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  clearLastNotificationResponse: jest.fn(),
  useLastNotificationResponse: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
}));

const useLastNotificationResponseMock = Notifications.useLastNotificationResponse as jest.Mock;
const clearLastNotificationResponseMock = Notifications.clearLastNotificationResponse as jest.Mock;
const navigateMock = router.navigate as jest.Mock;

function buildResponse(
  data: Record<string, unknown>,
  actionIdentifier: string = Notifications.DEFAULT_ACTION_IDENTIFIER,
): Notifications.NotificationResponse {
  return {
    actionIdentifier,
    notification: {
      date: 0,
      request: {
        identifier: 'notification-id',
        content: { data },
        trigger: null,
      },
    },
  } as unknown as Notifications.NotificationResponse;
}

async function renderHandler(): Promise<void> {
  await render(<NotificationResponseHandler />);
}

describe('NotificationResponseHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('abre o detalhe do item e limpa a resposta', async () => {
    useLastNotificationResponseMock.mockReturnValue(
      buildResponse({ kind: 'maintenance', itemId: 5 }),
    );

    await renderHandler();

    expect(navigateMock).toHaveBeenCalledWith({
      pathname: '/items/[id]',
      params: { id: '5' },
    });
    expect(clearLastNotificationResponseMock).toHaveBeenCalledTimes(1);
  });

  it('abre a Home no aviso de teste', async () => {
    useLastNotificationResponseMock.mockReturnValue(buildResponse({ kind: 'test' }));

    await renderHandler();

    expect(navigateMock).toHaveBeenCalledWith({ pathname: '/' });
  });

  it('abre a Home no lembrete semanal', async () => {
    useLastNotificationResponseMock.mockReturnValue(buildResponse({ kind: 'weekly-odometer' }));

    await renderHandler();

    expect(navigateMock).toHaveBeenCalledWith({ pathname: '/' });
  });

  it('ignora ações que não são o toque padrão', async () => {
    useLastNotificationResponseMock.mockReturnValue(
      buildResponse({ kind: 'maintenance', itemId: 5 }, 'outra-acao'),
    );

    await renderHandler();

    expect(navigateMock).not.toHaveBeenCalled();
    expect(clearLastNotificationResponseMock).not.toHaveBeenCalled();
  });

  it('não faz nada sem resposta', async () => {
    useLastNotificationResponseMock.mockReturnValue(null);

    await renderHandler();

    expect(navigateMock).not.toHaveBeenCalled();
    expect(clearLastNotificationResponseMock).not.toHaveBeenCalled();
  });
});

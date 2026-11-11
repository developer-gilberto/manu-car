import { render, screen } from '@testing-library/react-native';

import { WelcomeScreen } from '@/components/welcome-screen';

describe('WelcomeScreen', () => {
  it('exibe a saudação do app', async () => {
    await render(<WelcomeScreen />);

    expect(screen.getByText('Olá, ManuCar!')).toBeOnTheScreen();
    expect(screen.getByText('Seus lembretes de manutenção veicular.')).toBeOnTheScreen();
  });
});

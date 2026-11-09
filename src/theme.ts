import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: '#0F766E',
  primaryDark: '#115E59',
  primarySoft: '#CCFBF1',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  success: '#15803D',
  successSoft: '#DCFCE7',
  overlay: 'rgba(15, 23, 42, 0.45)',
  white: '#FFFFFF',
};

export type Palette = typeof lightColors;

const darkColors: Palette = {
  background: '#0B1120',
  surface: '#111827',
  surfaceMuted: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  primary: '#0F766E',
  primaryDark: '#5EEAD4',
  primarySoft: '#134E4A',
  danger: '#F87171',
  dangerSoft: '#450A0A',
  warning: '#FBBF24',
  warningSoft: '#3A2A07',
  warningBorder: '#78350F',
  warningText: '#FDE68A',
  success: '#4ADE80',
  successSoft: '#052E16',
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#FFFFFF',
};

/** Paleta clara. Usada fora de componentes React (ex.: canal de notificação). */
export const colors: Palette = lightColors;

/** Paleta do esquema atual do sistema (claro ou escuro). */
export function useThemeColors(): Palette {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/**
 * Recria os estilos quando o esquema de cores muda.
 * `factory` deve ser declarada no nível do módulo (referência estável).
 */
export function useThemedStyles<T>(factory: (palette: Palette) => T): T {
  const palette = useThemeColors();

  return useMemo(() => factory(palette), [factory, palette]);
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

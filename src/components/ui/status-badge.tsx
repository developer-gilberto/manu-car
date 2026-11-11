import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { MaintenanceStatus } from '@/domain';
import { type Palette, useThemeColors } from '@/theme';
import { statusLabel } from '@/utils/maintenance-view';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const STATUS_ICONS: Record<MaintenanceStatus, FeatherIconName> = {
  ok: 'check-circle',
  atencao: 'alert-triangle',
  vencido: 'alert-circle',
};

function statusColors(colors: Palette): Record<MaintenanceStatus, string> {
  return {
    ok: colors.success,
    atencao: colors.warning,
    vencido: colors.danger,
  };
}

/** Ícone de status. O texto fica só como rótulo de acessibilidade. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useThemeColors();

  return (
    <View accessibilityLabel={statusLabel(status)} accessibilityRole="image" style={styles.badge}>
      <Feather color={statusColors(colors)[status]} name={STATUS_ICONS[status]} size={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    padding: 2,
  },
});

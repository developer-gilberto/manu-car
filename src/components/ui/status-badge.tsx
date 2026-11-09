import { StyleSheet, Text, View } from 'react-native';

import type { MaintenanceStatus } from '@/domain';
import { type Palette, radius, spacing, useThemeColors, useThemedStyles } from '@/theme';
import { statusLabel } from '@/utils/maintenance-view';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

function statusStyles(colors: Palette) {
  return {
    ok: {
      backgroundColor: colors.successSoft,
      color: colors.success,
    },
    atencao: {
      backgroundColor: colors.warningSoft,
      color: colors.warning,
    },
    vencido: {
      backgroundColor: colors.dangerSoft,
      color: colors.danger,
    },
  } as const;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const statusStyle = statusStyles(colors)[status];

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: statusStyle.color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
    },
  });

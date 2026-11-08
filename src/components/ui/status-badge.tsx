import { StyleSheet, Text, View } from 'react-native';

import type { MaintenanceStatus } from '@/domain';
import { colors, radius, spacing } from '@/theme';
import { statusLabel } from '@/utils/maintenance-view';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

const STATUS_STYLES = {
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

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: statusStyle.color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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

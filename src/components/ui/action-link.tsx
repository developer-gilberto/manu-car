import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { type Palette, spacing, useThemedStyles, useThemeColors } from '@/theme';

interface ActionLinkProps {
  href: Href;
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
}

export function ActionLink({ href, label, icon }: ActionLinkProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  return (
    <Link asChild href={href}>
      <Pressable hitSlop={8} style={styles.container}>
        {icon ? <Feather color={colors.primary} name={icon} size={16} /> : null}
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    label: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
  });

import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { type Palette, useThemedStyles } from '@/theme';

interface ActionLinkProps {
  href: Href;
  label: string;
}

export function ActionLink({ href, label }: ActionLinkProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Link asChild href={href}>
      <Pressable hitSlop={8}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    label: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
  });

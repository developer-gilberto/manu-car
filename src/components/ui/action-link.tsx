import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme';

interface ActionLinkProps {
  href: Href;
  label: string;
}

export function ActionLink({ href, label }: ActionLinkProps) {
  return (
    <Link asChild href={href}>
      <Pressable hitSlop={8}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});

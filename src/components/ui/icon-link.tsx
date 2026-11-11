import { Feather } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useThemeColors } from '@/theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface IconLinkProps {
  href: Href;
  icon: FeatherIconName;
  accessibilityLabel: string;
}

export function IconLink({ href, icon, accessibilityLabel }: IconLinkProps) {
  const colors = useThemeColors();
  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="link"
        hitSlop={8}
        style={styles.button}
      >
        <Feather color={colors.primary} name={icon} size={22} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});

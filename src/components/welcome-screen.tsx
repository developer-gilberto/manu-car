import { StyleSheet, Text, View } from 'react-native';

import { type Palette, useThemedStyles } from '@/theme';

export function WelcomeScreen() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, Manu Car!</Text>
      <Text style={styles.subtitle}>Seus lembretes de manutenção veicular.</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

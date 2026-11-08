import { StyleSheet, Text, View } from 'react-native';

export function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, Manu Car!</Text>
      <Text style={styles.subtitle}>Seus lembretes de manutenção veicular.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
});

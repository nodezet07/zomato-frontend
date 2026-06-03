import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { registerWithEmailPassword } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRegister() {
    try {
      setBusy(true);
      setError(null);
      await registerWithEmailPassword({
        fullName: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim() || undefined,
        password,
      });
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Create account</ThemedText>
        <ThemedText themeColor="textSecondary">Start ordering in minutes.</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { color: theme.text }]}
          />
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="Mobile (optional)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            style={[styles.input, { color: theme.text }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            style={[styles.input, { color: theme.text }]}
          />

          {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable disabled={busy} onPress={onRegister} style={styles.primaryBtn}>
            <ThemedText type="linkPrimary">{busy ? 'Creating…' : 'Create account'}</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
            <ThemedText type="small">Back to login</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  card: {
    marginTop: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.25)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  primaryBtn: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#208AEF',
  },
  secondaryBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  error: { color: '#E5484D', marginTop: Spacing.one },
});


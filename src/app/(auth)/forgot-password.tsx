import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { forgotPassword, resetPassword } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    if (!email.trim()) {
      Alert.alert('Email', 'Enter your registered email.');
      return;
    }
    try {
      setBusy(true);
      await forgotPassword(email.trim().toLowerCase());
      setStep('reset');
      Alert.alert('OTP sent', 'Check your email for the reset code.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (otp.length !== 6 || password.length < 6) {
      Alert.alert('Invalid', 'Enter 6-digit OTP and password (min 6 chars).');
      return;
    }
    try {
      setBusy(true);
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword: password,
      });
      Alert.alert('Success', 'Password updated. Please login.');
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText>‹ Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">Reset password</ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          editable={step === 'email'}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />

        {step === 'reset' ? (
          <>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              secureTextEntry
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
            />
          </>
        ) : null}

        <Pressable
          disabled={busy}
          onPress={step === 'email' ? sendOtp : reset}
          style={[styles.btn, { backgroundColor: theme.primary }, busy && { opacity: 0.7 }]}
        >
          <ThemedText style={styles.btnText}>{busy ? 'Please wait…' : step === 'email' ? 'Send OTP' : 'Update password'}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: 12 },
  back: { marginBottom: 8 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
});

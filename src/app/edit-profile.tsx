import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { profileKeys, useProfileQuery } from '@/hooks/queries/profile';
import { updateProfile } from '@/services/profile';

export default function EditProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const profileQ = useProfileQuery();
  const user = profileQ.data;

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(user.fullName ?? user.name ?? '');
      setMobile(user.mobile ?? user.phone ?? '');
    }
  }, [user]);

  const save = useMutation({
    mutationFn: () => updateProfile({ fullName: fullName.trim(), mobile: mobile.trim() || undefined }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileKeys.me });
      Alert.alert('Saved', 'Profile updated.');
      router.back();
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()}>
            <ThemedText>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Edit profile</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          placeholder="Mobile (10 digits)"
          keyboardType="phone-pad"
          maxLength={10}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
          Email: {user?.email ?? '—'}
        </ThemedText>

        <Pressable
          disabled={save.isPending}
          onPress={() => save.mutate()}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.btnText}>{save.isPending ? 'Saving…' : 'Save changes'}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.35)',
    padding: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  btn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
});

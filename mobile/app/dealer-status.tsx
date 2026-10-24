import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StatusPill } from '@/components/ui';
import { colors } from '@/constants/theme';
import { logout } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

/** Holding screen for dealers whose application isn't approved yet. */
export default function DealerStatus() {
  const { dealer, refresh } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const status = dealer?.status ?? 'pending';

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);
  useEffect(() => { if (status === 'approved') router.replace('/(tabs)'); }, [status]);

  const check = async () => { setBusy(true); try { await refresh(); } finally { setBusy(false); } };
  const signOut = async () => { await logout(); router.replace('/(auth)/login'); };

  return (
    <SafeAreaView style={s.root}>
      <View style={[s.circle, { backgroundColor: status === 'rejected' ? colors.danger : colors.warning }]}>
        <Ionicons name={status === 'rejected' ? 'close' : 'time'} size={56} color="#fff" />
      </View>
      <Text style={s.title}>{status === 'rejected' ? 'Application rejected' : 'Awaiting approval'}</Text>
      <StatusPill status={status} />
      <Text style={s.sub}>
        {status === 'rejected'
          ? 'Your dealer application was not approved. Please contact Califnco support for details.'
          : `Thanks ${dealer?.contactName ?? ''}! Our team is reviewing ${dealer?.businessName ?? 'your business'}. Wholesale ordering unlocks as soon as an admin approves you.`}
      </Text>
      <View style={{ width: '100%', gap: 10, marginTop: 28 }}>
        <Button title="Check status" icon="refresh" onPress={check} loading={busy} />
        <Button title="Sign out" variant="outline" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#fff', gap: 12 },
  circle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  sub: { color: colors.muted, textAlign: 'center', lineHeight: 22 },
});

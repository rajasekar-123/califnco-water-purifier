import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { Button, Card, Chip, Input, StatusPill } from '@/components/ui';
import { colors } from '@/constants/theme';
import { createServiceBooking, fetchServiceBookings } from '@/services/userDataService';
import { useAuthStore } from '@/store/authStore';
import type { ServiceBooking } from '@/types';

const TYPES: { key: ServiceBooking['serviceType']; label: string }[] = [
  { key: 'installation', label: 'Installation' },
  { key: 'repair', label: 'Repair' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'filter_change', label: 'Filter change' },
];

export default function ServiceBookingScreen() {
  const { uid, profile } = useAuthStore();
  const [type, setType] = useState<ServiceBooking['serviceType']>('installation');
  const [f, setF] = useState({ productName: '', preferredDate: '', address: '', notes: '', phone: profile?.phone ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<(ServiceBooking & { id: string })[]>([]);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const load = () => { if (uid) fetchServiceBookings(uid).then(setHistory).catch(() => {}); };
  useEffect(load, [uid]);

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.preferredDate) || Number.isNaN(Date.parse(f.preferredDate))) errs.preferredDate = 'Use YYYY-MM-DD.';
    else if (Date.parse(f.preferredDate) < Date.now() - 86_400_000) errs.preferredDate = 'Choose a future date.';
    if (!/^[6-9]\d{9}$/.test(f.phone)) errs.phone = 'Enter a valid 10-digit number.';
    if (f.address.trim().length < 8) errs.address = 'Enter the service address.';
    setErrors(errs);
    if (Object.keys(errs).length || !uid) return;
    setBusy(true);
    try {
      await createServiceBooking({
        uid, customerName: profile?.name ?? '', phone: f.phone, serviceType: type,
        productName: f.productName.trim() || undefined, preferredDate: f.preferredDate,
        notes: f.notes.trim() || undefined, address: f.address.trim(),
      });
      setMsg({ ok: true, text: 'Service request sent. Our team will confirm shortly.' });
      setF((p) => ({ ...p, productName: '', notes: '', preferredDate: '' }));
      load();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Book a service" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>Service type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 16 }}>
          {TYPES.map((t) => <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(t.key)} />)}
        </View>
        <Input label="Product / model (optional)" value={f.productName} onChangeText={set('productName')} />
        <Input label="Preferred date (YYYY-MM-DD)" value={f.preferredDate} onChangeText={set('preferredDate')} placeholder="2026-11-05" keyboardType="numbers-and-punctuation" error={errors.preferredDate} />
        <Input label="Contact phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
        <Input label="Service address" value={f.address} onChangeText={set('address')} multiline error={errors.address} />
        <Input label="Notes (optional)" value={f.notes} onChangeText={set('notes')} multiline />
        {msg && <Text style={{ color: msg.ok ? colors.success : colors.danger, marginBottom: 12 }}>{msg.text}</Text>}
        <Button title="Request service" onPress={submit} loading={busy} />

        {history.length > 0 && (
          <>
            <Text style={[s.h, { marginTop: 28 }]}>Your requests</Text>
            {history.map((b) => (
              <Card key={b.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', color: colors.navy, textTransform: 'capitalize' }}>{b.serviceType.replace('_', ' ')}</Text>
                  <StatusPill status={b.status} />
                </View>
                <Text style={{ color: colors.muted, marginTop: 4 }}>{b.preferredDate} · {b.productName ?? 'Any product'}</Text>
              </Card>
            ))}
          </>
        )}
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({ h: { fontSize: 17, fontWeight: '800', color: colors.navy, marginBottom: 10 } });

import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { Button, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { validate } from '@/constants/validation';
import { updateProfile } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function ProfileEdit() {
  const { profile, uid, refresh } = useAuthStore();
  const [f, setF] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const errs = validate(f, ['name', 'phone']);
    setErrors(errs);
    if (Object.keys(errs).length || !uid) return;
    setBusy(true);
    try {
      await updateProfile(uid, { name: f.name.trim(), phone: f.phone.trim() });
      await refresh();
      router.back();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Edit profile" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Input label="Full name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} autoCapitalize="words" error={errors.name} />
        <Input label="Phone" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
        <Input label="Email (cannot be changed)" value={profile?.email ?? ''} editable={false} />
        {msg ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{msg}</Text> : null}
        <Button title="Save changes" onPress={save} loading={busy} />
      </ScrollView>
    </View>
  );
}

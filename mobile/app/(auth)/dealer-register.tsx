import { useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { firebaseConfigured } from '@/services/firebase';
import { friendlyAuthError, registerDealer } from '@/services/authService';
import { validate } from '@/constants/validation';
import { useAuthStore } from '@/store/authStore';

export default function DealerRegister() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', businessName: '', gstNumber: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const errs = validate(f, ['name', 'email', 'phone', 'password', 'businessName', 'city']);
    if (f.gstNumber && !/^[0-9A-Z]{15}$/i.test(f.gstNumber.trim())) errs.gstNumber = 'GSTIN must be 15 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!firebaseConfigured) return setFormError('Firebase is not configured (see .env.example).');
    setBusy(true);
    setFormError('');
    try {
      await registerDealer(f);
      await useAuthStore.getState().refresh();
      router.replace('/dealer-status');
    } catch (e) {
      setFormError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Dealer application" subtitle="Wholesale access after admin approval">
      <Input label="Business name" value={f.businessName} onChangeText={set('businessName')} autoCapitalize="words" error={errors.businessName} />
      <Input label="GSTIN (optional)" value={f.gstNumber} onChangeText={set('gstNumber')} autoCapitalize="characters" maxLength={15} error={errors.gstNumber} />
      <Input label="City" value={f.city} onChangeText={set('city')} autoCapitalize="words" error={errors.city} />
      <Input label="Contact name" value={f.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
      <Input label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" error={errors.email} />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
      <Input label="Password" value={f.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
      {formError ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{formError}</Text> : null}
      <Button title="Submit application" onPress={submit} loading={busy} />
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 18 }}>
        Already applied? <Link href="/(auth)/login" style={{ color: colors.aquaDark, fontWeight: '700' }}>Sign in</Link>
      </Text>
    </AuthShell>
  );
}

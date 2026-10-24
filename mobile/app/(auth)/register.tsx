import { useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { firebaseConfigured } from '@/services/firebase';
import { friendlyAuthError, registerCustomer } from '@/services/authService';
import { validate } from '@/constants/validation';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const errs = validate(f, ['name', 'email', 'phone', 'password']);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!firebaseConfigured) return setFormError('Firebase is not configured (see .env.example).');
    setBusy(true);
    setFormError('');
    try {
      await registerCustomer(f.name, f.email, f.password, f.phone);
      await useAuthStore.getState().refresh();
      router.replace('/');
    } catch (e) {
      setFormError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Shop purifiers, parts and service">
      <Input label="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
      <Input label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" error={errors.email} />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
      <Input label="Password" value={f.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
      {formError ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{formError}</Text> : null}
      <Button title="Register" onPress={submit} loading={busy} />
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 18 }}>
        Have an account? <Link href="/(auth)/login" style={{ color: colors.aquaDark, fontWeight: '700' }}>Sign in</Link>
      </Text>
    </AuthShell>
  );
}

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { firebaseConfigured } from '@/services/firebase';
import { friendlyAuthError, login } from '@/services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return setError('Enter your email and password.');
    if (!firebaseConfigured) return setError('Firebase is not configured (see .env.example).');
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/');
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue">
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      <Button title="Sign in" onPress={submit} loading={busy} />
      <View style={{ marginTop: 18, gap: 12, alignItems: 'center' }}>
        <Link href="/(auth)/forgot-password" style={{ color: colors.aquaDark, fontWeight: '600' }}>Forgot password?</Link>
        <Text style={{ color: colors.muted }}>
          New here? <Link href="/(auth)/register" style={{ color: colors.aquaDark, fontWeight: '700' }}>Create account</Link>
        </Text>
        <Text style={{ color: colors.muted }}>
          Water-purifier dealer? <Link href="/(auth)/dealer-register" style={{ color: colors.aquaDark, fontWeight: '700' }}>Apply as dealer</Link>
        </Text>
      </View>
    </AuthShell>
  );
}

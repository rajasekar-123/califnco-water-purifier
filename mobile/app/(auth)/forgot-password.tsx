import { useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { colors } from '@/constants/theme';
import { friendlyAuthError, resetPassword } from '@/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMsg({ ok: false, text: 'Enter a valid email address.' });
    setBusy(true);
    try {
      await resetPassword(email);
      setMsg({ ok: true, text: 'If an account exists, a reset link has been emailed.' });
    } catch (e) {
      setMsg({ ok: false, text: friendlyAuthError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link">
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      {msg && <Text style={{ color: msg.ok ? colors.success : colors.danger, marginBottom: 12 }}>{msg.text}</Text>}
      <Button title="Send reset link" onPress={submit} loading={busy} />
      <Text style={{ textAlign: 'center', marginTop: 18 }}>
        <Link href="/(auth)/login" style={{ color: colors.aquaDark, fontWeight: '700' }}>Back to sign in</Link>
      </Text>
    </AuthShell>
  );
}

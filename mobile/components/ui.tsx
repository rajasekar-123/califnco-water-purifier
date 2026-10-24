import { useEffect, type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/constants/theme';

export function Button({
  title, onPress, loading, disabled, variant = 'primary', icon, style,
}: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'; icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle>;
}) {
  const filled = variant === 'primary' || variant === 'danger';
  const bg = variant === 'danger' ? colors.danger : colors.aquaDark;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        filled && { backgroundColor: bg },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.aquaDark },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? '#fff' : colors.aquaDark} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={filled ? '#fff' : colors.aquaDark} style={{ marginRight: 8 }} />}
          <Text style={[s.btnText, { color: filled ? '#fff' : colors.aquaDark }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Input({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        {...props}
        style={[s.input, error ? { borderColor: colors.danger } : null, props.style]}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.navy, borderColor: colors.navy }]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Skeleton({ width, height, style }: { width?: number | `${number}%`; height: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: width ?? '100%', height, borderRadius: radius.md, backgroundColor: '#DCE5EF' }, anim, style]} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
      <Text style={[s.muted, { marginVertical: 10, textAlign: 'center' }]}>{message}</Text>
      {onRetry && <Button title="Try again" variant="outline" onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; hint?: string; action?: ReactNode }) {
  return (
    <View style={s.center}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={36} color={colors.aquaDark} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      {hint && <Text style={[s.muted, { textAlign: 'center', marginBottom: 14 }]}>{hint}</Text>}
      {action}
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: '#2563EB', confirmed: '#4F46E5', shipped: colors.warning, delivered: colors.success,
    cancelled: colors.danger, pending: colors.warning, approved: colors.success, rejected: colors.danger,
    requested: '#2563EB', scheduled: '#4F46E5', completed: colors.success,
  };
  const c = map[status] ?? colors.muted;
  return (
    <View style={{ backgroundColor: c + '22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <Text style={{ color: c, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

export function QtyStepper({ qty, onChange, min = 1, max }: { qty: number; onChange: (q: number) => void; min?: number; max?: number }) {
  return (
    <View style={s.stepper}>
      <Pressable hitSlop={8} onPress={() => onChange(qty - 1 < min ? 0 : qty - 1)} style={s.stepBtn}>
        <Ionicons name={qty <= min ? 'trash-outline' : 'remove'} size={16} color={colors.navy} />
      </Pressable>
      <Text style={s.stepQty}>{qty}</Text>
      <Pressable hitSlop={8} disabled={max !== undefined && qty >= max} onPress={() => onChange(qty + 1)} style={[s.stepBtn, max !== undefined && qty >= max && { opacity: 0.3 }]}>
        <Ionicons name="add" size={16} color={colors.navy} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  btn: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingHorizontal: 20 },
  btnText: { fontWeight: '700', fontSize: 16 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 6, fontSize: 13 },
  input: { height: 50, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', marginRight: 8 },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: colors.muted, fontSize: 14 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.aquaSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  stepBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: 26, textAlign: 'center', fontWeight: '700', color: colors.navy },
});

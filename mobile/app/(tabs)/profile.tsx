import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui';
import { colors, radius, shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { logout } from '@/services/authService';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

export default function Profile() {
  const { profile, dealer } = useAuthStore();

  const items: Item[] = [
    { icon: 'person-outline', label: 'Edit profile', onPress: () => router.push('/profile-edit') },
    { icon: 'location-outline', label: 'Saved addresses', onPress: () => router.push('/addresses') },
    { icon: 'receipt-outline', label: 'Order history', onPress: () => router.push('/(tabs)/orders') },
    { icon: 'construct-outline', label: 'Book a service', onPress: () => router.push('/service-booking') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
    ...(profile?.referralCode
      ? [{
          icon: 'gift-outline' as const, label: `Invite friends · ${profile.referralCode}`,
          onPress: () => Share.share({ message: `Join me on Califnco for water purifiers! Use my code ${profile.referralCode}.` }),
        }]
      : []),
  ];

  const signOut = () =>
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { useCartStore.getState().clear(); await logout(); router.replace('/(auth)/login'); } },
    ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={s.head}>
          <View style={s.avatar}><Text style={s.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{profile?.name}</Text>
            <Text style={s.email}>{profile?.email}</Text>
            <Text style={s.email}>{profile?.phone}</Text>
          </View>
        </View>
        {profile?.role === 'dealer' && dealer && (
          <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View><Text style={s.dim}>Dealer account</Text><Text style={s.bold}>{dealer.businessName}</Text></View>
            <StatusPill status={dealer.status} />
          </View>
        )}
        <View style={s.card}>
          {items.map((it, i) => (
            <Pressable key={it.label} style={[s.item, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={it.onPress}>
              <Ionicons name={it.icon} size={22} color={colors.aquaDark} />
              <Text style={s.itemText}>{it.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
        <Pressable style={[s.card, s.item, { justifyContent: 'center' }]} onPress={signOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={[s.itemText, { flex: 0, color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.aquaDark, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.navy },
  email: { color: colors.muted, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, paddingHorizontal: 16, marginBottom: 14, ...shadow },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 12 },
  itemText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  dim: { color: colors.muted, fontSize: 12, marginTop: 12 },
  bold: { fontWeight: '800', color: colors.navy, fontSize: 16, marginBottom: 12 },
});

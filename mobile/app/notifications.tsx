import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/Header';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { colors, radius, shadow } from '@/constants/theme';
import { useNotifications } from '@/hooks/useOrders';
import { markNotificationRead } from '@/services/userDataService';

export default function Notifications() {
  const { notifications, loading, error } = useNotifications();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Notifications" />
      {loading ? (
        <View style={{ padding: 16, gap: 10 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}</View>
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="All caught up" hint="Order and service updates will show up here." />}
          renderItem={({ item: n }) => (
            <Pressable style={[s.card, !n.read && s.unread]} onPress={() => !n.read && markNotificationRead(n.id)}>
              <Ionicons name={n.read ? 'notifications-outline' : 'notifications'} size={22} color={colors.aquaDark} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.title}>{n.title}</Text>
                <Text style={s.body}>{n.body}</Text>
                <Text style={s.time}>{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 10, ...shadow },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.aquaDark },
  title: { fontWeight: '800', color: colors.navy },
  body: { color: colors.text, marginTop: 2 },
  time: { color: colors.muted, fontSize: 11, marginTop: 6 },
});

import { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AddressForm } from '@/components/AddressForm';
import { Header } from '@/components/Header';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { colors, radius, shadow } from '@/constants/theme';
import { useAddresses } from '@/hooks/useOrders';
import { removeAddress } from '@/services/userDataService';

export default function Addresses() {
  const { addresses, loading, error } = useAddresses();
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Header title="New address" />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <AddressForm onSaved={() => setAdding(false)} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header title="Saved addresses" />
      {loading ? (
        <View style={{ padding: 16 }}><Skeleton height={100} /></View>
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<EmptyState icon="location-outline" title="No saved addresses" hint="Add a delivery address to check out faster." />}
          renderItem={({ item: a }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{a.label}</Text>
                <Text style={s.line}>{a.fullName} · {a.phone}</Text>
                <Text style={s.line}>{a.line1}, {a.city}, {a.state} {a.pincode}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => Alert.alert('Delete address', 'Remove this address?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeAddress(a.id) },
                ])}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
      <View style={{ padding: 16 }}><Button title="Add new address" icon="add" onPress={() => setAdding(true)} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow },
  label: { fontWeight: '800', color: colors.navy, marginBottom: 4 },
  line: { color: colors.text, marginTop: 2 },
});

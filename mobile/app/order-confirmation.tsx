import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function OrderConfirmation() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return (
    <SafeAreaView style={s.root}>
      <Animated.View entering={ZoomIn.springify()} style={s.circle}>
        <Ionicons name="checkmark" size={64} color="#fff" />
      </Animated.View>
      <Text style={s.title}>Order confirmed!</Text>
      <Text style={s.sub}>Payment verified. Order #{orderId?.slice(-8)} has been placed — you'll get updates as it ships.</Text>
      <View style={{ width: '100%', gap: 10, marginTop: 28 }}>
        <Button title="View my orders" onPress={() => router.replace('/(tabs)/orders')} />
        <Button title="Continue shopping" variant="outline" onPress={() => router.replace('/(tabs)')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
  circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.navy, marginTop: 24 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});

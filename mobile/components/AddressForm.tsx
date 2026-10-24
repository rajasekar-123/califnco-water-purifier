import { useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, Input } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { validate } from '@/constants/validation';
import { currentLocationAddress, osmMapHtml, reverseGeocode } from '@/services/geoService';
import { addAddress } from '@/services/userDataService';
import { useAuthStore } from '@/store/authStore';

const EMPTY = { label: 'Home', fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' };

/** Address entry with OpenStreetMap: use GPS, or drag the pin on a Leaflet/OSM map. */
export function AddressForm({ onSaved }: { onSaved: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.uid)!;
  const [f, setF] = useState({ ...EMPTY, fullName: profile?.name ?? '', phone: profile?.phone ?? '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const applyGeo = (g: Awaited<ReturnType<typeof reverseGeocode>>) => {
    setCoords({ lat: g.lat, lng: g.lng });
    setF((p) => ({ ...p, line1: g.line1 || p.line1, city: g.city || p.city, state: g.state || p.state, pincode: g.pincode || p.pincode }));
  };

  const useGps = async () => {
    setLocating(true);
    setMsg('');
    try {
      applyGeo(await currentLocationAddress());
      setShowMap(true);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const errs = validate(f, ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await addAddress({ uid, ...f, ...(coords ?? {}) });
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Button title={locating ? 'Locating…' : 'Use my current location'} icon="locate" variant="outline" loading={locating} onPress={useGps} style={{ marginBottom: 14 }} />
      {showMap && coords && (
        <View style={{ height: 220, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 14 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: osmMapHtml(coords.lat, coords.lng) }}
            onMessage={async (e) => {
              try {
                const { lat, lng } = JSON.parse(e.nativeEvent.data);
                applyGeo(await reverseGeocode(lat, lng));
              } catch { /* keep manual entry */ }
            }}
          />
        </View>
      )}
      {showMap && <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 12 }}>Drag the pin or tap the map to adjust. Map © OpenStreetMap contributors.</Text>}
      <Input label="Label (Home, Office…)" value={f.label} onChangeText={set('label')} />
      <Input label="Recipient name" value={f.fullName} onChangeText={set('fullName')} autoCapitalize="words" error={errors.fullName} />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" maxLength={10} error={errors.phone} />
      <Input label="Address" value={f.line1} onChangeText={set('line1')} multiline error={errors.line1} />
      <Input label="City" value={f.city} onChangeText={set('city')} autoCapitalize="words" error={errors.city} />
      <Input label="State" value={f.state} onChangeText={set('state')} autoCapitalize="words" error={errors.state} />
      <Input label="Pincode" value={f.pincode} onChangeText={set('pincode')} keyboardType="number-pad" maxLength={6} error={errors.pincode} />
      {msg ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{msg}</Text> : null}
      <Button title="Save address" onPress={save} loading={busy} />
    </View>
  );
}

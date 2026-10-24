import * as Location from 'expo-location';

export interface GeoResult {
  lat: number;
  lng: number;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

const UA = { 'User-Agent': 'CalifncoApp/1.0 (contact: support@califnco.example)' };

/** OpenStreetMap Nominatim reverse geocoding (free; usage policy: <=1 req/sec, identify the app). */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
    { headers: UA },
  );
  if (!res.ok) throw new Error('Could not look up this location');
  const j = await res.json();
  const a = j.address ?? {};
  return {
    lat, lng,
    line1: [a.house_number, a.road, a.suburb ?? a.neighbourhood].filter(Boolean).join(', '),
    city: a.city ?? a.town ?? a.village ?? a.state_district ?? '',
    state: a.state ?? '',
    pincode: a.postcode ?? '',
  };
}

export async function currentLocationAddress(): Promise<GeoResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return reverseGeocode(pos.coords.latitude, pos.coords.longitude);
}

/** Leaflet + OSM tiles in a WebView; posts {lat,lng} back when the marker is moved. */
export const osmMapHtml = (lat: number, lng: number) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0}</style></head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=L.map('m').setView([${lat},${lng}],16);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
var mk=L.marker([${lat},${lng}],{draggable:true}).addTo(map);
function send(p){window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat,lng:p.lng}))}
mk.on('dragend',function(){send(mk.getLatLng())});
map.on('click',function(e){mk.setLatLng(e.latlng);send(e.latlng)});
</script></body></html>`;

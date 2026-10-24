import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';
import { api } from '@/services/api';
import { useCartStore } from '@/store/cartStore';

const checkoutHtml = (p: Record<string, string>) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#0A1F44">
<p id="s">Opening secure checkout…</p>
<script>
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o))}
try{
  var rzp=new Razorpay({
    key:${JSON.stringify(p.keyId)}, order_id:${JSON.stringify(p.orderId)}, amount:${Number(p.amount) * 100}, currency:'INR',
    name:'Califnco', description:'Water purifier order',
    prefill:{name:${JSON.stringify(p.name)},email:${JSON.stringify(p.email)},contact:${JSON.stringify(p.phone)}},
    theme:{color:'#0E97AA'},
    handler:function(r){post({type:'success',payload:r})},
    modal:{ondismiss:function(){post({type:'dismissed'})}}
  });
  rzp.on('payment.failed',function(r){post({type:'failed',message:r.error&&r.error.description})});
  rzp.open();
}catch(e){post({type:'failed',message:String(e)})}
</script></body></html>`;

export default function Payment() {
  const params = useLocalSearchParams<Record<string, string>>();
  const [state, setState] = useState<'paying' | 'verifying' | 'error'>('paying');
  const [error, setError] = useState('');
  const handled = useRef(false);

  const onMessage = async (e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data);
    if (msg.type === 'dismissed') return router.back();
    if (msg.type === 'failed') {
      setError(msg.message ?? 'Payment failed.');
      return setState('error');
    }
    if (msg.type === 'success' && !handled.current) {
      handled.current = true;
      setState('verifying');
      try {
        // The client callback is NOT proof of payment: the server checks the signature and Razorpay's API.
        const res = await api<{ orderId: string }>('verify-payment', msg.payload);
        useCartStore.getState().clear();
        router.replace({ pathname: '/order-confirmation', params: { orderId: res.orderId } });
      } catch (err) {
        handled.current = false;
        setError(`${(err as Error).message}. If you were charged, contact support with payment id ${msg.payload?.razorpay_payment_id ?? ''}.`);
        setState('error');
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Payment" />
      {state === 'paying' && (
        <WebView
          originWhitelist={['*']}
          source={{ html: checkoutHtml(params), baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.aquaDark} />}
        />
      )}
      {state === 'verifying' && (
        <View style={s.center}><ActivityIndicator size="large" color={colors.aquaDark} /><Text style={s.text}>Verifying your payment…</Text></View>
      )}
      {state === 'error' && (
        <View style={s.center}>
          <Text style={[s.text, { color: colors.danger }]}>{error}</Text>
          <Button title="Back to checkout" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  text: { marginTop: 14, fontSize: 16, textAlign: 'center', color: colors.navy },
});

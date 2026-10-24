/** Optional channels. Each silently no-ops when its credentials are not configured. */

export async function sendOrderEmail(to: string, name: string, orderId: string, total: number) {
  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY || !to) return;
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: { to_email: to, to_name: name, order_id: orderId, total: String(total) },
    }),
  });
  if (!res.ok) console.warn('EmailJS failed', res.status, await res.text());
}

export async function sendOrderSms(phone: string, orderId: string, total: number) {
  const { TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID } = process.env;
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID || !phone) return;
  const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': TEXTBEE_API_KEY },
    body: JSON.stringify({
      recipients: [phone.startsWith('+') ? phone : `+91${phone}`],
      message: `Califnco: order ${orderId.slice(-8)} confirmed. Amount Rs.${total}. Thank you!`,
    }),
  });
  if (!res.ok) console.warn('TextBee failed', res.status, await res.text());
}

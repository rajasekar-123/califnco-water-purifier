const RULES: Record<string, (v: string) => string | null> = {
  name: (v) => (v.trim().length < 2 ? 'Enter your name.' : null),
  email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'Enter a valid email.'),
  phone: (v) => (/^[6-9]\d{9}$/.test(v.trim()) ? null : 'Enter a valid 10-digit mobile number.'),
  password: (v) => (v.length < 6 ? 'At least 6 characters.' : null),
  businessName: (v) => (v.trim().length < 2 ? 'Enter your business name.' : null),
  city: (v) => (v.trim().length < 2 ? 'Enter your city.' : null),
  pincode: (v) => (/^\d{6}$/.test(v.trim()) ? null : 'Enter a 6-digit pincode.'),
  line1: (v) => (v.trim().length < 5 ? 'Enter the full address.' : null),
  state: (v) => (v.trim().length < 2 ? 'Enter the state.' : null),
  fullName: (v) => (v.trim().length < 2 ? 'Enter the recipient name.' : null),
};

/** Returns a field->message map for the listed fields; empty object means valid. */
export function validate(values: Record<string, string>, fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const msg = RULES[f]?.(values[f] ?? '');
    if (msg) out[f] = msg;
  }
  return out;
}

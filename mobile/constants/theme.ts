export const colors = {
  navy: '#0A1F44',
  navy2: '#14336B',
  aqua: '#12B5CB',
  aquaDark: '#0E97AA',
  aquaSoft: '#E8F9FB',
  bg: '#F6F9FC',
  card: '#FFFFFF',
  text: '#10213F',
  muted: '#6B7A90',
  border: '#E3EAF2',
  danger: '#E5484D',
  success: '#12A150',
  warning: '#F5A524',
};

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const shadow = {
  shadowColor: '#0A1F44',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

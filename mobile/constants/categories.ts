import type { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from './shared';

type Icon = keyof typeof Ionicons.glyphMap;

export const CATEGORY_META: Record<(typeof CATEGORIES)[number], { icon: Icon; tint: string }> = {
  'RO Water Purifiers': { icon: 'water', tint: '#12B5CB' },
  'UV Water Purifiers': { icon: 'sunny', tint: '#F5A524' },
  'UF Water Purifiers': { icon: 'funnel', tint: '#4F46E5' },
  'Water Dispensers': { icon: 'beer', tint: '#0E97AA' },
  'Water Pumps': { icon: 'speedometer', tint: '#E5484D' },
  'RO Membranes': { icon: 'layers', tint: '#12A150' },
  'Water Filters': { icon: 'filter', tint: '#2563EB' },
  'Replacement Cartridges': { icon: 'cube', tint: '#9333EA' },
  'Spare Parts': { icon: 'settings', tint: '#6B7A90' },
  Accessories: { icon: 'link', tint: '#DB2777' },
};

export { CATEGORIES };

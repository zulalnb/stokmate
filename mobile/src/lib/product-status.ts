import type { BadgeIcon, BadgeVariant } from '@/components/ui/badge';

export const PRODUCT_STATUS_CONFIG: Record<
  number,
  { label: string; variant: BadgeVariant; icon: BadgeIcon }
> = {
  1: {
    label: 'Aktif',
    variant: 'success',
    icon: { sfSymbol: 'checkmark.circle.fill', ionicon: 'checkmark-circle' },
  },
  2: {
    label: 'Pasif',
    variant: 'neutral',
    icon: { sfSymbol: 'pause.circle.fill', ionicon: 'pause-circle' },
  },
  3: {
    label: 'Üretim Durduruldu',
    variant: 'danger',
    icon: { sfSymbol: 'xmark.circle.fill', ionicon: 'close-circle' },
  },
};

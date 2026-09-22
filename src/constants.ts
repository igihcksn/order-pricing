import { ServicePackage, ServiceAddon } from './types';

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: 'basic',
    name: 'Basic Clean',
    price: 50000,
    description: 'Fast exterior wash, midsole cleaning, standard laces.',
    features: [
      'Fast exterior wash',
      'Midsole cleaning',
      'Standard laces cleaning'
    ]
  },
  {
    id: 'deep',
    name: 'Deep Clean',
    price: 90000,
    description: 'Full exterior and interior clean, insole extraction, deep lace wash, deodorizing treatment.',
    features: [
      'Full exterior and interior clean',
      'Insole extraction wash',
      'Deep lace cleaning',
      'Deodorizing treatment'
    ]
  }
];

export const EXPRESS_ADDON: ServiceAddon = {
  id: 'express',
  name: 'Express Delivery',
  price: 25000,
  description: '24-hour turnaround priority service.'
};

export const DEFAULT_BUSINESS_PHONE =
  import.meta.env.VITE_BUSINESS_PHONE_NUMBER || '6281234567890';

export function formatRupiah(amount: number): string {
  // Indonesian Rupiah format with period as thousands separator, e.g. Rp50.000
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

/**
 * Normalizes customer phone input into international E.164-compatible format:
 * Strips non-numeric characters and replaces leading 0 with country code 62.
 */
export function normalizePhone(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  return digitsOnly;
}

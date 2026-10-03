/**
 * Icons for the known categories. Categories are dynamic, so anything not listed here
 * (for example a category added later by the admin) falls back to a generic icon until
 * category images are available.
 */

import type { IconName } from '@/components/ui/icon';

const ICON_BY_SLUG: Record<string, IconName> = {
  stationery: 'stationery',
  'gift-items': 'gift',
  toys: 'toys',
  'sports-items': 'sports',
  'decoration-items': 'decoration',
};

const FALLBACK_ICON: IconName = 'categories';

export function getCategoryIcon(slug: string): IconName {
  return ICON_BY_SLUG[slug] ?? FALLBACK_ICON;
}

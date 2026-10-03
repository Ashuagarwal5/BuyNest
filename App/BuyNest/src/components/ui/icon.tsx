import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PlatformSymbol = Exclude<SymbolViewProps['name'], string>;
type IosSymbol = NonNullable<PlatformSymbol['ios']>;
type MaterialSymbol = NonNullable<PlatformSymbol['android']>;

/** SF Symbol on iOS, Material Symbol on Android and web. */
function symbol(ios: IosSymbol, material: MaterialSymbol): PlatformSymbol {
  return { ios, android: material, web: material };
}

const ICONS = {
  home: symbol('house.fill', 'home'),
  categories: symbol('square.grid.2x2.fill', 'category'),
  cart: symbol('cart.fill', 'shopping_cart'),
  orders: symbol('shippingbox.fill', 'receipt_long'),
  account: symbol('person.fill', 'person'),
  search: symbol('magnifyingglass', 'search'),
  location: symbol('mappin.and.ellipse', 'location_on'),
  add: symbol('plus', 'add'),
  remove: symbol('minus', 'remove'),
  delete: symbol('trash', 'delete'),
  delivery: symbol('shippingbox.fill', 'local_shipping'),
  cash: symbol('banknote.fill', 'payments'),
  star: symbol('star.fill', 'star'),
  help: symbol('questionmark.circle', 'help'),
  info: symbol('info.circle', 'info'),
  store: symbol('bag.fill', 'storefront'),
  success: symbol('checkmark.circle.fill', 'check_circle'),
  offline: symbol('wifi.slash', 'wifi_off'),
  close: symbol('xmark.circle.fill', 'cancel'),
  stationery: symbol('pencil', 'edit_note'),
  gift: symbol('gift.fill', 'redeem'),
  toys: symbol('teddybear.fill', 'toys'),
  sports: symbol('sportscourt.fill', 'sports_cricket'),
  decoration: symbol('sparkles', 'celebration'),
} as const satisfies Record<string, PlatformSymbol>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color = 'text', style }: IconProps) {
  const theme = useTheme();

  return <SymbolView name={ICONS[name]} size={size} tintColor={theme[color]} style={style} />;
}

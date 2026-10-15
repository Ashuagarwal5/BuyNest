/**
 * Where a tapped notification may lead. The server sends a screen *key* and a few string
 * parameters; this file is the only place those become app routes. Nothing from a
 * notification payload is ever used as a path, a URL or a navigation action directly.
 */

export const NOTIFICATION_SCREENS = [
  'ORDER_DETAIL',
  'PRODUCT',
  'MY_REVIEWS',
  'ORDERS',
  'NOTIFICATIONS',
  'HOME',
] as const;

export type NotificationScreen = (typeof NOTIFICATION_SCREENS)[number];

const ORDER_NUMBER = /^(DK|BN)-\d{8}-\d{4,}$/;
const PRODUCT_ID = /^[A-Za-z0-9_-]{1,100}$/;

export type NotificationRoute =
  | { pathname: '/orders/[id]'; params: { id: string } }
  | { pathname: '/product/[id]'; params: { id: string } }
  | { pathname: '/my-reviews' }
  | { pathname: '/orders' }
  | { pathname: '/notifications' }
  | { pathname: '/' };

const INBOX: NotificationRoute = { pathname: '/notifications' };

/** Maps a screen key and parameters to a route; anything invalid lands on the inbox. */
export function routeForNotification(screen: string, params: Record<string, string>): NotificationRoute {
  switch (screen) {
    case 'ORDER_DETAIL': {
      const orderNumber = params['orderNumber'];
      return orderNumber && ORDER_NUMBER.test(orderNumber)
        ? { pathname: '/orders/[id]', params: { id: orderNumber } }
        : INBOX;
    }
    case 'PRODUCT': {
      const productId = params['productId'];
      return productId && PRODUCT_ID.test(productId)
        ? { pathname: '/product/[id]', params: { id: productId } }
        : INBOX;
    }
    case 'MY_REVIEWS':
      return { pathname: '/my-reviews' };
    case 'ORDERS':
      return { pathname: '/orders' };
    case 'HOME':
      return { pathname: '/' };
    default:
      return INBOX;
  }
}

export type PushPayload = {
  notificationId: string;
  screen: string;
  params: Record<string, string>;
};

/**
 * Reads the `data` of a received push. It must be an object of strings carrying a notification
 * id; anything else is ignored. The payload deliberately holds no personal details.
 */
export function parsePushPayload(data: unknown): PushPayload | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  const notificationId = record['notificationId'];
  if (typeof notificationId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(notificationId)) return null;

  const params: Record<string, string> = {};
  for (const key of ['orderNumber', 'productId']) {
    const value = record[key];
    if (typeof value === 'string' && value.length <= 100) params[key] = value;
  }
  const screen = record['screen'];
  return { notificationId, screen: typeof screen === 'string' ? screen : 'NOTIFICATIONS', params };
}

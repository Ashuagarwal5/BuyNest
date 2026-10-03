type CartItem = { productId: string; quantity: number };

/**
 * A stable description of what is in a cart: the same products and quantities always
 * give the same string, whatever order they were added in. It is how the app tells
 * whether the cart is still the one a submitted order was made from.
 */
export function fingerprintCartItems(items: CartItem[]): string {
  return items
    .map((item) => `${item.productId}x${item.quantity}`)
    .sort()
    .join('|');
}

/** A locality the shop delivers to. All money values are integer paise. */
export type DeliveryArea = {
  id: string;
  name: string;
  pincode?: string;
  deliveryCharge: number;
  /** Smallest subtotal accepted for this area. */
  minimumOrder?: number;
  /** Subtotal at or above which delivery is free. */
  freeDeliveryThreshold?: number;
  isActive: boolean;
};

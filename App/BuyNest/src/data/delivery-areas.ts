/**
 * Temporary mock delivery areas with placeholder names and charges. The admin will manage
 * these from the backend later; screens must only use the functions exported here.
 * Amounts are integer paise.
 */

import type { DeliveryArea } from '@/types/delivery';

const deliveryAreas: DeliveryArea[] = [
  {
    id: 'area-1',
    name: 'Main Market',
    deliveryCharge: 2000,
    freeDeliveryThreshold: 40000,
    isActive: true,
  },
  {
    id: 'area-2',
    name: 'Station Road',
    deliveryCharge: 3000,
    freeDeliveryThreshold: 50000,
    isActive: true,
  },
  {
    id: 'area-3',
    name: 'Civil Lines',
    deliveryCharge: 3000,
    minimumOrder: 10000,
    freeDeliveryThreshold: 50000,
    isActive: true,
  },
  {
    id: 'area-4',
    name: 'Gandhi Nagar',
    deliveryCharge: 2000,
    isActive: true,
  },
  {
    id: 'area-5',
    name: 'Model Town',
    deliveryCharge: 4000,
    minimumOrder: 20000,
    freeDeliveryThreshold: 75000,
    isActive: true,
  },
  {
    id: 'area-6',
    name: 'Industrial Area',
    deliveryCharge: 5000,
    isActive: false,
  },
];

export function getActiveDeliveryAreas(): DeliveryArea[] {
  return deliveryAreas.filter((area) => area.isActive);
}

/** Includes inactive areas so callers can tell "no longer serviced" from "unknown". */
export function getDeliveryAreaById(id: string): DeliveryArea | undefined {
  return deliveryAreas.find((area) => area.id === id);
}

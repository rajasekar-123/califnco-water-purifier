import { useCatalogStore } from '@/store/catalogStore';
import { useIsApprovedDealer } from '@/store/authStore';
import { minQtyFor, unitPriceFor } from '@/store/cartLogic';

/** Role-aware price for one product: dealer price for approved dealers, retail otherwise. */
export function usePrice(productId: string) {
  const product = useCatalogStore((s) => s.products[productId]);
  const pricing = useCatalogStore((s) => s.pricing[productId]);
  const wholesale = useIsApprovedDealer();
  return {
    wholesale,
    unitPrice: product ? unitPriceFor(product, wholesale, pricing) : 0,
    minQty: minQtyFor(wholesale, pricing),
  };
}

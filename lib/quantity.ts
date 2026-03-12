export type QuantityConstraints = {
  eventDateQuantityCap: number | null;
  zoneAvailableQuantity: number;
  zoneMinPurchaseQty: number;
  zoneMaxPurchaseQty: number | null;
};

export type QuantityValidationResult =
  | { ok: true; minAllowed: number; maxAllowed: number }
  | { ok: false; minAllowed: number; maxAllowed: number; error: string };

export function validateQuantity(
  requested: number,
  constraints: QuantityConstraints
): QuantityValidationResult {
  const minAllowed = Math.max(1, constraints.zoneMinPurchaseQty || 1);

  const caps: number[] = [constraints.zoneAvailableQuantity];
  if (constraints.eventDateQuantityCap != null) caps.push(constraints.eventDateQuantityCap);
  if (constraints.zoneMaxPurchaseQty != null) caps.push(constraints.zoneMaxPurchaseQty);

  const maxAllowed = Math.min(...caps);

  if (requested < minAllowed) {
    return {
      ok: false,
      minAllowed,
      maxAllowed,
      error: `Minimum quantity is ${minAllowed}.`
    };
  }

  if (requested > maxAllowed) {
    return {
      ok: false,
      minAllowed,
      maxAllowed,
      error: `Maximum quantity for this selection is ${maxAllowed}.`
    };
  }

  return { ok: true, minAllowed, maxAllowed };
}


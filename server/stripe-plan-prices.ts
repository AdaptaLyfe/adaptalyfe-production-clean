import type Stripe from "stripe";

export type StripePlanType = "basic" | "premium" | "family";
export type StripeBillingCycle = "monthly" | "annual";

/** Amounts in cents — keep in sync with landing / Apple / Play catalogs. */
export const STRIPE_PLAN_AMOUNTS: Record<
  StripePlanType,
  Record<StripeBillingCycle, number>
> = {
  basic: { monthly: 499, annual: 4999 },
  premium: { monthly: 1299, annual: 12999 },
  family: { monthly: 2499, annual: 24999 },
};

const PRICE_ENV_KEYS: Record<
  StripePlanType,
  Record<StripeBillingCycle, string>
> = {
  basic: {
    monthly: "STRIPE_PRICE_BASIC_MONTHLY",
    annual: "STRIPE_PRICE_BASIC_ANNUAL",
  },
  premium: {
    monthly: "STRIPE_PRICE_PREMIUM_MONTHLY",
    annual: "STRIPE_PRICE_PREMIUM_ANNUAL",
  },
  family: {
    monthly: "STRIPE_PRICE_FAMILY_MONTHLY",
    annual: "STRIPE_PRICE_FAMILY_ANNUAL",
  },
};

export function isStripePlanType(value: unknown): value is StripePlanType {
  return value === "basic" || value === "premium" || value === "family";
}

export function isStripeBillingCycle(value: unknown): value is StripeBillingCycle {
  return value === "monthly" || value === "annual";
}

export function stripePlanKey(
  planType: StripePlanType,
  billingCycle: StripeBillingCycle,
): string {
  return `adaptalyfe_${planType}_${billingCycle}`;
}

/** Fixed Price ID from env (production / staging). Empty if not configured. */
export function getConfiguredStripePriceId(
  planType: StripePlanType,
  billingCycle: StripeBillingCycle,
): string | null {
  const envName = PRICE_ENV_KEYS[planType][billingCycle];
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  if (!raw.startsWith("price_")) {
    console.warn(
      `[stripe] ${envName} should be a Stripe Price id (price_…); got "${raw.slice(0, 12)}…"`,
    );
  }
  return raw;
}

export function listMissingStripePriceEnvVars(): string[] {
  const missing: string[] = [];
  for (const plan of Object.keys(PRICE_ENV_KEYS) as StripePlanType[]) {
    for (const cycle of Object.keys(PRICE_ENV_KEYS[plan]) as StripeBillingCycle[]) {
      const name = PRICE_ENV_KEYS[plan][cycle];
      if (!process.env[name]?.trim()) missing.push(name);
    }
  }
  return missing;
}

/**
 * Resolve the Stripe Price for a plan.
 * Prefers fixed env IDs. In production, env IDs are required (no auto-create).
 * In development, falls back to metadata search / create so local checkout still works.
 */
export async function resolveStripePlanPrice(
  stripe: Stripe,
  planType: StripePlanType,
  billingCycle: StripeBillingCycle,
): Promise<Stripe.Price> {
  const amount = STRIPE_PLAN_AMOUNTS[planType][billingCycle];
  const expectedInterval = billingCycle === "annual" ? "year" : "month";
  const planLabel = stripePlanKey(planType, billingCycle);
  const configuredId = getConfiguredStripePriceId(planType, billingCycle);
  const isProduction = process.env.NODE_ENV === "production";

  if (configuredId) {
    const price = await stripe.prices.retrieve(configuredId);
    if (!price.active) {
      throw new Error(`Configured Stripe price ${configuredId} is not active`);
    }
    if (price.unit_amount !== amount || price.currency !== "usd") {
      throw new Error(
        `Configured Stripe price ${configuredId} amount/currency mismatch for ${planLabel}`,
      );
    }
    if (
      price.recurring?.interval !== expectedInterval ||
      price.recurring?.interval_count !== 1
    ) {
      throw new Error(
        `Configured Stripe price ${configuredId} interval mismatch for ${planLabel}`,
      );
    }
    console.log(`Using configured Stripe price ${price.id} for ${planLabel}`);
    return price;
  }

  if (isProduction) {
    const envName = PRICE_ENV_KEYS[planType][billingCycle];
    throw new Error(
      `Missing ${envName}. Production must use fixed Stripe Price IDs (no auto-create).`,
    );
  }

  // Dev-only fallback: search by metadata, then create once.
  const existingPrices = await stripe.prices.search({
    query: `metadata['plan_key']:'${planLabel}' AND active:'true'`,
    limit: 100,
  });
  const reused = existingPrices.data.find(
    (candidate) =>
      candidate.active &&
      candidate.unit_amount === amount &&
      candidate.currency === "usd" &&
      candidate.recurring?.interval === expectedInterval &&
      candidate.recurring?.interval_count === 1,
  );
  if (reused) {
    console.log(`Reusing existing Stripe price ${reused.id} for ${planLabel}`);
    return reused;
  }

  const existingProducts = await stripe.products.search({
    query: `metadata['plan_key']:'${planLabel}' AND active:'true'`,
    limit: 1,
  });
  const product =
    existingProducts.data[0] ??
    (await stripe.products.create({
      name: `Adaptalyfe ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
      description: `${billingCycle} subscription to Adaptalyfe ${planType} features`,
      metadata: { plan_key: planLabel },
    }));
  const created = await stripe.prices.create({
    currency: "usd",
    product: product.id,
    unit_amount: amount,
    recurring: { interval: expectedInterval },
    metadata: { plan_key: planLabel },
  });
  console.log(
    `Created new Stripe price ${created.id} for ${planLabel} (dev fallback — set ${PRICE_ENV_KEYS[planType][billingCycle]} to pin this)`,
  );
  return created;
}

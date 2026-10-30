import { FREE_TRIAL_DAYS } from "@shared/subscription";

/**
 * Each account gets ONE free trial: the FREE_TRIAL_DAYS that start at sign-up.
 *
 * Paying during that trial keeps the same end date (first charge when the
 * account trial ends). Paying after it, or after a confirmed web subscription
 * already existed, charges immediately. Switching plans while a confirmed
 * Stripe trial is running carries the existing trial end over, never extends it.
 */
export interface StripeTrialAccount {
  createdAt: Date | string | null | undefined;
  /** Set to "stripe_<plan>_<cycle>" once a web subscription has been confirmed. */
  subscriptionProductId?: string | null;
}

export interface PreviousStripeSubscription {
  status: string;
  /** Unix seconds, as Stripe returns it. */
  trial_end?: number | null;
}

/** Stripe needs a little room; a trial ending within this window is skipped. */
export const MIN_TRIAL_REMAINING_MS = 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function hasConfirmedWebSubscription(account: StripeTrialAccount): boolean {
  return typeof account.subscriptionProductId === "string" &&
    /^stripe_(?:basic|premium|family)_(?:monthly|annual)$/.test(account.subscriptionProductId);
}

/**
 * Returns the Stripe `trial_end` (Unix seconds) for a new checkout, or null
 * when the customer must be charged immediately.
 */
export function stripeTrialEndForCheckout(
  account: StripeTrialAccount,
  previous: PreviousStripeSubscription | null,
  now: Date = new Date(),
): number | null {
  const minimumEnd = now.getTime() + MIN_TRIAL_REMAINING_MS;

  // Plan switch during a confirmed, still-running Stripe trial: keep its end date.
  if (
    hasConfirmedWebSubscription(account) &&
    previous?.status === "trialing" &&
    typeof previous.trial_end === "number" &&
    previous.trial_end * 1000 > minimumEnd
  ) {
    return previous.trial_end;
  }

  // A confirmed web subscription already used the account's free trial.
  if (hasConfirmedWebSubscription(account)) return null;

  const createdAt = toDate(account.createdAt);
  if (!createdAt) return null;

  const accountTrialEnd = createdAt.getTime() + FREE_TRIAL_DAYS * DAY_MS;
  if (accountTrialEnd <= minimumEnd) return null;

  return Math.floor(accountTrialEnd / 1000);
}

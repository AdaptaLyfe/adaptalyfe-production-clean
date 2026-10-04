import {
  AppStoreServerAPIClient,
  Environment,
  ReceiptUtility,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import type {
  JWSTransactionDecodedPayload,
  JWSRenewalInfoDecodedPayload,
  ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  resolveAppleSubscriptionEntitlement,
  type AppleSubscriptionCandidate,
  type AppleSubscriptionEntitlement,
} from "./apple-subscription-entitlement";

export class AppleStoreConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppleStoreConfigurationError";
  }
}

export class AppleStoreVerificationError extends Error {
  constructor(
    message: string,
    readonly invalidPurchase = false,
  ) {
    super(message);
    this.name = "AppleStoreVerificationError";
  }
}

export interface VerifiedAppleNotification {
  notification: ResponseBodyV2DecodedPayload;
  environment: Environment;
  transaction: JWSTransactionDecodedPayload | null;
  renewalInfo: JWSRenewalInfoDecodedPayload | null;
}

interface AppleStoreConfig {
  issuerId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  appleAppId: number;
}

interface VerifiedTransaction {
  transaction: JWSTransactionDecodedPayload;
  environment: Environment;
}

const environments = [Environment.PRODUCTION, Environment.SANDBOX] as const;
let rootCertificates: Buffer[] | undefined;

function appleStoreConfig(): AppleStoreConfig {
  const issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID?.trim();
  const keyId = process.env.APP_STORE_CONNECT_KEY_ID?.trim();
  const privateKey = process.env.APP_STORE_CONNECT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const bundleId = process.env.APPLE_BUNDLE_ID?.trim();
  const appleAppId = Number(process.env.APPLE_APP_ID);
  const required: ReadonlyArray<readonly [string, unknown]> = [
    ["APP_STORE_CONNECT_ISSUER_ID", issuerId],
    ["APP_STORE_CONNECT_KEY_ID", keyId],
    ["APP_STORE_CONNECT_PRIVATE_KEY", privateKey],
    ["APPLE_BUNDLE_ID", bundleId],
    ["APPLE_APP_ID", Number.isSafeInteger(appleAppId) && appleAppId > 0],
  ];
  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new AppleStoreConfigurationError(
      `Apple App Store Server API is not configured: ${missing.join(", ")}`,
    );
  }

  return {
    issuerId: issuerId!,
    keyId: keyId!,
    privateKey: privateKey!,
    bundleId: bundleId!,
    appleAppId,
  };
}

function appleRootCertificates(): Buffer[] {
  if (rootCertificates) return rootCertificates;
  const certDirectory =
    process.env.APPLE_ROOT_CERTIFICATES_DIR ??
    path.resolve(process.cwd(), "server", "certs");
  rootCertificates = [
    readFileSync(path.join(certDirectory, "AppleRootCA-G2.cer")),
    readFileSync(path.join(certDirectory, "AppleRootCA-G3.cer")),
  ];
  return rootCertificates;
}

function apiClient(
  config: AppleStoreConfig,
  environment: Environment,
): AppStoreServerAPIClient {
  return new AppStoreServerAPIClient(
    config.privateKey,
    config.keyId,
    config.issuerId,
    config.bundleId,
    environment,
  );
}

function verifier(
  config: AppleStoreConfig,
  environment: Environment,
): SignedDataVerifier {
  return new SignedDataVerifier(
    appleRootCertificates(),
    true,
    environment,
    config.bundleId,
    environment === Environment.SANDBOX ? undefined : config.appleAppId,
  );
}

async function verifiedTransaction(
  transactionId: string,
  preferredEnvironment?: Environment,
): Promise<VerifiedTransaction> {
  const config = appleStoreConfig();
  const targets = preferredEnvironment
    ? [
        preferredEnvironment,
        ...environments.filter((item) => item !== preferredEnvironment),
      ]
    : [...environments];
  const errors: unknown[] = [];

  for (const environment of targets) {
    try {
      const response = await apiClient(config, environment).getTransactionInfo(
        transactionId,
      );
      if (!response.signedTransactionInfo) {
        throw new AppleStoreVerificationError(
          "Apple did not return a signed transaction.",
          true,
        );
      }
      const transaction = await verifier(
        config,
        environment,
      ).verifyAndDecodeTransaction(response.signedTransactionInfo);
      if (
        transaction.bundleId !== config.bundleId ||
        transaction.transactionId !== transactionId
      ) {
        throw new AppleStoreVerificationError(
          "The transaction does not belong to this app.",
          true,
        );
      }
      return { transaction, environment };
    } catch (error) {
      errors.push(error);
      if (
        error instanceof AppleStoreVerificationError &&
        error.invalidPurchase
      ) {
        throw error;
      }
    }
  }

  const invalid = errors.find(
    (error) =>
      error instanceof AppleStoreVerificationError && error.invalidPurchase,
  );
  if (invalid instanceof AppleStoreVerificationError) throw invalid;
  const upstreamStatus = errors
    .map((error) => {
      if (typeof error !== "object" || error === null) return null;
      const fields = error as Record<string, unknown>;
      const value =
        fields.httpStatusCode ?? fields.statusCode ?? fields.status;
      const parsed = typeof value === "number" ? value : Number(value);
      return Number.isInteger(parsed) ? parsed : null;
    })
    .filter((status): status is number => status !== null);
  const notFoundOnly =
    upstreamStatus.length > 0 &&
    upstreamStatus.every((status) => status === 400 || status === 404);
  throw new AppleStoreVerificationError(
    "Apple could not find or verify the transaction.",
    notFoundOnly,
  );
}

async function subscriptionEntitlementForTransaction(
  anyTransactionId: string,
  environment: Environment,
  now = new Date(),
): Promise<AppleSubscriptionEntitlement> {
  const config = appleStoreConfig();
  const appleVerifier = verifier(config, environment);
  const response = await apiClient(config, environment).getAllSubscriptionStatuses(
    anyTransactionId,
  );

  if (response.bundleId && response.bundleId !== config.bundleId) {
    throw new AppleStoreVerificationError(
      "Apple returned subscription data for a different app.",
      true,
    );
  }

  const candidates: AppleSubscriptionCandidate[] = [];
  for (const group of response.data ?? []) {
    for (const item of group.lastTransactions ?? []) {
      if (!item.signedTransactionInfo) continue;
      const transaction = await appleVerifier.verifyAndDecodeTransaction(
        item.signedTransactionInfo,
      );
      const renewalInfo = item.signedRenewalInfo
        ? await appleVerifier.verifyAndDecodeRenewalInfo(
            item.signedRenewalInfo,
          )
        : null;
      candidates.push({
        status: item.status,
        transaction,
        renewalInfo,
      });
    }
  }

  return resolveAppleSubscriptionEntitlement(candidates, now);
}

export async function verifyAppleStorePurchase(options: {
  transactionId?: string | null;
  receiptData: string;
  expectedProductId: string;
}): Promise<AppleSubscriptionEntitlement> {
  const transactionId =
    options.transactionId?.trim() ||
    new ReceiptUtility().extractTransactionIdFromAppReceipt(options.receiptData);
  if (!transactionId) {
    throw new AppleStoreVerificationError(
      "The App Store receipt did not contain a transaction ID.",
      true,
    );
  }

  const verified = await verifiedTransaction(transactionId);
  if (verified.transaction.productId !== options.expectedProductId) {
    throw new AppleStoreVerificationError(
      "The transaction product does not match the selected subscription.",
      true,
    );
  }
  const originalTransactionId =
    verified.transaction.originalTransactionId ?? transactionId;
  const entitlement = await subscriptionEntitlementForTransaction(
    originalTransactionId,
    verified.environment,
  );
  if (!entitlement.originalTransactionId) {
    return {
      ...entitlement,
      originalTransactionId,
      transactionId: verified.transaction.transactionId ?? transactionId,
    };
  }
  return entitlement;
}

export async function refreshAppleStoreSubscription(
  anyTransactionId: string,
): Promise<AppleSubscriptionEntitlement> {
  const verified = await verifiedTransaction(anyTransactionId);
  const originalTransactionId =
    verified.transaction.originalTransactionId ?? anyTransactionId;
  const entitlement = await subscriptionEntitlementForTransaction(
    originalTransactionId,
    verified.environment,
  );
  return entitlement.originalTransactionId
    ? entitlement
    : { ...entitlement, originalTransactionId };
}

export async function restoreAppleStoreSubscription(
  receiptData: string,
  transactionIdHint?: string | null,
): Promise<AppleSubscriptionEntitlement> {
  const transactionId =
    transactionIdHint?.trim() ||
    new ReceiptUtility().extractTransactionIdFromAppReceipt(receiptData);
  if (!transactionId) {
    throw new AppleStoreVerificationError(
      "The App Store receipt did not contain a transaction ID.",
      true,
    );
  }
  return refreshAppleStoreSubscription(transactionId);
}

export async function verifyAppleServerNotification(
  signedPayload: string,
): Promise<VerifiedAppleNotification> {
  const config = appleStoreConfig();
  const errors: unknown[] = [];

  for (const environment of environments) {
    try {
      const appleVerifier = verifier(config, environment);
      const notification =
        await appleVerifier.verifyAndDecodeNotification(signedPayload);
      const notificationEnvironment = notification.data?.environment;
      if (
        notificationEnvironment &&
        notificationEnvironment !== environment
      ) {
        throw new AppleStoreVerificationError(
          "Apple notification environment did not match its signature.",
          true,
        );
      }

      const transaction =
        notification.data?.signedTransactionInfo
          ? await appleVerifier.verifyAndDecodeTransaction(
              notification.data.signedTransactionInfo,
            )
          : null;
      const renewalInfo =
        notification.data?.signedRenewalInfo
          ? await appleVerifier.verifyAndDecodeRenewalInfo(
              notification.data.signedRenewalInfo,
            )
          : null;
      return { notification, environment, transaction, renewalInfo };
    } catch (error) {
      errors.push(error);
      if (
        error instanceof AppleStoreVerificationError &&
        error.invalidPurchase
      ) {
        throw error;
      }
    }
  }

  const invalid = errors.find(
    (error) => error instanceof AppleStoreVerificationError,
  );
  if (invalid instanceof AppleStoreVerificationError) throw invalid;
  throw new AppleStoreVerificationError(
    "Apple notification signature could not be verified.",
    true,
  );
}

export async function refreshAppleSubscriptionFromNotification(
  originalTransactionId: string,
  environment: Environment,
): Promise<AppleSubscriptionEntitlement> {
  const entitlement = await subscriptionEntitlementForTransaction(
    originalTransactionId,
    environment,
  );
  return entitlement.originalTransactionId
    ? entitlement
    : { ...entitlement, originalTransactionId };
}
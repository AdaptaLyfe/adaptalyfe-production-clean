const SAFE_LOG_TOKEN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

type ErrorFields = {
  name?: unknown;
  code?: unknown;
  type?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

function safeToken(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const token = String(value);
  return SAFE_LOG_TOKEN.test(token) ? token : undefined;
}

function safeStatus(value: unknown): number | undefined {
  const status =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d{3}$/.test(value)
        ? Number(value)
        : undefined;
  return Number.isInteger(status) && status! >= 100 && status! <= 599
    ? status
    : undefined;
}

/** Allowlisted operational details only; never includes error messages or stacks. */
export function sanitizeErrorMetadata(error: unknown): Record<string, string | number> {
  const fields =
    error !== null && typeof error === "object"
      ? (error as ErrorFields)
      : undefined;
  const metadata: Record<string, string | number> = {
    errorType: safeToken(fields?.name) ?? (error instanceof Error ? "Error" : "UnknownError"),
  };
  const code = safeToken(fields?.code);
  const providerType = safeToken(fields?.type);
  const status = safeStatus(fields?.statusCode ?? fields?.status);

  if (code) metadata.code = code;
  if (providerType) metadata.providerType = providerType;
  if (status !== undefined) metadata.status = status;
  return metadata;
}

export function logSanitizedError(event: string, error: unknown): void {
  const safeEvent = SAFE_LOG_TOKEN.test(event) ? event : "server.error";
  console.error(`[${safeEvent}]`, sanitizeErrorMetadata(error));
}

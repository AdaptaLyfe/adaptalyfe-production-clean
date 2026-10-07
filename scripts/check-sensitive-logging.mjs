import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const REQUIRED_BUNDLES = [
  "dist/production.js",
  "render-app.js",
  "adaptalyfe-app.js",
  "standalone-app.js",
  "ultra-app.js",
  "server.js",
  "standalone-server.js",
];

const SENSITIVE_IDENTIFIERS = new Set([
  "user",
  "userId",
  "userID",
  "username",
  "email",
  "session",
  "sessionId",
  "sessionID",
  "sessionToken",
  "authHeader",
  "cookie",
  "cookies",
  "body",
  "reward",
  "rewardData",
  "updatedReward",
  "createdReward",
  "entry",
  "record",
  "entryWithDate",
  "startOfDay",
  "endOfDay",
  "moodEntry",
  "mood",
  "notes",
  "medication",
  "medicationData",
  "allergy",
  "allergyData",
  "condition",
  "conditionData",
  "adverseMedData",
  "sleepSession",
  "healthRecord",
  "healthMetric",
  "emergencyContact",
  "providerData",
  "symptomData",
  "symptoms",
  "sessionUser",
  "currentUser",
  "target",
  "bankAccount",
  "billPayment",
  "transaction",
  "paymentData",
  "accountNumber",
  "payeeAccountNumber",
  "utilityUserId",
  "consumerNumber",
  "currentReading",
  "currentBill",
  "consumption",
  "serviceAddress",
]);

const AI_CONTENT_IDENTIFIERS = new Set([
  "message",
  "messages",
  "prompt",
  "systemPrompt",
  "context",
  "raw",
  "completion",
  "assistantContent",
  "assistantMessage",
  "transcript",
  "toolCall",
  "response",
]);

const HEALTH_ROUTE =
  /\/api\/(?:user-pharmacies|[^"'`]*\/)?(?:pharmacies|medications|refill-orders|allergies|medical-conditions|adverse-medications|sleep-sessions|health-metrics|emergency-contacts|emergency-resources|emergency-treatment-plans|primary-care-providers|symptom-entries|personal-resources|wearable-devices|activity-sessions|mood-entries|geofences|geofence-events|family-members)(?:\/|$)/i;
const AI_ROUTE = /\/api\/(?:chat|ai)(?:\/|$)/i;
const MESSAGE_ROUTE = /\/api\/(?:messages|caregiver\/messages)(?:\/|$)/i;
const PROVIDER_ROUTE =
  /\/api\/[^"'`]*(?:subscription|purchase|restore|stripe|google-play|app-store|bank|plaid|payment|bill)/i;
const CARE_ROUTE =
  /\/api\/(?:care(?:givers|giver(?:\/|$)|giver-access|giver-permissions|giver-invitations|giver-users|giver-messages)?|messages|my-care-recipients|locked-settings|settings-check|invitation|accept-invitation)(?:\/|$)/i;
const SENSITIVE_ROUTE = new RegExp(
  `(?:${HEALTH_ROUTE.source})|(?:${AI_ROUTE.source})|(?:${PROVIDER_ROUTE.source})|(?:${CARE_ROUTE.source})`,
  "i",
);

function collectServerSources(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist") {
        files.push(...collectServerSources(file));
      }
    } else if (/\.tsx?$/.test(entry.name) && !/\.(?:test|spec)\.tsx?$/.test(entry.name)) {
      files.push(file);
    }
  }
  return files;
}

function stringValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function expressionPath(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) {
    return `${expressionPath(node.expression)}.${node.name.text}`;
  }
  if (ts.isElementAccessExpression(node)) {
    return `${expressionPath(node.expression)}.${node.argumentExpression?.getText() ?? ""}`;
  }
  return "";
}

function findRoutePath(node, sourceFile) {
  let parent = node.parent;
  while (parent) {
    if (
      ts.isCallExpression(parent) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      ts.isIdentifier(parent.expression.expression) &&
      ["get", "post", "put", "patch", "delete", "all"].includes(
        parent.expression.name.text,
      )
    ) {
      const route = parent.arguments.map(stringValue).find(Boolean);
      if (route?.startsWith("/")) return route;
    }
    parent = parent.parent;
  }
  return undefined;
}

function isDirectErrorValue(node) {
  if (ts.isIdentifier(node) && /^(?:error|err|exception)$/i.test(node.text)) {
    return true;
  }
  if (ts.isPropertyAccessExpression(node)) {
    const valuePath = expressionPath(node);
    return /^(?:error|err|exception)\.(?:message|stack|cause)$/i.test(valuePath);
  }
  return false;
}

function containsSensitiveReference(node, identifiers) {
  let found;
  function visit(child) {
    if (found) return;
    if (ts.isIdentifier(child) && identifiers.has(child.text)) {
      found = child.text;
      return;
    }
    if (ts.isPropertyAccessExpression(child) || ts.isElementAccessExpression(child)) {
      const valuePath = expressionPath(child).replace(/\?\./g, ".");
      if (
        /(?:^|\.)req\.(?:body|session|sessionID|headers\.cookie|headers\.authorization)(?:\.|$)/i.test(
          valuePath,
        )
      ) {
        found = valuePath;
        return;
      }
      if (
        ts.isCallExpression(child) &&
        expressionPath(child.expression) === "req.get" &&
        ["cookie", "authorization"].includes(
          stringValue(child.arguments[0])?.toLowerCase() ?? "",
        )
      ) {
        found = "request cookie/authorization header";
        return;
      }
    }
    if (
      ts.isCallExpression(child) &&
      expressionPath(child.expression) === "req.get" &&
      ["cookie", "authorization"].includes(
        stringValue(child.arguments[0])?.toLowerCase() ?? "",
      )
    ) {
      found = "request cookie/authorization header";
      return;
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return found;
}

function isConsoleLogCall(node, sourceFile) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(sourceFile) === "console" &&
    ["log", "info", "warn", "error", "debug"].includes(node.expression.name.text)
  );
}

function hasStoreFalse(call) {
  const options = call.arguments[0];
  if (!options || !ts.isObjectLiteralExpression(options)) return false;
  return options.properties.some(
    (property) =>
      ts.isPropertyAssignment(property) &&
      property.name.getText() === "store" &&
      property.initializer.kind === ts.SyntaxKind.FalseKeyword,
  );
}

function inspectFile(file) {
  const text = readFileSync(file, "utf8");
  const scriptKind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : file.endsWith(".js") || file.endsWith(".mjs")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const issues = [];
  let completionCalls = 0;

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      expressionPath(node.expression).endsWith(".chat.completions.create")
    ) {
      completionCalls += 1;
      if (!hasStoreFalse(node)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        issues.push(`${file}:${line}: Chat Completions call must set store: false`);
      }
    }

    if (isConsoleLogCall(node, sourceFile)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const route = findRoutePath(node, sourceFile);
      const isAiLogging =
        file.endsWith("/ai-service.ts") ||
        file.endsWith("/ai-context.ts") ||
        Boolean(route && AI_ROUTE.test(route));
      const isUserContentLogging =
        isAiLogging || Boolean(route && MESSAGE_ROUTE.test(route));
      const isProviderLogging =
        file.endsWith("/banking-routes.ts") ||
        file.endsWith("/bill-payment-routes.ts") ||
        file.endsWith("/utility-portal-routes.ts") ||
        Boolean(route && PROVIDER_ROUTE.test(route));

      for (const argument of node.arguments) {
        const sensitiveName = containsSensitiveReference(
          argument,
          SENSITIVE_IDENTIFIERS,
        );
        if (sensitiveName) {
          issues.push(
            `${file}:${line}: console logging references sensitive value ${sensitiveName}`,
          );
        }

        if (
          isUserContentLogging &&
          containsSensitiveReference(argument, AI_CONTENT_IDENTIFIERS)
        ) {
          const value = containsSensitiveReference(argument, AI_CONTENT_IDENTIFIERS);
          issues.push(
            `${file}:${line}: console logging references AI content ${value}`,
          );
        }

        if (
          route &&
          HEALTH_ROUTE.test(route) &&
          !ts.isStringLiteralLike(argument) &&
          !ts.isNumericLiteral(argument)
        ) {
          issues.push(
            `${file}:${line}: health-route console logs may contain only static labels`,
          );
        }

        if (
          ((route && SENSITIVE_ROUTE.test(route)) || isProviderLogging) &&
          isDirectErrorValue(argument)
        ) {
          issues.push(
            `${file}:${line}: sensitive-route errors must use sanitized operational logging`,
          );
        }

        if (
          isAiLogging &&
          (isDirectErrorValue(argument) ||
            containsSensitiveReference(argument, new Set(["error", "err", "exception"])))
        ) {
          issues.push(
            `${file}:${line}: AI errors must use sanitized operational logging`,
          );
        }

        if (
          isProviderLogging &&
          (isDirectErrorValue(argument) ||
            containsSensitiveReference(argument, new Set(["error", "err", "exception"])))
        ) {
          issues.push(
            `${file}:${line}: provider errors must use sanitized operational logging`,
          );
        }

        if (
          /\b(?:password|passwd|secret|token|api[_ -]?key)\s*[:=]\s*[^,\s}'"]+/i.test(
            argument.getText(sourceFile),
          )
        ) {
          issues.push(`${file}:${line}: console string may contain a credential`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { issues, completionCalls };
}

const mode = process.argv[2];
if (mode !== "--source" && mode !== "--bundles") {
  console.error("Usage: node scripts/check-sensitive-logging.mjs --source|--bundles [files...]");
  process.exit(2);
}

const files =
  mode === "--source"
    ? collectServerSources("server")
    : process.argv.slice(3).length
      ? process.argv.slice(3)
      : REQUIRED_BUNDLES;

const missingFiles = files.filter((file) => !existsSync(file));
if (missingFiles.length) {
  console.error(`Sensitive logging check is missing required files: ${missingFiles.join(", ")}`);
  process.exit(1);
}

const results = files.map((file) => ({
  file,
  ...inspectFile(file),
}));
const issues = results.flatMap((result) => result.issues);
const completionCalls = results.reduce(
  (total, result) => total + result.completionCalls,
  0,
);

if (mode === "--source" && completionCalls < 1) {
  issues.push("No Chat Completions calls were found in server source");
}
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(
  `Sensitive logging check passed (${files.length} ${mode === "--source" ? "source files" : "bundles"}; ${completionCalls} Chat Completions calls checked).`,
);

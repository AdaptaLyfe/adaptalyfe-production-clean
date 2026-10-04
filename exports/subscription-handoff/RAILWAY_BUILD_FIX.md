# Railway build correction

## Confirmed issue in the current workspace

Ten package-lock.json tarball URLs used Replit-only internal registry addresses.
Those addresses are not suitable for the external Railway builder. They have
been replaced with matching public npm URLs. Package versions and integrity
hashes are unchanged. All ten public tarball URLs responded successfully.

The screenshot's npm deprecation warnings are not the final failure message.
The complete Railway build log is still needed to establish the cause of that
specific failed deployment.

## Apply to the repository Railway builds

Back up or commit your repository first. Copy the following files from this
package into the repository root:

- package.json (matching manifest; unchanged in this workspace)
- package-lock.json (corrected tarball URLs)
- nixpacks.toml (existing explicit development-dependency install)
- railway.json (existing Nixpacks/start/health-check configuration)

If the remote repository has independent newer dependency/configuration changes,
merge the correction rather than overwriting those changes.

Keep the earlier five-file backend subscription patch too. This package does
not replace or deploy that patch.

The Nixpacks phases must run:

1. npm ci --include=dev
2. npm run build

The start command must remain:

    node dist/production.js

Do not change databases, subscription records, upload keys, or credentials to
resolve this build problem.

Commit to the actual branch linked to the intended Railway service and deploy
that branch. Confirm the new deployment succeeds before testing the Android app.
The previously configured public backend health endpoint responded with HTTP
200, but that does not establish which subscription implementation is live.

## Subscription diagnosis after a successful deployment

Cancellation alone retains access through Google's verified expiry. A refund
without revocation is not proof that entitlement ended. Refund-and-revoke should
end entitlement immediately. Use Google's actual subscription state; do not
manually change the account to free based only on a refund screenshot.

The current backend source refreshes Google Play through the authenticated
GET /api/subscription endpoint. Authenticated real-time notifications also update
the account. No live account or purchase token was queried during this check.

After the backend is live, use the refresh icon on the Flutter Subscription
screen. If an explicitly revoked subscription still appears active, provide
sanitized backend logs for that refresh and a screenshot of the top status area.

Google's documented distinction:
https://support.google.com/googleplay/android-developer/answer/2741495

## Verification

- Ten public tarballs reachable; versions/integrity hashes unchanged.
- No private Replit tarball URLs remain.
- npm run build passed locally.
- Railway deployment, full Railway logs and the affected live account's
  subscription state remain unverified.
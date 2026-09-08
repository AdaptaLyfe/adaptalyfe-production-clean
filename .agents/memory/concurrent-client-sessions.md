---
name: Concurrent client sessions
description: Rules for keeping web and native mobile authentication independent while sharing one account.
---

Web and native authentication must use independent credentials for the same account: browsers use the HttpOnly cookie session, while native Capacitor clients use a separate random bearer token stored in the session store. Native requests must not send browser cookies, and browser requests must not receive or persist the bearer token.

**Why:** Reusing a cookie session ID as a bearer token, or treating a mobile token as required for web authentication, couples browser and mobile login/logout behavior and breaks concurrent use.

**How to apply:** Issue bearer tokens only for the native-client request path; validate bearer identity in request-specific auth context rather than persisting it into cookie session state. Cookie and bearer logout must invalidate only the credential used by that client. Keep username equality exact and preserve shared subscription entitlement across both clients.
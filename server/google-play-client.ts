export async function createGooglePlayPublisher(): Promise<any> {
  const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error("Google Play server verification is not configured.");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  return google.androidpublisher({ version: "v3", auth });
}

export async function isAuthenticatedGooglePlayPush(
  request: { headers?: Record<string, string | string[] | undefined> },
): Promise<boolean> {
  const authorization = request.headers?.authorization;
  const audience = process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE;
  const expectedEmail = process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL;
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ") ||
    !audience ||
    !expectedEmail
  ) {
    return false;
  }

  try {
    const idToken = authorization.slice("Bearer ".length).trim();
    const { google } = await import("googleapis");
    const oauthClient = new google.auth.OAuth2();
    const ticket = await oauthClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    return (
      payload?.email_verified === true &&
      payload.email === expectedEmail
    );
  } catch {
    return false;
  }
}
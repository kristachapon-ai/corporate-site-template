export async function onRequestGet(context) {
  const clientKey = context.env.TIKTOK_CLIENT_KEY;

  if (!clientKey) {
    return new Response("TIKTOK_CLIENT_KEY is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
      },
    });
  }

  const redirectUri =
    "https://ngtraining.pages.dev/api/tiktok/callback";

  // Generate a cryptographically random anti-CSRF state.
  const stateBytes = new Uint8Array(32);
  crypto.getRandomValues(stateBytes);

  const state = Array.from(stateBytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  const authorizeUrl = new URL(
    "https://www.tiktok.com/v2/auth/authorize/"
  );

  authorizeUrl.searchParams.set("client_key", clientKey);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set(
    "scope",
    "user.info.basic,video.list"
  );
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const headers = new Headers();

  headers.set("Location", authorizeUrl.toString());

  headers.append(
    "Set-Cookie",
    `tiktok_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}

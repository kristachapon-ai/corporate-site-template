
export async function onRequest(context) {
  const { request, env } = context;

  if (!env.DB) {
    return Response.json(
      {
        success: false,
        error: "Database is unavailable."
      },
      { status: 503 }
    );
  }

  const cookieHeader =
    request.headers.get("Cookie") || "";

  const sessionMatch = cookieHeader.match(
    /(?:^|;\s*)ng_admin_session=([a-f0-9]{64})(?=;|$)/
  );

  if (!sessionMatch) {
    return unauthorized();
  }

  const token = sessionMatch[1];

  try {
    const session = await env.DB.prepare(
      `
        SELECT expires_at
        FROM admin_sessions
        WHERE token = ?
        LIMIT 1
      `
    )
      .bind(token)
      .first();

    if (!session) {
      return unauthorized();
    }

    const expiresAt = Date.parse(session.expires_at);

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return unauthorized();
    }

    return context.next();
  } catch (error) {
    console.error(
      "Article API authentication error:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Authentication unavailable."
      },
      { status: 503 }
    );
  }
}

function unauthorized() {
  return Response.json(
    {
      success: false,
      error: "Unauthorized. Please sign in."
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

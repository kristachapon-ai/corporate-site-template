export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname === "/admin/login.html") {
  return context.next();
}
  const cookieHeader =
    context.request.headers.get("Cookie") || "";

  const sessionMatch = cookieHeader.match(
    /(?:^|;\s*)ng_admin_session=([^;]+)/
  );

  if (!sessionMatch) {
    return Response.redirect(
      `${url.origin}/admin/login.html`,
      302
    );
  }

  const token = sessionMatch[1];

  try {
    const session = await context.env.DB.prepare(
      `
        SELECT token, expires_at
        FROM admin_sessions
        WHERE token = ?
        LIMIT 1
      `
    )
      .bind(token)
      .first();

    if (!session) {
      return Response.redirect(
        `${url.origin}/admin/login.html`,
        302
      );
    }

    const expiresAt =
      new Date(session.expires_at).getTime();

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      await context.env.DB.prepare(
        `
          DELETE FROM admin_sessions
          WHERE token = ?
        `
      )
        .bind(token)
        .run();

      return Response.redirect(
        `${url.origin}/admin/login.html`,
        302
      );
    }

    return context.next();
  } catch (error) {
    console.error("Admin guard error:", error);

    return Response.redirect(
      `${url.origin}/admin/login.html`,
      302
    );
  }
}

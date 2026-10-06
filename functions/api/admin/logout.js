export async function onRequestPost(context) {
  const cookieHeader =
    context.request.headers.get("Cookie") || "";

  const sessionMatch = cookieHeader.match(
    /(?:^|;\s*)ng_admin_session=([^;]+)/
  );

  if (sessionMatch) {
    const token = sessionMatch[1];

    try {
      await context.env.DB.prepare(
        `DELETE FROM admin_sessions WHERE token = ?`
      )
        .bind(token)
        .run();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie":
          "ng_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      },
    }
  );
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    const adminUsername = context.env.ADMIN_USERNAME;
    const adminPassword = context.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return Response.json(
        {
          success: false,
          message: "Admin credentials are not configured."
        },
        { status: 500 }
      );
    }

    if (
      username !== adminUsername ||
      password !== adminPassword
    ) {
      return Response.json(
        {
          success: false,
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
        },
        { status: 401 }
      );
    }

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);

    const token = Array.from(tokenBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = new Date(
      Date.now() + 8 * 60 * 60 * 1000
    ).toISOString();

    await context.env.DB.prepare(
      `
        INSERT INTO admin_sessions (
          token,
          expires_at
        )
        VALUES (?, ?)
      `
    )
      .bind(token, expiresAt)
      .run();

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie":
            `ng_admin_session=${token}; ` +
            `Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`
        }
      }
    );
  } catch (error) {
    console.error("Admin login error:", error);

    return Response.json(
      {
        success: false,
        message: "ไม่สามารถเข้าสู่ระบบได้"
      },
      { status: 500 }
    );
  }
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return new Response(
      `TikTok authorization failed: ${errorDescription || error}`,
      {
        status: 400,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
        },
      }
    );
  }

  if (!code) {
    return new Response(
      "NG Training TikTok callback is ready.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
        },
      }
    );
  }

  return new Response(
    `TikTok authorization code received successfully.${state ? " State received." : ""}`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
      },
    }
  );
}

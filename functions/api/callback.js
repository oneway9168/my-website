export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(request.headers.get("Cookie") || "", "cms_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return renderCallback("error", { error: "GitHub login state did not match." });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return renderCallback("error", { error: "GitHub OAuth environment variables are missing." });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "one-way-top-decap-cms",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
      state,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return renderCallback("error", {
      error: tokenData.error_description || tokenData.error || "GitHub token exchange failed.",
    });
  }

  return renderCallback("success", {
    token: tokenData.access_token,
    provider: "github",
  });
}

function getCookie(cookieHeader, name) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function renderCallback(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  return new Response(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>GitHub login</title>
  </head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage(message, "*");
          window.close();
        } else {
          document.body.textContent = "GitHub login finished. You can close this window.";
        }
      }());
    </script>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": "cms_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/; Max-Age=0",
      },
    },
  );
}

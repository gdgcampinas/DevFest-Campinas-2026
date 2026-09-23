/**
 * Token de acesso Google a partir de uma conta de serviço (JWT RS256 assinado
 * com node:crypto, sem npm). Recebe tudo por parâmetro (conta, escopo, fetch,
 * relógio) pra ser testável sem rede. O token fica em cache até perto de expirar.
 */
const crypto = require("node:crypto");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const base64Url = input => Buffer.from(input).toString("base64url");

function createServiceAccountAuth({ serviceAccount, scope, fetchFn = fetch, nowFn = () => Date.now() }) {
  let cached = null;

  function signedAssertion() {
    const issuedAt = Math.floor(nowFn() / 1000);
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = base64Url(JSON.stringify({
      iss: serviceAccount.client_email,
      scope,
      aud: TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }));
    const signature = crypto.createSign("RSA-SHA256").update(`${header}.${claims}`).sign(serviceAccount.private_key, "base64url");
    return `${header}.${claims}.${signature}`;
  }

  async function getAccessToken() {
    if (cached && cached.expiresAt - 60_000 > nowFn()) return cached.token;
    const response = await fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signedAssertion() }),
    });
    if (!response.ok) throw new Error(`Google OAuth ${response.status}: ${await response.text()}`);
    const { access_token: token, expires_in: expiresIn } = await response.json();
    cached = { token, expiresAt: nowFn() + expiresIn * 1000 };
    return token;
  }

  return { getAccessToken };
}

module.exports = { createServiceAccountAuth };

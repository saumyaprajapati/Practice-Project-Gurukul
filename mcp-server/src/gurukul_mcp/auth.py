"""Bearer-token check for the MCP endpoint.

Tokens are Supabase access tokens, issued by Supabase Auth's OAuth 2.1 server
after the user approves the agent on the website's /oauth/consent page.
Returning None makes the SDK answer 401 with the WWW-Authenticate challenge
that starts the agent's OAuth login.

Asymmetric (RS256/ES256) tokens are verified locally against Supabase's JWKS;
symmetric (HS256) ones are confirmed by asking Supabase Auth (GET /user),
the same fallback supabase-js getClaims() uses.
"""

import logging
import time
from typing import Any

import httpx
import jwt
from mcp.server.auth.provider import AccessToken

logger = logging.getLogger(__name__)

ASYMMETRIC_ALGORITHMS = {"RS256", "ES256"}
JWKS_REFRESH_SECONDS = 600
JWKS_MIN_REFETCH_SECONDS = 30


class SupabaseTokenVerifier:
    def __init__(self, issuer: str, publishable_key: str, transport: httpx.AsyncBaseTransport | None = None):
        self._issuer = issuer
        self._http = httpx.AsyncClient(headers={"apikey": publishable_key}, timeout=10.0, transport=transport)
        self._jwks: dict[str, jwt.PyJWK] = {}
        self._jwks_fetched_at = float("-inf")

    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            claims = await self._verified_claims(token)
        except Exception as error:  # any failure = not a valid token
            logger.info("Rejected bearer token: %s", error)
            return None
        if not claims.get("sub") or claims.get("role") != "authenticated":
            return None
        scope = claims.get("scope")
        return AccessToken(
            token=token,
            client_id=str(claims.get("client_id") or "gurukul"),
            scopes=scope.split() if isinstance(scope, str) else [],
            expires_at=claims.get("exp"),
            subject=claims["sub"],
            claims={"iss": claims.get("iss"), "email": claims.get("email")},
        )

    async def _verified_claims(self, token: str) -> dict[str, Any]:
        header = jwt.get_unverified_header(token)
        alg, kid = header.get("alg"), header.get("kid")

        if alg in ASYMMETRIC_ALGORITHMS and kid:
            key = await self._signing_key(kid)
            return jwt.decode(
                token,
                key=key,
                algorithms=[alg],
                issuer=self._issuer,
                options={"require": ["exp", "sub"], "verify_aud": False},
            )

        # Symmetric key (or no kid): only Supabase can check it.
        response = await self._http.get(f"{self._issuer}/user", headers={"Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise ValueError(f"Supabase Auth rejected the token ({response.status_code})")
        claims = jwt.decode(token, options={"verify_signature": False})
        if claims.get("exp", 0) < time.time():
            raise ValueError("token expired")
        return claims

    async def _signing_key(self, kid: str) -> jwt.PyJWK:
        age = time.monotonic() - self._jwks_fetched_at
        # Refetch when stale, or for an unknown kid (key rotation) at most every 30 s,
        # so tokens with made-up kids can't make us hammer Supabase.
        if age > JWKS_REFRESH_SECONDS or (kid not in self._jwks and age > JWKS_MIN_REFETCH_SECONDS):
            response = await self._http.get(f"{self._issuer}/.well-known/jwks.json")
            response.raise_for_status()
            self._jwks = {key["kid"]: jwt.PyJWK(key) for key in response.json().get("keys", []) if "kid" in key}
            self._jwks_fetched_at = time.monotonic()
        if kid not in self._jwks:
            raise ValueError(f"unknown signing key {kid}")
        return self._jwks[kid]

"""The endpoint only serves agents holding a valid Supabase token."""

import time

import httpx

from conftest import FakeSupabase, McpClient


def test_no_token_gets_oauth_challenge(client: McpClient, mcp_base: str) -> None:
    response = client.post("initialize", token=None)
    assert response.status_code == 401
    challenge = response.headers["www-authenticate"]
    assert challenge.startswith("Bearer")
    assert f'resource_metadata="{mcp_base}/.well-known/oauth-protected-resource/mcp"' in challenge


def test_protected_resource_metadata_points_at_supabase(mcp_base: str, fake: FakeSupabase) -> None:
    metadata = httpx.get(f"{mcp_base}/.well-known/oauth-protected-resource/mcp").json()
    assert metadata["resource"] == f"{mcp_base}/mcp"
    assert metadata["authorization_servers"] == [fake.issuer]


def test_rejects_garbage_forged_expired_and_foreign_tokens(client: McpClient, fake: FakeSupabase) -> None:
    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa

    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    forged = jwt.encode({"sub": "x", "role": "authenticated", "iss": fake.issuer, "exp": int(time.time()) + 60},
                        other_key, algorithm="RS256", headers={"kid": "test-key"})
    bad_tokens = {
        "garbage": "not.a.jwt",
        "forged signature": forged,
        "expired": fake.token(exp=int(time.time()) - 10),
        "wrong issuer": fake.token(iss="https://evil.example/auth/v1"),
        "anon role": fake.token(role="anon"),
        "HS256 Supabase doesn't know": jwt.encode({"sub": "x", "role": "authenticated", "exp": int(time.time()) + 60}, "an-attacker-guess-0123456789abcdef", algorithm="HS256"),
    }
    for label, token in bad_tokens.items():
        assert client.post("initialize", token=token).status_code == 401, label


def test_accepts_hs256_token_confirmed_by_supabase_auth(client: McpClient, fake: FakeSupabase) -> None:
    client.token = fake.token(alg="HS256")
    assert "Signed in to Gurukul as Asha" in client.call("whoami")["content"][0]["text"]


def test_unknown_host_header_is_refused(client: McpClient) -> None:
    # DNS-rebinding protection: only localhost and MCP_PUBLIC_URL's host are served.
    assert client.post("tools/list", host="evil.example").status_code in (400, 403, 421)

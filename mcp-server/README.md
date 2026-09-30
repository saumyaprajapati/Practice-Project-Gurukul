# Gurukul MCP server (Python)

A separate server that lets learners use Gurukul from any AI agent: Claude
(Code, Desktop, claude.ai), ChatGPT, Cursor, VS Code Copilot or their own small
agent. It speaks MCP over **Streamable HTTP**:

```
http://localhost:8000/mcp            (local)
https://<public-url>/mcp             (tunnel / deployed)
```

It is independent from the Next.js website (`frontend/`). The two never call
each other: both only talk to Supabase. The website only provides the login and
**Allow / Deny** page (`/oauth/consent`) that agents send the user to.

```
 AI agent ──POST /mcp (Bearer token)──► this server (Python, :8000) ──► Supabase, as that user (RLS)
    │ 401 → /.well-known/oauth-protected-resource/mcp → Supabase Auth (OAuth 2.1)
    └────────────── browser ──► website /oauth/consent (:3000) → log in / sign up → Allow
```

## What an agent can do

| Tool | What it does | Example ask |
|---|---|---|
| `search_courses` | Finds the course that teaches a technology or term, and says if you're already enrolled | "I just hit *Docker volumes*, is there a Gurukul course on it?" |
| `get_course` | Description, price, module/lesson outline, your status | "What's in the Docker course?" |
| `list_my_courses` | Your courses with progress and expiry (`active`, `completed`, `expired`, `all`) | "Which Gurukul courses have I finished?" |
| `recap_topic` | Pulls the matching lessons from **your** courses so the agent can write a short refresher | "I forgot git rebase vs merge from my Git course, quick recap?" |
| `get_lesson` | The full text of one lesson | "Show me the whole *Volumes* lesson" |
| `enroll_in_course` | Enrols you (mock checkout, no payment). The agent must ask you first | "Enrol me in that course" |
| `whoami` | The Gurukul account the agent is connected as | "Which Gurukul account are you using?" |

Plus the prompt **`brush_up`** (topic): a 5-bullet refresher from your own lessons.

Summaries are written by **your agent's own model** from the lesson text this
server returns, so no AI API key is needed and nothing is made up: recap only
uses lessons from courses you can currently open.

## How sign-up / login works

An MCP server can't see which email the agent is logged in with, so it uses the
standard MCP OAuth login, with **Supabase Auth as the OAuth server**:

1. You add `http://localhost:8000/mcp` to your agent.
2. The agent opens the **Gurukul website** in your browser: log in, or **sign up
   with your email** (same CAPTCHA and email code as the website).
3. The **Connect an AI agent** page shows the agent's name and what it may do →
   **Allow**.
4. The agent gets a token for *your* account. Every tool runs as you, under the
   same security rules as the website. This server never has the secret key.

## Setup

### 1. Supabase (once)

1. Run `frontend/supabase/phase9-mcp.sql` in the SQL editor (after phase 8).
2. **Authentication → OAuth Server**: enable it, set **Authorization path**
   `/oauth/consent`, and enable **Dynamic client registration**.
3. **Authentication → URL Configuration → Site URL**: where the *website* runs
   (e.g. `http://localhost:3000`). Supabase sends the browser to
   `<Site URL>/oauth/consent`.
4. **Project Settings → JWT Keys**: asymmetric signing keys (default for new
   projects) let this server verify tokens locally; older HS256 projects work
   too (the token is checked with Supabase Auth instead).

### 2. This server

Needs [uv](https://docs.astral.sh/uv/) (it installs the right Python itself).

```
cd mcp-server
uv sync
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Fill in `.env`: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, the same values as
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
`frontend/.env.local`. **Never the secret key.**

| Variable | Default | Meaning |
|---|---|---|
| `SUPABASE_URL` | (required) | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | (required) | The publishable key (`sb_publishable_…`) |
| `GURUKUL_APP_URL` | `http://localhost:3000` | Website address, used for links in results |
| `MCP_PUBLIC_URL` | `http://localhost:8000` | This server's public address (tunnel / deployed), without `/mcp` |
| `HOST` / `PORT` | `127.0.0.1` / `8000` | Where it listens (`0.0.0.0` in Docker / on a server) |

### 3. Run

```
uv run gurukul-mcp
```

Keep the website running too (`npm run dev` in `frontend/`): it serves the
login and consent pages.

## Connecting an agent

**Claude Code**

```
claude mcp add --transport http gurukul http://localhost:8000/mcp
```

then `/mcp` → **gurukul** → **Authenticate**. (Moving from the old in-app
server? `claude mcp remove gurukul` first.)

**VS Code** (`.vscode/mcp.json`)

```json
{ "servers": { "gurukul": { "type": "http", "url": "http://localhost:8000/mcp" } } }
```

**Cursor** (`~/.cursor/mcp.json`)

```json
{ "mcpServers": { "gurukul": { "url": "http://localhost:8000/mcp" } } }
```

**MCP Inspector** (try every tool by hand): `npx @modelcontextprotocol/inspector`,
transport **Streamable HTTP**, URL `http://localhost:8000/mcp`, then
**Open Auth Settings → Quick OAuth Flow**.

**stdio-only agents**: `npx -y mcp-remote http://localhost:8000/mcp`.

**Claude.ai / ChatGPT (web)** run in the cloud and need **public HTTPS URLs**
for both servers:

1. `cloudflared tunnel --url http://localhost:8000` → set `MCP_PUBLIC_URL` in
   `.env` to that URL and restart `uv run gurukul-mcp`.
2. The website tunnel as usual (`npm run share` + `npm run tunnel` in
   `frontend/`) → set the Supabase **Site URL** to it.
3. Add the connector: `https://<mcp-tunnel>.trycloudflare.com/mcp`.

trycloudflare URLs change on every start. For stable URLs, deploy this server
(see Docker below) and the website.

## Docker

```
docker build -t gurukul-mcp .
docker run -p 8000:8000 --env-file .env gurukul-mcp
```

Set `MCP_PUBLIC_URL` to the deployed address (Render, Fly.io, Railway, …).

## Tests

```
uv run pytest
```

Runs the real server against a fake Supabase: the 401 challenge and metadata,
bad, forged, expired and foreign tokens, the HS256 fallback, the host-header
check, every tool and the prompt, and that every Supabase call carries the
user's own token (and filters enrollments to them).

## Code

| File | Role |
|---|---|
| `src/gurukul_mcp/server.py` | Builds the `MCPServer` (MCP Python SDK 2.x): stateless Streamable HTTP at `/mcp`, OAuth resource-server settings, host checks, CORS |
| `src/gurukul_mcp/tools.py` | The 7 tools, the prompt and the server instructions |
| `src/gurukul_mcp/auth.py` | Verifies Supabase tokens (JWKS, or Supabase Auth for HS256) |
| `src/gurukul_mcp/supabase.py` | PostgREST calls with the publishable key + the user's token |
| `src/gurukul_mcp/domain.py` | Same helpers as the website: access, progress state, curriculum shape, ₹ prices |
| `src/gurukul_mcp/config.py` | Settings from `.env` |
| `frontend/supabase/phase9-mcp.sql` | `search_courses`, `search_my_lessons` (security invoker, so RLS applies) |
| `frontend/src/app/oauth/consent/page.js` | The Allow / Deny page on the website |

## Troubleshooting

| Problem | Fix |
|---|---|
| `SUPABASE_URL is not set` on start | Create `.env` from `.env.example` |
| Agent says the server doesn't support registration | Enable **Dynamic client registration** in Supabase |
| Consent page opens on the wrong address | Supabase **Site URL** doesn't match where the website runs |
| `421 Misdirected Request` / invalid host | Requests arrive on a host that isn't localhost or `MCP_PUBLIC_URL`: set `MCP_PUBLIC_URL` to the tunnel/deployed URL |
| Browser lands on `/gurukul` instead of the consent page | The consent link expired (30 min). Reconnect from the agent |
| `recap_topic` finds nothing | You can't open that course now (not enrolled, or expired): `search_courses` + `enroll_in_course` |
| Every tool fails after about an hour | The agent should refresh its token automatically; if not, re-authenticate |

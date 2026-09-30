# Gurukul MCP server

Gurukul has an **MCP server** (Model Context Protocol, Streamable HTTP), so
learners can use Gurukul from any AI agent: Claude (Code, Desktop, claude.ai),
ChatGPT, Cursor, VS Code Copilot, or their own small agent.

```
http://localhost:3000/api/mcp        (local)
https://<your-public-url>/api/mcp    (tunnel / deployed)
```

## What an agent can do

| Tool | What it does | Example ask |
|---|---|---|
| `search_courses` | Finds the course that teaches a technology or term, and says if you're already enrolled | "I just hit *Docker volumes* — is there a Gurukul course on it?" |
| `get_course` | Course description, price, module/lesson outline, your status | "What's in the Docker course?" |
| `list_my_courses` | Your enrolled courses with progress and expiry (`active`, `completed`, `expired`, `all`) | "Which Gurukul courses have I finished?" |
| `recap_topic` | Pulls the matching lessons from **your** courses so the agent can write a short refresher | "I forgot git rebase vs merge from my Git course, quick recap?" |
| `get_lesson` | The full text of one lesson | "Show me the whole *Volumes* lesson" |
| `enroll_in_course` | Enrols you (mock checkout, no payment). The agent must ask you first | "Enrol me in that course" |
| `whoami` | The Gurukul account the agent is connected as | "Which Gurukul account are you using?" |

There is also a prompt, **`brush_up`** (topic), for a 5-bullet refresher from your own lessons.

The summary is written by **your agent's own model** from the lesson text
Gurukul returns. Gurukul needs no AI API key and makes nothing up: recap only
uses lessons from courses you can currently open.

## How sign-up / login works

An MCP server can't see which email your agent is signed in with, so Gurukul
uses the standard MCP OAuth login:

1. You add the server URL to your agent.
2. The agent opens a **Gurukul page in your browser**. Log in, or **sign up with
   your email** (same CAPTCHA and email code as the website).
3. The **Connect an AI agent** page shows the agent's name and what it may do.
   Click **Allow**.
4. The agent receives a token for *your* account. Every tool runs as you, with
   the same security rules as the website. No secret key is involved.

To disconnect an agent, remove the server in the agent (or sign in again with a
different account via "Use another account" on the consent page).

## Supabase setup (once)

1. Run **`supabase/phase9-mcp.sql`** in the SQL editor (after phase 8).
2. **Authentication → OAuth Server**:
   - Enable the OAuth 2.1 server.
   - **Authorization path**: `/oauth/consent`
   - Enable **Dynamic client registration** (agents register themselves; there
     is no client list to maintain).
3. **Authentication → URL Configuration → Site URL**: the address the app is
   opened at, e.g. `http://localhost:3000` locally, or your tunnel/deployed URL.
   Supabase sends the browser to `<Site URL>/oauth/consent`, so it must be the
   same app that serves the MCP server.
4. **Project Settings → JWT Keys**: use the asymmetric signing keys (the
   default for new projects), so tokens can be verified locally.

## Connecting an agent

Start the app first (`npm run dev`, or `npm run share` for the production build).

**Claude Code**

```
claude mcp add --transport http gurukul http://localhost:3000/api/mcp
```

Then type `/mcp` in Claude Code → **gurukul** → **Authenticate**.

**VS Code** (`.vscode/mcp.json`)

```json
{ "servers": { "gurukul": { "type": "http", "url": "http://localhost:3000/api/mcp" } } }
```

**Cursor** (`~/.cursor/mcp.json`)

```json
{ "mcpServers": { "gurukul": { "url": "http://localhost:3000/api/mcp" } } }
```

**Claude.ai / ChatGPT (web)**: Settings → Connectors → Add custom connector →
`https://<your-public-url>/api/mcp`. Web agents run in the cloud, so they need
a **public HTTPS URL**, not localhost.

**MCP Inspector** (for testing every tool by hand)

```
npx @modelcontextprotocol/inspector
```

Transport **Streamable HTTP**, URL `http://localhost:3000/api/mcp`, then
**Open Auth Settings → Quick OAuth Flow**.

**Agents with only stdio support**: `npx -y mcp-remote http://localhost:3000/api/mcp`.

### Public URL with the tunnel

`npm run share` in one terminal, `npm run tunnel` in another, then use
`https://<random>.trycloudflare.com/api/mcp`. The tunnel URL changes every
time, so update the **Site URL** in Supabase to match and reconnect the agent.
For a URL that stays the same, deploy the app (e.g. Vercel) or use a named
Cloudflare tunnel.

## How it's built

| File | Role |
|---|---|
| `src/app/api/mcp/route.js` | The MCP endpoint (`mcp-handler`, stateless Streamable HTTP), wrapped in `withMcpAuth` |
| `src/lib/mcp/tools.js` | Tools, prompt and server instructions |
| `src/lib/mcp/auth.js` | Checks the bearer token with Supabase (`getClaims`) |
| `src/lib/mcp/supabase.js` | Supabase client per request, using the user's token + publishable key |
| `src/app/.well-known/oauth-protected-resource/…` | RFC 9728 metadata: tells agents Supabase Auth issues the tokens |
| `src/app/oauth/consent/page.js` | The Allow / Deny page; signed-out users log in or sign up first and come back |
| `supabase/phase9-mcp.sql` | `search_courses` and `search_my_lessons` (security invoker, so RLS applies) |

Without a token, `/api/mcp` answers `401` with
`WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource/api/mcp"`,
which is what starts the agent's login.

## Troubleshooting

| Problem | Fix |
|---|---|
| Agent says the server doesn't support registration | Enable **Dynamic client registration** (Authentication → OAuth Server) |
| Browser lands on `/gurukul` instead of the consent page after login | The consent link expired (30 min) or was opened in another tab. Start the connection from the agent again |
| "This authorization request has expired or is invalid" | Same: reconnect from the agent |
| Consent page opens on the wrong address | Site URL in Supabase doesn't match where the app runs |
| `recap_topic` finds nothing | The course isn't one you can open now (not enrolled, or access expired). `search_courses` + `enroll_in_course` |
| Every tool fails after about an hour | The agent should refresh its token automatically; if not, reconnect / re-authenticate |

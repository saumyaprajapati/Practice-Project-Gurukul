"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import { AUTH_ROUTES, clearReturnPath, rememberReturnPath } from "@/lib/auth/routes";
import { getSession, logout } from "@/lib/auth/session";
import { getSupabase } from "@/lib/supabase/client";

// OAuth consent screen for AI agents connecting to the Gurukul MCP server
// (/api/mcp). Supabase Auth's OAuth server sends the browser here with an
// authorization_id (Dashboard → Authentication → OAuth Server → authorization
// path). Signed-out users log in or sign up first and come back here.

const PERMISSIONS = [
  "See your name and email",
  "Search courses and see your enrolled courses and progress",
  "Read the lessons of courses you're enrolled in",
  "Enrol you in a course when you ask it to",
];

function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

export default function OAuthConsentPage() {
  const router = useRouter();
  const [authorizationId, setAuthorizationId] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = new URLSearchParams(window.location.search).get("authorization_id");

    async function load() {
      if (!id) {
        setError("This link is missing its authorization request. Start the connection from your AI agent again.");
        return;
      }
      const session = await getSession();
      if (cancelled) return;
      if (!session) {
        rememberReturnPath(currentPath());
        router.replace(AUTH_ROUTES.login);
        return;
      }
      clearReturnPath();

      const { data, error: loadError } = await getSupabase().auth.oauth.getAuthorizationDetails(id);
      if (cancelled) return;
      if (loadError) {
        setError("This authorization request has expired or is invalid. Start the connection from your AI agent again.");
        return;
      }
      if (data.redirect_url) {
        // Already approved before for these permissions.
        window.location.assign(data.redirect_url);
        return;
      }
      setAuthorizationId(id);
      setDetails(data);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function decide(approve) {
    setBusy(true);
    setError(null);
    const oauth = getSupabase().auth.oauth;
    const { data, error: decideError } = approve
      ? await oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (decideError || !data?.redirect_url) {
      setBusy(false);
      setError("Couldn't complete the request. Start the connection from your AI agent again.");
      return;
    }
    window.location.assign(data.redirect_url);
  }

  async function switchAccount() {
    setBusy(true);
    const returnPath = currentPath();
    await logout();
    rememberReturnPath(returnPath);
    router.replace(AUTH_ROUTES.login);
  }

  if (!details) {
    return (
      <AuthCard>
        <AuthHeader title="Connect an AI agent" />
        {error ? <AuthError message={error} /> : <p className="text-charcoal/80">Loading…</p>}
      </AuthCard>
    );
  }

  const clientName = details.client?.name || "An AI agent";

  return (
    <AuthCard>
      <AuthHeader
        title="Connect an AI agent"
        subtitle={`${clientName} wants to use Gurukul as ${details.user?.email}.`}
      />
      <p className="mb-2 font-medium">It will be able to:</p>
      <ul className="mb-6 list-disc space-y-1 pl-5 text-charcoal/85">
        {PERMISSIONS.map((permission) => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
      {details.client?.uri ? (
        <p className="mb-6 text-sm text-charcoal/70">
          App website: <span className="break-all">{details.client.uri}</span>
        </p>
      ) : null}
      <AuthError message={error} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <AuthButton className="flex-1" disabled={busy} onClick={() => decide(true)}>
          Allow
        </AuthButton>
        <AuthButton variant="secondary" className="flex-1" disabled={busy} onClick={() => decide(false)}>
          Deny
        </AuthButton>
      </div>
      <p className="mt-6 text-sm text-charcoal/80">
        Not {details.user?.email}?{" "}
        <button type="button" onClick={switchAccount} disabled={busy} className="text-ochre underline underline-offset-4">
          Use another account
        </button>
      </p>
    </AuthCard>
  );
}

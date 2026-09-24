"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusBadge from "@/components/admin/StatusBadge";
import { getAllUsers, updateUser, setUserBanned, deleteUser } from "@/lib/admin/users";
import { useAdminProfile } from "@/lib/admin/guard";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

const FILTERS = [
  { value: "all", label: "All", test: () => true },
  { value: "admins", label: "Admins", test: (user) => user.isAdmin },
  { value: "instructors", label: "Instructors", test: (user) => user.isInstructor },
  { value: "banned", label: "Banned", test: (user) => user.isBanned },
];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "never";
}

function UserRow({ user, isSelf, onChanged, onDeleted, onError }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [isInstructor, setIsInstructor] = useState(user.isInstructor);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [busy, setBusy] = useState(false);

  async function run(action, after) {
    setBusy(true);
    onError(null);
    try {
      await action();
      after();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleSave(event) {
    event.preventDefault();
    run(
      () => updateUser(user.id, { name, isInstructor, isAdmin }),
      () => {
        onChanged({ ...user, name: name.trim(), isInstructor, isAdmin });
        setEditing(false);
      }
    );
  }

  // Mirrors the database guard rails so the buttons explain themselves.
  const protectedReason = isSelf ? "This is you." : user.isAdmin ? "Remove admin role first." : null;

  return (
    <li className="surface-earthy rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-charcoal">
            {user.name} {isSelf ? <span className="text-sm font-normal text-charcoal/60">(you)</span> : null}
          </p>
          <p className="text-sm text-charcoal/70">{user.email}</p>
          <p className="text-xs text-charcoal/50">
            Joined {formatDate(user.createdAt)} · last sign-in {formatDate(user.lastSignInAt)}
            {user.emailConfirmed ? "" : " · email not verified"} · {user.enrollmentCount} enrollment(s) ·{" "}
            {user.courseCount} course(s) owned
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {user.isAdmin ? <StatusBadge status="admin" /> : null}
          {user.isInstructor ? <StatusBadge status="instructor" /> : null}
          {user.isBanned ? <StatusBadge status="banned" /> : null}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor={`name-${user.id}`} className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id={`name-${user.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={isInstructor} onChange={(e) => setIsInstructor(e.target.checked)} />
            Instructor
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm" title={isSelf ? "You can't remove your own admin role." : undefined}>
            <input
              type="checkbox"
              checked={isAdmin}
              disabled={isSelf || user.isBanned}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            Admin
          </label>
          <button type="submit" disabled={busy} className="rounded bg-gold px-3 py-2 text-sm font-medium text-charcoal disabled:opacity-60">
            {busy ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="pb-2 text-sm underline underline-offset-4">
            Cancel
          </button>
        </form>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        {!editing ? (
          <button type="button" onClick={() => setEditing(true)} className="font-medium underline underline-offset-4">
            Edit name & roles
          </button>
        ) : null}
        <Link
          href={`${GURUKUL_ROUTES.adminEnrollments}?q=${encodeURIComponent(user.email)}`}
          className="underline underline-offset-4"
        >
          Enrollments
        </Link>
        {user.isBanned ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => setUserBanned(user.id, false), () => onChanged({ ...user, isBanned: false }))}
            className="underline underline-offset-4 disabled:opacity-50"
          >
            Unban
          </button>
        ) : (
          <ConfirmButton
            disabled={busy || Boolean(protectedReason)}
            confirmLabel="Ban (blocks sign-in)"
            onConfirm={() => run(() => setUserBanned(user.id, true), () => onChanged({ ...user, isBanned: true }))}
          >
            Ban
          </ConfirmButton>
        )}
        <ConfirmButton
          disabled={busy || Boolean(protectedReason)}
          confirmLabel="Delete account forever"
          onConfirm={() => run(() => deleteUser(user.id), () => onDeleted(user.id))}
        >
          Delete
        </ConfirmButton>
        {protectedReason ? <span className="text-xs text-charcoal/50">{protectedReason}</span> : null}
      </div>
    </li>
  );
}

// Every account: roles, rename, ban/unban, permanent delete. Guard + tabs:
// admin/layout.js. The database enforces the same rules as the disabled
// buttons (no self-demotion, no banning/deleting admins or yourself).
export default function AdminUsersPage() {
  const admin = useAdminProfile();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAllUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!users) return [];
    const needle = query.trim().toLowerCase();
    const test = FILTERS.find((item) => item.value === filter).test;
    return users.filter(
      (user) => test(user) && (!needle || user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle))
    );
  }, [users, filter, query]);

  return (
    <>
      <h1 className="heading-2">Users</h1>
      <span className="rule-shirorekha" aria-hidden="true" />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded px-3 py-1.5 text-sm font-medium ${filter === item.value ? "bg-gold text-charcoal" : "surface-earthy"}`}
          >
            {item.label} ({users ? users.filter(item.test).length : 0})
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email..."
          aria-label="Search users"
          className="ml-auto w-full rounded border border-brown/40 bg-cream px-3 py-2 text-sm text-charcoal sm:w-72"
        />
      </div>

      <p className="mt-4 text-xs text-charcoal/60">
        Ban blocks sign-in and keeps the account&apos;s data (an already signed-in session lasts up to an hour). Delete
        permanently removes the account with its enrollments and progress; courses they owned are kept without an
        owner.
      </p>

      <AuthError message={error} />

      {!users ? null : visible.length === 0 ? (
        <p className="mt-8 text-charcoal/80">No users match.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === admin?.id}
              onError={setError}
              onChanged={(updated) => setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))}
              onDeleted={(userId) => setUsers((prev) => prev.filter((item) => item.id !== userId))}
            />
          ))}
        </ul>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

// Mock enrollment-override store — the one place a "purchase" or a lesson's
// progress actually gets written down. Styled after lib/auth/session.js's
// localStorage facade: a single JSON key, plain functions, try/catch
// guarded so it degrades silently with no storage available. Overrides are
// layered on top of the static ENROLLMENTS array by lib/courses/enrollment.js
// — this file never reads COURSES/ENROLLMENTS itself, keeping the mock
// Course/Enrollment data pure and this the only place with a side effect.
const STORE_KEY = "gurukul.enrollment.overrides";

export function getOverrides() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable — nothing to persist.
  }
}

function isoDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// Used for both a first-time purchase and a renewal — the resulting record
// looks identical either way (active, freshly (re)dated), so there's no
// need to special-case renewal.
export function activateEnrollment(courseId, progress = 0) {
  const overrides = getOverrides();
  overrides[courseId] = {
    status: "active",
    purchasedAt: isoDateOffset(0),
    expiresAt: isoDateOffset(365),
    progress,
  };
  saveOverrides(overrides);
}

export function setCourseProgress(courseId, progress) {
  const overrides = getOverrides();
  overrides[courseId] = { ...overrides[courseId], progress };
  saveOverrides(overrides);
}

// Renders `{}` on both the server pass and the client's first hydration
// pass (identical, no mismatch), then swaps in the real localStorage data
// once mounted — the same render-a-safe-default-then-resolve pattern
// lib/auth/guard.js's useRequireAuth already uses.
export function useOverrides() {
  const [state, setState] = useState(null);

  useEffect(() => {
    setState(getOverrides());
  }, []);

  return { overrides: state ?? {}, ready: state !== null };
}

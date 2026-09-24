"use client";

import { useEffect, useState } from "react";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import {
  getPendingDeletionRequests,
  approveDeletionRequest,
  declineDeletionRequest,
} from "@/lib/admin/courses";

// Admin guard + tab bar come from app/gurukul/admin/layout.js.
export default function AdminDeletionRequestsPage() {
  const [requests, setRequests] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPendingDeletionRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDecision(requestId, decide) {
    setPendingId(requestId);
    setError(null);
    try {
      await decide(requestId);
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <h1 className="heading-2">Deletion Requests</h1>
      <span className="rule-shirorekha" aria-hidden="true" />

      <AuthError message={error} />

      {!requests ? null : requests.length === 0 ? (
        <p className="mt-8 text-charcoal/80">Nothing waiting for review.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="surface-earthy rounded-lg p-4">
              <h2 className="font-semibold text-charcoal">{request.courseTitle}</h2>
              <p className="mt-1 text-sm text-charcoal/70">
                Approving this permanently deletes the course, along with every learner&apos;s enrollment
                and progress for it.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <AuthButton
                  type="button"
                  disabled={pendingId === request.id}
                  onClick={() => handleDecision(request.id, approveDeletionRequest)}
                >
                  Approve Deletion
                </AuthButton>
                <AuthButton
                  type="button"
                  variant="secondary"
                  disabled={pendingId === request.id}
                  onClick={() => handleDecision(request.id, declineDeletionRequest)}
                >
                  Decline
                </AuthButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

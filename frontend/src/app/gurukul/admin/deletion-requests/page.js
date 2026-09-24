"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/auth/AuthButton";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  getPendingDeletionRequests,
  approveDeletionRequest,
  declineDeletionRequest,
} from "@/lib/admin/courses";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

export default function AdminDeletionRequestsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(null);
  const [requests, setRequests] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfile().then((profile) => {
      if (cancelled) return;
      if (!profile.isAdmin) {
        router.replace(GURUKUL_ROUTES.home);
        return;
      }
      setIsAdmin(true);
      getPendingDeletionRequests().then((data) => {
        if (!cancelled) setRequests(data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDecision(requestId, decide) {
    setPendingId(requestId);
    await decide(requestId);
    setRequests((prev) => prev.filter((request) => request.id !== requestId));
    setPendingId(null);
  }

  if (!isAdmin || !requests) return null;

  return (
    <section className="section-manuscript flex-1">
      <div className="section-inner">
        <h1 className="heading-2">Deletion Requests</h1>
        <span className="rule-shirorekha" aria-hidden="true" />

        {requests.length === 0 ? (
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
      </div>
    </section>
  );
}

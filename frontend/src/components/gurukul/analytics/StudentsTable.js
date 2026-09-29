"use client";

import { useMemo, useState } from "react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import StatusBadge from "@/components/admin/StatusBadge";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function formatRelative(value) {
  if (!value) return "Never";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

// Never-active learners sort as the oldest.
const SORTS = {
  enrolledAt: (student) => new Date(student.enrolledAt).getTime(),
  progress: (student) => student.progressPercent,
  lastActive: (student) => (student.lastActiveAt ? new Date(student.lastActiveAt).getTime() : 0),
};

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(students, totalLessons, fileName) {
  const header = ["Name", "Enrolled on", "Status", "Access until", "Progress %", "Lessons done", "Current lesson", "Last active"];
  const rows = students.map((student) => [
    student.name,
    student.enrolledAt.slice(0, 10),
    student.status,
    student.expiresAt.slice(0, 10),
    student.progressPercent,
    `${student.completedLessons}/${totalLessons}`,
    student.currentLessonTitle ?? "",
    student.lastActiveAt ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function SortHeader({ label, sortKey, sort, onSort }) {
  const isActive = sort.key === sortKey;
  return (
    <th scope="col" className="px-3 py-2" aria-sort={isActive ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => onSort(sortKey)} className="font-medium underline-offset-4 hover:underline">
        {label}
        <span aria-hidden="true">{isActive ? (sort.desc ? " ↓" : " ↑") : ""}</span>
      </button>
    </th>
  );
}

export default function StudentsTable({ students, totalLessons, courseId }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "enrolledAt", desc: true });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? students.filter((student) => student.name.toLowerCase().includes(needle)) : students;
    const valueOf = SORTS[sort.key];
    return [...filtered].sort((a, b) => (sort.desc ? valueOf(b) - valueOf(a) : valueOf(a) - valueOf(b)));
  }, [students, query, sort]);

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, desc: !prev.desc } : { key, desc: true }));
  }

  if (students.length === 0) {
    return <p className="text-charcoal/80">No learners enrolled yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-xs">
          <AuthInput
            id="student-search"
            name="student-search"
            label="Search by name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="mb-4">
          <AuthButton
            type="button"
            variant="secondary"
            onClick={() => downloadCsv(visible, totalLessons, `${courseId}-students.csv`)}
          >
            Export CSV
          </AuthButton>
        </div>
      </div>

      <p className="text-sm text-charcoal/70">
        Showing {visible.length} of {students.length} learner{students.length === 1 ? "" : "s"}
      </p>

      <div className="surface-earthy mt-3 overflow-x-auto rounded-lg">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-brown/20 text-charcoal/80">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Name</th>
              <SortHeader label="Enrolled on" sortKey="enrolledAt" sort={sort} onSort={handleSort} />
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <SortHeader label="Progress" sortKey="progress" sort={sort} onSort={handleSort} />
              <th scope="col" className="px-3 py-2 font-medium">Current lesson</th>
              <SortHeader label="Last active" sortKey="lastActive" sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {visible.map((student) => (
              <tr key={student.userId} className="border-b border-brown/10 last:border-0">
                <td className="px-3 py-2 font-medium text-charcoal">{student.name}</td>
                <td className="px-3 py-2 text-charcoal/80">{formatDate(student.enrolledAt)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-20 overflow-hidden rounded-full bg-brown/15"
                      role="progressbar"
                      aria-valuenow={student.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${student.name} progress`}
                    >
                      <div className="h-full rounded-full bg-gold" style={{ width: `${student.progressPercent}%` }} />
                    </div>
                    <span className="text-charcoal/80">
                      {student.progressPercent}% · {student.completedLessons}/{totalLessons}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-charcoal/80">{student.currentLessonTitle ?? "Not started"}</td>
                <td className="px-3 py-2 text-charcoal/80">{formatRelative(student.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 ? <p className="mt-3 text-sm text-charcoal/80">No learners match that name.</p> : null}
    </div>
  );
}

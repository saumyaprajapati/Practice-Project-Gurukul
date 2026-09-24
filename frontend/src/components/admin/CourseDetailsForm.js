"use client";

import { useState } from "react";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";
import AuthError from "@/components/auth/AuthError";
import { updateCourse } from "@/lib/admin/courses";

const FIELD_CLASS = "w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none";

// Edits every course field except its id (the URL slug). Picking a new
// owner pre-fills the instructor label with their name (still editable).
export default function CourseDetailsForm({ course, users, onSaved }) {
  const [form, setForm] = useState({
    title: course.title,
    description: course.description,
    category: course.category,
    instructor: course.instructor,
    price: String(course.price),
    status: course.status,
    ownerId: course.ownerId ?? "",
    thumbnail: course.thumbnail ?? "",
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function set(field, value) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOwnerChange(ownerId) {
    const owner = users.find((user) => user.id === ownerId);
    setSaved(false);
    setForm((prev) => ({ ...prev, ownerId, instructor: owner ? owner.name : prev.instructor }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }

    setIsSaving(true);
    try {
      await updateCourse(course.id, { ...form, price });
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="surface-earthy rounded-lg p-4">
      <AuthInput id="title" name="title" label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      <div className="mb-4">
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={FIELD_CLASS}
        />
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <AuthInput id="category" name="category" label="Category" value={form.category} onChange={(e) => set("category", e.target.value)} required />
        <AuthInput
          id="price"
          name="price"
          label="Price (₹)"
          type="number"
          inputMode="numeric"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          required
        />
        <div className="mb-4">
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select id="status" value={form.status} onChange={(e) => set("status", e.target.value)} className={FIELD_CLASS}>
            <option value="pending">Pending</option>
            <option value="approved">Approved (in the catalogue)</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="owner" className="mb-1 block text-sm font-medium">
            Owner
          </label>
          <select id="owner" value={form.ownerId} onChange={(e) => handleOwnerChange(e.target.value)} className={FIELD_CLASS}>
            <option value="">No owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <AuthInput
          id="instructor"
          name="instructor"
          label="Instructor (shown on the course)"
          value={form.instructor}
          onChange={(e) => set("instructor", e.target.value)}
          required
        />
        <AuthInput
          id="thumbnail"
          name="thumbnail"
          label="Thumbnail URL (optional)"
          value={form.thumbnail}
          onChange={(e) => set("thumbnail", e.target.value)}
        />
      </div>

      <AuthError message={error} />
      <div className="flex items-center gap-4">
        <AuthButton type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Details"}
        </AuthButton>
        {saved ? (
          <span role="status" className="text-sm text-charcoal/80">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  );
}

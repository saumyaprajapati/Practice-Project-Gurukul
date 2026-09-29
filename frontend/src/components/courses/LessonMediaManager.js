"use client";

import { useState } from "react";
import AuthError from "@/components/auth/AuthError";
import ConfirmButton from "@/components/admin/ConfirmButton";
import LessonVideoPlayer from "@/components/gurukul/course-detail/LessonVideoPlayer";
import {
  MAX_UPLOAD_BYTES,
  FILE_ACCEPT,
  VIDEO_ACCEPT,
  formatBytes,
  uploadLessonFile,
  addVideoLink,
  removeLessonMedia,
} from "@/lib/courses/media";

const FIELD_CLASS = "rounded border border-brown/40 bg-cream px-3 py-2 text-sm text-charcoal";
const LINK_BUTTON = "text-sm font-medium underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50";

// Video + files for one lesson, for the course owner (add-content page) and
// admins (curriculum editor). `lesson` is a getCourseCurriculum() lesson —
// its `id` is the lesson key. onChanged() reloads the curriculum.
export default function LessonMediaManager({ courseId, lesson, onChanged }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const busy = Boolean(status);

  async function run(label, action) {
    setStatus(label);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus(null);
      await onChanged();
    }
  }

  function handleVideoFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    run(`Uploading ${file.name}…`, () => uploadLessonFile(courseId, lesson.id, file, "video"));
  }

  function handleAddLink(event) {
    event.preventDefault();
    run("Adding link…", async () => {
      await addVideoLink(courseId, lesson.id, linkUrl);
      setLinkUrl("");
    });
  }

  function handleFiles(event) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    run("Uploading…", async () => {
      const failures = [];
      for (const [index, file] of picked.entries()) {
        setStatus(`Uploading ${index + 1} of ${picked.length}: ${file.name}…`);
        try {
          await uploadLessonFile(courseId, lesson.id, file, "file");
        } catch (err) {
          failures.push(err.message);
        }
      }
      if (failures.length) throw new Error(failures.join(" "));
    });
  }

  const video = lesson.video;
  const inputId = `media-${lesson.id}`;

  return (
    <div className="mt-2 space-y-5 rounded border border-brown/20 bg-cream/60 p-3">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-charcoal">Video</h4>
        {video ? (
          <>
            <div className="max-w-xl">
              <LessonVideoPlayer key={video.id} video={video} title={lesson.title} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-charcoal/70">
                {video.kind === "video_link" ? video.url : `${video.fileName} · ${formatBytes(video.sizeBytes)}`}
              </span>
              <ConfirmButton
                disabled={busy}
                confirmLabel="Remove video"
                onConfirm={() => run("Removing video…", () => removeLessonMedia(video.id))}
              >
                Remove / replace
              </ConfirmButton>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor={`${inputId}-video`} className="mb-1 block text-sm">
                Upload a video (MP4 or WebM, up to {formatBytes(MAX_UPLOAD_BYTES)})
              </label>
              <input
                id={`${inputId}-video`}
                type="file"
                accept={VIDEO_ACCEPT}
                disabled={busy}
                onChange={handleVideoFile}
                className="text-sm"
              />
            </div>
            <form onSubmit={handleAddLink} className="flex flex-wrap items-end gap-3">
              <div className="min-w-64 flex-1">
                <label htmlFor={`${inputId}-link`} className="mb-1 block text-sm">
                  …or paste a YouTube / Vimeo link (for longer videos; set them to Unlisted)
                </label>
                <input
                  id={`${inputId}-link`}
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`${FIELD_CLASS} w-full`}
                />
              </div>
              <button type="submit" disabled={busy || !linkUrl.trim()} className={LINK_BUTTON}>
                Add link
              </button>
            </form>
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-charcoal">Files</h4>
        {lesson.files?.length ? (
          <ul className="mb-3 space-y-1">
            {lesson.files.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="truncate text-charcoal">
                  {file.fileName} <span className="text-charcoal/50">· {formatBytes(file.sizeBytes)}</span>
                </span>
                <ConfirmButton
                  disabled={busy}
                  confirmLabel="Remove file"
                  onConfirm={() => run(`Removing ${file.fileName}…`, () => removeLessonMedia(file.id))}
                >
                  Remove
                </ConfirmButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-sm text-charcoal/60">No files yet.</p>
        )}
        <label htmlFor={`${inputId}-files`} className="mb-1 block text-sm">
          Add files (PDF, slides, docs, spreadsheets, images, zip — up to {formatBytes(MAX_UPLOAD_BYTES)} each)
        </label>
        <input
          id={`${inputId}-files`}
          type="file"
          multiple
          accept={FILE_ACCEPT}
          disabled={busy}
          onChange={handleFiles}
          className="text-sm"
        />
      </div>

      {status ? (
        <p role="status" aria-live="polite" className="text-sm text-charcoal/80">
          {status}
        </p>
      ) : null}
      <AuthError message={error} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getSignedMediaUrl, toEmbedUrl } from "@/lib/courses/media";

// Real lesson video: an uploaded MP4/WebM streamed from the private
// lesson-media bucket through a short-lived signed URL, or an embedded
// YouTube/Vimeo link. Renders nothing when the lesson has no video.
// Callers key this by lesson so each lesson starts in its loading state.
export default function LessonVideoPlayer({ video, title }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(null);
  const isUpload = video?.kind === "video";

  useEffect(() => {
    if (!isUpload) return undefined;
    let cancelled = false;
    getSignedMediaUrl(video.path)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError("This video couldn't be loaded. Try reloading the page.");
      });
    return () => {
      cancelled = true;
    };
  }, [isUpload, video?.path]);

  if (!video) return null;

  if (video.kind === "video_link") {
    const embedUrl = toEmbedUrl(video.url);
    if (!embedUrl) return null;
    return (
      <div className="mb-6 overflow-hidden rounded-lg bg-charcoal">
        <iframe
          src={embedUrl}
          title={title ? `Video: ${title}` : "Lesson video"}
          className="aspect-video w-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-lg bg-charcoal">
      {error ? (
        <p className="flex aspect-video items-center justify-center px-6 text-center text-sm text-cream/80">{error}</p>
      ) : src ? (
        <video
          src={src}
          controls
          preload="metadata"
          playsInline
          controlsList="nodownload"
          className="aspect-video w-full bg-charcoal"
          aria-label={title ? `Video: ${title}` : "Lesson video"}
        >
          Your browser can&apos;t play this video.
        </video>
      ) : (
        <p className="flex aspect-video items-center justify-center text-sm text-cream/70">Loading video…</p>
      )}
    </div>
  );
}

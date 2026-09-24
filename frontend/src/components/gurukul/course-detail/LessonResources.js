"use client";

import { useEffect, useState } from "react";
import { formatBytes, getSignedMediaUrls, toDownloadUrl } from "@/lib/courses/media";

// PDFs, images and text open in a new tab; everything else downloads.
const OPENABLE_TYPES = ["application/pdf", "text/plain", "text/csv", "image/png", "image/jpeg", "image/webp", "image/gif"];

function extensionLabel(fileName) {
  const extension = fileName.split(".").pop();
  return extension && extension !== fileName ? extension.toUpperCase() : "FILE";
}

// The lesson's attached files, with signed links prepared up front. Renders
// nothing when the lesson has no files. Callers key this by lesson.
export default function LessonResources({ files }) {
  const [urls, setUrls] = useState(null);
  const [error, setError] = useState(null);
  const pathsKey = files.map((file) => file.path).join("|");

  useEffect(() => {
    if (!pathsKey) return undefined;
    let cancelled = false;
    getSignedMediaUrls(pathsKey.split("|"))
      .then((map) => {
        if (!cancelled) setUrls(map);
      })
      .catch(() => {
        if (!cancelled) setError("These files couldn't be loaded. Try reloading the page.");
      });
    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  if (files.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-charcoal">Resources</h3>
      {error ? <p className="mt-2 text-sm text-ochre">{error}</p> : null}
      <ul className="mt-2 space-y-2">
        {files.map((file) => {
          const url = urls?.[file.path];
          return (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-brown/20 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="rounded bg-gold/20 px-1.5 py-0.5 text-xs font-medium text-charcoal">
                  {extensionLabel(file.fileName)}
                </span>
                <span className="truncate text-charcoal">{file.fileName}</span>
                {file.sizeBytes ? <span className="shrink-0 text-charcoal/50">{formatBytes(file.sizeBytes)}</span> : null}
              </span>
              <span className="flex shrink-0 gap-4">
                {url && OPENABLE_TYPES.includes(file.mimeType) ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    Open
                  </a>
                ) : null}
                {url ? (
                  <a href={toDownloadUrl(url, file.fileName)} className="font-medium underline underline-offset-4">
                    Download
                  </a>
                ) : (
                  <span className="text-charcoal/50">{error ? "Unavailable" : "Preparing…"}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

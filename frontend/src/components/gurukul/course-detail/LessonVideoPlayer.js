"use client";

import { useEffect, useRef, useState } from "react";

// Simulated playback only — there's no real video/media backend. Pressing
// Play ticks progressPercent from 0-100 over a real ~12 seconds, but the
// displayed clock maps that onto the lesson's actual stated duration, so
// it reads like a real lesson counting up. Reaching 100% just shows a
// "Watched" state on the player itself — it never touches Mark Complete,
// which stays a separate, explicit action.
const SIMULATED_DURATION_MS = 12000;
const TICK_MS = 100;
const INCREMENT_PER_TICK = 100 / (SIMULATED_DURATION_MS / TICK_MS);

function formatClock(totalMinutes) {
  const totalSeconds = Math.round(totalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function PlayIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}

export default function LessonVideoPlayer({ lesson }) {
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function startPlayback() {
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        const next = Math.min(100, prev + INCREMENT_PER_TICK);
        if (next >= 100) {
          clearInterval(intervalRef.current);
          setIsPlaying(false);
        }
        return next;
      });
    }, TICK_MS);
  }

  function pausePlayback() {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
  }

  function handleToggle() {
    if (isPlaying) pausePlayback();
    else startPlayback();
  }

  const isWatched = progressPercent >= 100;
  const currentClock = formatClock((lesson.durationMinutes * progressPercent) / 100);
  const totalClock = formatClock(lesson.durationMinutes);

  return (
    <div className="mb-6 overflow-hidden rounded-lg bg-charcoal">
      <div className="relative flex aspect-video items-center justify-center">
        {isWatched ? (
          <span className="rounded-full bg-gold/90 px-4 py-1 text-sm font-medium text-charcoal">Watched</span>
        ) : (
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-charcoal transition-transform hover:scale-105"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
        )}
        <p className="absolute bottom-3 left-4 right-4 truncate text-sm text-cream/70">{lesson.lessonTitle}</p>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isWatched}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="shrink-0 text-cream disabled:opacity-40"
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/20">
          <div
            className="h-full rounded-full bg-gold transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-cream/70">
          {currentClock} / {totalClock}
        </span>
      </div>
    </div>
  );
}

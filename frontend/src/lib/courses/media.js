// Lesson media — real videos and files in the private "lesson-media" Storage
// bucket, registered in course_lesson_media (supabase/phase7-lesson-media.sql).
// Uploads are allowed for the course owner and admins; learners read media
// through short-lived signed URLs, which Storage only issues for lessons they
// may read. YouTube/Vimeo links are stored as-is and embedded.
import { getSupabase } from "@/lib/supabase/client";
import { ApiError, toApiError, unwrap } from "@/lib/supabase/errors";

export const MEDIA_BUCKET = "lesson-media";

// Supabase free plan: 50 MB per file (the bucket enforces the same limit).
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const SIGNED_URL_SECONDS = 60 * 60;

export const VIDEO_TYPES = ["video/mp4", "video/webm"];

// Extension -> content type, also used when the browser reports no type.
const FILE_TYPES_BY_EXTENSION = {
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  mp4: "video/mp4",
  webm: "video/webm",
};

export const FILE_ACCEPT = ".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx";
export const VIDEO_ACCEPT = "video/mp4,video/webm,.mp4,.webm";

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contentTypeFor(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type === "application/x-zip-compressed") return "application/zip";
  return FILE_TYPES_BY_EXTENSION[extension] ?? file.type ?? "";
}

// Keeps object keys to safe characters while staying readable.
function safeFileName(name) {
  const cleaned = name.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return cleaned.slice(-100) || "file";
}

function validateUpload(file, kind) {
  const contentType = contentTypeFor(file);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      `"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.${
        kind === "video" ? " For longer videos, paste a YouTube or Vimeo link instead." : ""
      }`,
      400
    );
  }
  if (kind === "video" && !VIDEO_TYPES.includes(contentType)) {
    throw new ApiError("Videos must be MP4 or WebM files.", 400);
  }
  if (kind === "file" && (!Object.values(FILE_TYPES_BY_EXTENSION).includes(contentType) || VIDEO_TYPES.includes(contentType))) {
    throw new ApiError(`"${file.name}" isn't a supported file type (PDF, images, text, zip, Word/PowerPoint/Excel).`, 400);
  }
  return contentType;
}

// kind: "video" | "file". Uploads to {courseId}/{lessonKey}/{uuid}-{name},
// then registers the row; removes the upload again if registration fails.
export async function uploadLessonFile(courseId, lessonKey, file, kind) {
  const contentType = validateUpload(file, kind);
  const supabase = getSupabase();
  const path = `${courseId}/${lessonKey}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType, upsert: false, cacheControl: "3600" });
  if (uploadError) throw new ApiError(uploadError.message || "Upload failed.", uploadError.statusCode ?? 500);

  const { data, error } = await supabase.rpc("add_lesson_media", {
    p_course_id: courseId,
    p_lesson_key: lessonKey,
    p_kind: kind,
    p_storage_path: path,
    p_file_name: file.name,
    p_mime_type: contentType,
    p_size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw toApiError(error);
  }
  return data;
}

export async function addVideoLink(courseId, lessonKey, url) {
  if (!toEmbedUrl(url)) throw new ApiError("Paste a YouTube or Vimeo video link (https://...).", 400);
  return unwrap(
    await getSupabase().rpc("add_lesson_media", {
      p_course_id: courseId,
      p_lesson_key: lessonKey,
      p_kind: "video_link",
      p_external_url: url.trim(),
    })
  );
}

export async function removeLessonMedia(mediaId) {
  const supabase = getSupabase();
  const path = unwrap(await supabase.rpc("remove_lesson_media", { p_media_id: mediaId }));
  if (path) await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

// Paths of every file under a course / module / lesson, fetched BEFORE the
// database delete (afterwards the rows are gone).
export async function getMediaPaths({ courseId, moduleId = null, lessonKey = null }) {
  return unwrap(
    await getSupabase().rpc("lesson_media_paths", {
      p_course_id: courseId,
      p_module_id: moduleId,
      p_lesson_key: lessonKey,
    })
  );
}

// Best-effort bucket cleanup after the rows were deleted.
export async function removeMediaFiles(paths) {
  if (!paths?.length) return;
  await getSupabase().storage.from(MEDIA_BUCKET).remove(paths);
}

export async function getSignedMediaUrl(path) {
  const { data, error } = await getSupabase().storage.from(MEDIA_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw new ApiError(error.message || "Couldn't load this file.", error.statusCode ?? 500);
  return data.signedUrl;
}

// One request for many files -> { [path]: signedUrl }. Links are prepared up
// front so "Open" can be a plain link (a window.open after an await would be
// blocked as a pop-up).
export async function getSignedMediaUrls(paths) {
  if (!paths.length) return {};
  const { data, error } = await getSupabase().storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw new ApiError(error.message || "Couldn't load these files.", error.statusCode ?? 500);
  return Object.fromEntries(data.filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
}

// Storage serves a signed URL as a download when ?download=<name> is added.
export function toDownloadUrl(signedUrl, fileName) {
  const url = new URL(signedUrl);
  url.searchParams.set("download", fileName);
  return url.toString();
}

// YouTube (watch, youtu.be, shorts, embed) and Vimeo links -> privacy-friendly
// embed URL, or null if the link isn't recognised.
export function toEmbedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.replace(/^(www|m)\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    let id = null;
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
    else {
      const match = parsed.pathname.match(/^\/(shorts|embed|live)\/([\w-]+)/);
      id = match?.[2] ?? null;
    }
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = parsed.pathname.match(/(\d{6,})/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return null;
}

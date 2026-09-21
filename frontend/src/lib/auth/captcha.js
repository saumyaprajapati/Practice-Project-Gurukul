// Lightweight frontend CAPTCHA-style challenge: a short string of
// characters rendered as a distorted image via the Canvas API. This is a
// UX deterrent only, NOT a security-grade CAPTCHA. Isolated behind these
// functions — and kept free of any React dependency — so a production
// provider can replace the implementation later without touching how the
// Login screen consumes a challenge.

// Excludes visually ambiguous characters (0/O, 1/I/l).
const CHALLENGE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const CHALLENGE_LENGTH = 5;

export function generateChallenge() {
  let text = "";
  for (let i = 0; i < CHALLENGE_LENGTH; i += 1) {
    text += CHALLENGE_CHARS[Math.floor(Math.random() * CHALLENGE_CHARS.length)];
  }
  // No real email/verification-grade secrecy is at stake here — surfaced
  // to developers only, so the flow is testable without reading pixels.
  console.info(`[auth/captcha] challenge text: ${text}`);
  return { text };
}

export function isCorrectAnswer(challenge, candidate) {
  // Case-sensitive by default, per the AUTH-03 contract.
  return typeof candidate === "string" && candidate === challenge?.text;
}

export function drawChallengeImage(canvas, text) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#f4ecda"; // cream
  ctx.fillRect(0, 0, width, height);

  // Noise lines for basic visual obfuscation — not a security control.
  const lineColors = ["#6e4a34", "#3a5470"]; // brown, lapis
  for (let i = 0; i < 3; i += 1) {
    ctx.strokeStyle = lineColors[i % lineColors.length];
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * height);
    ctx.lineTo(width, Math.random() * height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const textColors = ["#1b1512", "#6e4a34"]; // charcoal, brown
  const charWidth = width / text.length;
  ctx.font = "bold 28px sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  for (let i = 0; i < text.length; i += 1) {
    const x = charWidth * i + charWidth / 2;
    const y = height / 2 + (Math.random() * 10 - 5);
    const rotation = (Math.random() * 30 - 15) * (Math.PI / 180);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = textColors[i % textColors.length];
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
}

// Single source of truth for the six Gurukul mentors.
// Add a mentor by appending an object here — MentorCard.js and
// PlatformNoticesYou.js both read from this array/helper and never
// hardcode mentor copy themselves.
//
// Dialogue lines are original, written for this product. They are NOT
// historical quotations and must never be presented as such.

export const MENTORS = [
  {
    id: "arjuna",
    name: "Arjuna",
    trigger: "When you begin.",
    purpose:
      "Greets a learner the moment they enrol, framing focus as a discipline they're choosing.",
    dialogue: "Focus is a discipline, not a mood. Let's begin.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
  {
    id: "karna",
    name: "Karna",
    trigger: "When you fail and try again.",
    purpose:
      "Responds to a failed quiz attempt, reframing failure as expected and survivable.",
    dialogue: "A setback is not a verdict. Try again — I did.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
  {
    id: "babur",
    name: "Babur",
    trigger: "When you go quiet.",
    purpose: "Appears after a stretch of inactivity, without shame or pressure.",
    dialogue: "Even an empire pauses. It doesn't have to end here.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
  {
    id: "chanakya",
    name: "Chanakya",
    trigger: "When you're choosing your path.",
    purpose:
      "Surfaces during course/track selection to encourage deliberate, strategic planning over impulsive choice.",
    dialogue:
      "A path chosen with foresight rarely needs a detour. Choose carefully, then commit.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
  {
    id: "gargi",
    name: "Gargi",
    trigger: "When you're tested.",
    purpose:
      "Appears during a demanding assessment, framing difficulty as evidence real understanding is being built, not a punishment.",
    dialogue:
      "A hard question isn't punishment — it's where understanding is proven. Show me how you think.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
  {
    id: "ekalavya",
    name: "Ekalavya",
    trigger: "When you return.",
    purpose: "Welcomes a learner back, treating the return itself as the achievement.",
    dialogue: "You came back. That's the only skill that matters.",
    languages: ["en"],
    artwork: null,
    animation: null,
  },
];

export function getMentor(id) {
  const mentor = MENTORS.find((m) => m.id === id);
  if (!mentor) {
    throw new Error(`Unknown mentor id: "${id}"`);
  }
  return mentor;
}

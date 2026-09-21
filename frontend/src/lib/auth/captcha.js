// Lightweight arithmetic challenge standing in for real CAPTCHA
// infrastructure. Isolated so a production-grade provider can replace it
// later without changing how the Login screen consumes a challenge.
export function generateChallenge() {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  return {
    question: `${a} + ${b}`,
    answer: String(a + b),
  };
}

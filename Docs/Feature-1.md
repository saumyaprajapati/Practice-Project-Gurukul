### 2.1 Hero: the curtain sequence (your idea, refined)

Your instinct was right. Refinements: make it an **opening scene, not a loading screen**, and make it skippable and skipped-forever.

**Sequence (2.8s total, then interactive):**

```
0.0s  Black. A single oil-lamp flame (SVG, 8 paths, CSS-only) at centre.
0.4s  Devanagari text draws itself beside the flame via stroke-dashoffset:
      तमसो मा ज्योतिर्गमय
      Latin translation fades under it at 40% opacity.
1.2s  Two patachitra-patterned curtains (SVG, block-print border) part
      horizontally. transform: translateX() only. GPU-composited.
1.4s  Behind them: the Nalanda silhouette in five parallax layers —
      far hills, stupa, main vihara, courtyard wall, foreground figures.
1.6s  Sun rises behind the stupa. A single <circle> with a radial gradient
      moving on translateY, plus a light-shaft <polygon> widening.
2.0s  Foreground figures resolve: two silhouettes with bow and spear,
      dawn-lit rim light only. Not detailed portraits — silhouettes age
      better, cost 1/20th the file size, and dodge the caricature problem.
2.4s  Headline hangs below a shirorekha that draws left-to-right:
      "Everything worth learning was once taught under a tree."
2.6s  Gold CTA fades up. Scroll cue pulses once.
```
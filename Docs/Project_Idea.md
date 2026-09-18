# Gurukul

**An online learning platform built on the one thing online learning lost: a teacher who notices you.**

---

## The problem

Online courses have a completion problem. Across the industry, most people who enrol in an online course never finish it — completion rates are widely reported in the single digits to low double digits. The content isn't the issue. Most of these courses are good, made by people who know their subject, often better than what you'd get in a lecture hall.

What's missing is everything around the content.

In a classroom, when you stop turning up, someone notices. When you fail a test, someone tells you it isn't over. When you're three weeks behind, someone asks what happened. None of that is instruction. All of it is why people finish.

Online platforms replaced it with an automated email that says *"You haven't logged in for a while!"* and a progress bar. That doesn't work, and the numbers say so.

## The idea

For most of Indian history, education happened in a **gurukul** — a small residential school where students lived with their teacher. What made it work wasn't the curriculum. It was that the teacher knew every student personally: their strengths, where they were stuck, when they'd stopped trying, and exactly what to say to each one.

That doesn't scale. But the *behaviour* does, if you build it deliberately instead of hoping a notification does the job.

**Gurukul is a course platform where the system notices you** — and when it does, it speaks in the voice of someone who earned the right to say it.

## What that means in practice

Enrol in a course and **Arjuna** appears:

> *"I was asked what I could see. Only the eye of the bird. Keep your aim that narrow and the path shows itself."*

Fail a quiz and try again, and **Karna** shows up — the outsider who was refused at every door and got good anyway.

Disappear for a week with a course half-finished, and **Babur** turns up. Not to scold you. To challenge you:

> *"I crossed the Hindu Kush in winter with an army that had every reason to turn back. You have eleven lessons left. Which of us has the harder road?"*

Ten figures from Indian history, each mapped to a moment where a learner needs something specific. Chanakya when you've enrolled in four courses and finished none. Gargi when you ask your first question. Ekalavya — who taught himself — when you come back after a long absence.

**Every character is a challenger or a mentor. None is a villain.** That's a deliberate design rule, and it's in the specs. Shame-based nudges reliably increase churn, and casting historical figures as heroes or villains along religious lines is both bad product and bad business.

The lines appear in the learner's own language — Hindi, Gujarati, Marathi, Tamil, Bengali or English — curated by hand, never machine-translated, because these quotations carry weight that a translation API will flatten.

## The design idea

Everything visual hangs off one line:

> **तमसो मा ज्योतिर्गमय** — *lead me from darkness to light.*

The product enacts it literally:

- The landing page opens in darkness — a single oil lamp in an Ajanta-cave palette of red ochre, lamp black and turmeric gold.
- Learning surfaces are light: a palm-leaf manuscript ground. **Reaching them is the reward.**
- Progress is illumination. Streaks are diyas lighting one by one along a wall. Finishing a course lights the shala.

The visual language is drawn from real sources, not from clip art. The palette comes from the actual pigments of the Ajanta murals. Course thumbnails are clipped to the **chaitya arch** — the pointed horseshoe of the cave facades — which means *a window into a course*. Every section header hangs beneath a horizontal gold rule, borrowed from the **shirorekha**, the headline stroke Devanagari letters hang from.

No mandalas. No saffron gradients. No clip-art lotuses.

Typography is **Anek**, a variable typeface family from Ek Type in Bengaluru with matched designs across Latin and nine Indian scripts — so the brand holds together whether you're reading in English or Tamil. A second face, **Tiro Devanagari Sanskrit**, is used for exactly one thing: when a historical character speaks. Because it appears nowhere else, you learn what it means.

## The user journey

```
land on a dark page, a lamp lights, curtains part on Nalanda
   ↓
browse courses — arch-cropped cards, free preview lessons
   ↓
enrol — Arjuna appears in your language, then the first lesson
   ↓
watch — adaptive video, progress saved, resume anywhere
   ↓
quiz — pass and move on, fail and Karna has something to say
   ↓
fall behind — someone notices, and it isn't a form email
   ↓
finish — a scroll unfurls, a lapis seal presses in
   ↓
a certificate page built to be pasted into LinkedIn
```

## Why it might actually work

Three bets, stated plainly so they can be proved wrong:

1. **Intervention beats notification.** A character who appears at a designed moment with a line written for that moment outperforms a generic re-engagement email. Every encounter is logged with what the learner did next, so this gets measured, not assumed.

2. **Cultural specificity is a feature, not decoration.** A platform that looks and speaks like it was made for Indian learners, in their languages, is more compelling than a localised version of something built elsewhere.

3. **Performance is a growth strategy in India.** Most learners arrive on a sub-₹15,000 Android phone over patchy 4G. A site that loads in under 2.5 seconds there will beat a prettier one that doesn't. Which is why the animation is rich *and* the build fails if the landing page ships more than 90KB of JavaScript.

## How it's built

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind | Server Components keep the bundle small; App Router handles ten locales |
| Backend | Express 5 + TypeScript | Layered: route → controller → service → repository |
| Database | PostgreSQL 16 + Drizzle | Full-text search, JSONB and relational integrity in one box. No Elasticsearch |
| Jobs | BullMQ + Redis | Video transcoding, progress flushing, the nightly trigger sweep |
| Video | HLS on Cloudflare R2 | Zero egress fees — the single biggest cost decision in video ed-tech |
| Animation | GSAP, Rive, CSS | Rive state machines drive the characters; ~40KB per character, GPU rendered |
| Payments | Razorpay | UPI, cards, netbanking |

**One schema, three uses.** Every request and response shape is a Zod schema in `packages/contracts`. That single definition is the Express validator, the React form validator, and the TypeScript type on both sides. Change a password's minimum length in one place and everything follows.

### Two engineering decisions worth calling out

**Progress writes are buffered.** A naive video player writes a database row every few seconds. At a thousand concurrent learners that's your first outage. Instead the client beacons every 15 seconds into a Redis hash, and a job bulk-upserts to Postgres every 60. Worst case a learner loses a minute of position; write load drops by roughly 60×.

**Animation is tiered, not optional.** A script measures device memory, CPU cores and connection quality before first paint, sets a tier on `<html>`, then watches actual frame times and downgrades if the device struggles. Full tier gets the Rive character. Lite tier gets a one-line banner with the same words. The words carry the product; the animation is garnish.

*Gurukul — learn the way the best learners always have: with a teacher who notices.*
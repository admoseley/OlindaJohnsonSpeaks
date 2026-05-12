# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project overview

Static one-page marketing site for **Dr. Olinda Johnson, PhD, RNC, CNS, APN** — a nurse educator who delivers CEU-qualifying trainings for hospitals, universities, and professional nursing organizations.

- **Domain:** `OlindaJohnsonSpeaks.com`
- **Primary CTA everywhere:** "Request Training" (not "Book Dr. Johnson" — the audience searches for trainings)
- **Single deliverable:** `index.html` + sibling assets. No build step, no framework, no multi-page routing.

## Local preview

```bash
python3 -m http.server 8734
# then open http://localhost:8734
```

Port 8734 is configured in `.claude/launch.json`.

## File inventory

```
index.html                        ← the entire site
favicon.svg                       ← OJ monogram in lavender
dr-johnson-headshot.jpg           ← hero image (456×548 JPEG), referenced by relative path
o-johnson.jpg                     ← alternate headshot (not currently used in index.html)
Deploy/                           ← snapshot pushed to host; keep in sync with root index.html
DrOlindaJohnson/                  ← original client-provided assets (one sheet PDF/DOCX, compensation framework)
DrOlindaJohnson 2/                ← updated versions of same assets (prefer these)
CV OJOHNSON 2025.docx             ← full CV for bio/credentials reference
drjohnson.zip / DrOlindaJohnson.zip / files.zip  ← delivery archives; do not deploy
```

## Tech constraints — do not violate

- Plain HTML/CSS only. No React, Next.js, Tailwind, component libraries, or build pipelines.
- No JavaScript beyond the small inline helpers already in `index.html`.
- No analytics, tracking pixels, or cookie banner.
- Keep `index.html` and `dr-johnson-headshot.jpg` as siblings (relative path `src="dr-johnson-headshot.jpg"`).

## Design system

All tokens are CSS custom properties in `index.html`. Reuse them; do not add new colors, fonts, or spacing scales without a reason.

**Palette intent:**
- Lavender is an **accent**, not a wash. Cream and white dominate surfaces.
- Silver is **structural** (rules, borders, dividers) — never a fill.
- `--lavender-700` for primary buttons; `--lavender-500` for accents/tags; `--lavender-050` for `section--alt` backgrounds.

**Typography:**
- `Fraunces` (serif) — headings, stat numerals, section markers, pull quote, testimonials. Italic Fraunces for eyebrows and section markers. Do not replace with roman.
- `DM Sans` (sans) — body copy, buttons, nav, form fields, tags.

**Motion budget (complete — do not add to):** hero stagger-fade on load + topic card lift on hover.

## Page structure

Nine sections in order, all anchored in the single HTML file:

| Anchor | Section | Notes |
|---|---|---|
| _(none)_ | Nav | Sticky, blur backdrop, 4 anchor links + pill CTA |
| _(none)_ | Hero | Circular headshot with silver ring + dashed lavender outer ring |
| `#trusted` | Trusted by | Text strip only — no logos (permission issues) |
| `#about` | §01 About | Bio + credentials card + 3-stat row + pull quote |
| `#topics` | §02 Training Topics | 6 topics in 3 groups of 2 |
| `#engagements` | §03 Recent Engagements | 12 past appearances |
| `#testimonials` | §04 What Hosts Say | 3 testimonial cards |
| `#logistics` | §05 Logistics | Formats, CEU hours, travel, honorarium |
| `#booking` | §06 Request Training | Booking form |
| _(none)_ | Footer | Brand, nav, contact, copyright |

## The six training topics — must stay in sync between §02 and §06 dropdown

**Clinical OB Training**
1. Intermediate & Advanced Fetal Monitoring — AWHONN-credentialed
2. High-Risk Obstetrics & OB Emergencies

**Health Equity & Maternal Outcomes**
3. Implicit Bias & African American Maternal Health
4. Pregnancy Loss, Grief & Bereavement Care

**Nursing Excellence**
5. Vigilance, Civility & Leadership at the Bedside
6. Health & Humor: Stress, Burnout & Resilience

If a topic name changes, update **both** `index.html` locations.

## Positioning to preserve

Dr. Johnson's single strongest differentiator: **AWHONN Instructor Trainer for Intermediate and Advanced Fetal Monitoring since 1997.** Keep this prominent in the hero and in topic #1. Most AWHONN instructors are not instructor trainers — this is the credential nurse educators search for.

Other signals to surface consistently:
- 45+ years in perinatal and women's health nursing
- PhD from Texas Woman's University, 2009
- Clinical Educator at Houston Methodist
- Published in *JOGNN* (runner-up for 2016 Best of JOGNN Writing Award)

## Booking form backend (not yet wired)

The form currently calls `event.preventDefault()` and shows an alert. Before launch, pick one:

**Option A — Netlify Forms** (free if hosting on Netlify):
```html
<form class="form" name="booking" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="booking" />
```

**Option B — Formspree** (simplest otherwise):
```html
<form class="form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Remove the `onsubmit` handler when switching to a real backend. Add a success state (redirect or inline confirmation) — do not leave the user on a blank form after submit.

## Remaining placeholders — Dr. Johnson to provide

Grep `index.html` for `placeholder` (CSS class) or `[` to find any remaining gaps. Outstanding items:

1. CEU contact hours per topic (6 topics)
2. CEU approving body (AWHONN, TNA, ANCC, or other)
3. Travel policy (local/regional/national/virtual tiers)
4. Honorarium structure
5. Response-time commitment for booking inquiries
6. 3–5 testimonials with full name, title, org, and publish permission
7. Contact email (and optional phone) in the footer

Note: The domain is already hardcoded as `www.olindajohnsonspeaks.com` in the OG/Twitter meta tags — the apex-vs-www question is de facto answered.

When content arrives, find-and-replace the placeholder text and remove the `.placeholder` highlight class from that element.

## Decisions already made — do not re-litigate without a reason

- "Request Training" CTA (not "Book Dr. Johnson")
- Text-only "Trusted by" strip (no org logos — permission friction, slower launch)
- Fraunces + DM Sans type pairing — do not swap to Inter, Roboto, or similar
- Editorial layout with numbered section markers (deliberate — reflects PhD credentials)
- Circular headshot with silver ring + dashed lavender outer ring in the hero
- Houston, Texas in the footer
- Pull quote in §01 is paraphrased pending a direct quote from Dr. Johnson

## QA checklist before launch

- [ ] Lighthouse: accessibility, SEO, performance
- [ ] Tab through the form — every field has a visible focus ring and associated label
- [ ] WCAG AA color contrast on lavender-on-cream text
- [ ] Mobile layout at 375px (iPhone SE) and up
- [ ] All six topic names match between §02 cards and §06 dropdown
- [ ] `og-image.jpg` (1200×630) exists at the root — currently referenced in OG tags but not yet created
- [ ] Form backend wired and success state working
- [ ] `Deploy/` folder in sync with root `index.html` before pushing to host

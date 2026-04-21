# OlindaJohnsonSpeaks.com — Project Instructions

This file is the handoff from an earlier planning and prototyping conversation.
It contains everything Claude Code needs to finish and deploy the site.

---

## 1. Project at a glance

- **Client:** Dr. Olinda Johnson, PhD, RNC, CNS, APN
- **Domain:** `OlindaJohnsonSpeaks.com`
- **Type:** Static one-page marketing site
- **Status:** First-draft HTML/CSS scaffold complete (`index.html`). Needs form backend, real content in placeholders, QA, and deployment.
- **Primary CTA:** "Request Training" — drives every CTA on the page to the booking form.

## 2. Who this site is for

The site targets **event and training coordinators who book nursing continuing
education**, specifically:

- County and private hospitals (staff development / nursing education departments)
- Universities and nursing schools
- Professional nursing organizations (AWHONN chapters, NBNA, Sigma Theta Tau, etc.)

These audiences book CEU-bearing trainings so their nurses stay current on
annual CEU requirements. **The site sells CEU-qualifying professional
education, not general public speaking.** Earlier drafts leaned toward a broad
speaker site — that direction is deprecated.

## 3. The positioning to preserve

Dr. Johnson's single strongest differentiator for this audience is that she is
an **AWHONN Instructor Trainer for both Intermediate and Advanced Fetal
Monitoring since 1997**. That credential is rare — most AWHONN instructors are
not instructor trainers — and it is exactly what nurse educators search for
when booking fetal monitoring courses. Keep this credential prominent in the
hero and in topic #1.

Her other strong signals, to surface consistently:

- 45+ years in perinatal and women's health nursing
- PhD from Texas Woman's University, 2009
- Clinical Educator at Houston Methodist
- Published in *JOGNN* (runner-up for 2016 Best of JOGNN Writing Award)
- Published work on implicit bias in healthcare for African American women
- Four lanes of credibility: AWHONN/professional nursing, AHA/Go Red,
  academic (TWU), and faith/community (NMBCA, NBNA)

## 4. Tech stack and constraints

- **Plain static HTML/CSS** — no framework, no build step, no JavaScript
  beyond the tiny inline helpers already in `index.html`.
- **Single HTML file** plus the headshot as a sibling asset. The site is a
  one-pager; there is no multi-page routing.
- **Fonts:** Google Fonts — Fraunces (display serif) + DM Sans (body sans).
  Already linked in the `<head>`.
- **No analytics, no tracking pixels, no cookie banner** — the site does not
  need consent machinery because it sets no cookies.
- **Target deploy:** any static host. Good options: Netlify, Cloudflare Pages,
  GitHub Pages, Vercel. Pick whichever has the simplest form-handler path
  (see §8).
- **Accessibility baseline:** semantic HTML already in place. Keep it.
  Alt text on images, labeled form fields, sufficient color contrast.

Do not introduce React, Next.js, Tailwind, a component library, a CSS
framework, or a build pipeline. If a future need pushes in that direction,
flag it and wait for confirmation — the client wants a static page.

## 5. Design system (already in `index.html`)

All tokens are defined as CSS custom properties at the top of the stylesheet.
Reuse them — do not introduce new colors, new fonts, or a new spacing scale
without a reason.

### Palette

```
--lavender-900: #2B2140   /* deep ink / footer background */
--lavender-700: #4A3E70   /* primary buttons, strong accents */
--lavender-500: #6D5E95   /* standard lavender accents, tags */
--lavender-300: #A89BC7   /* soft decorative accents */
--lavender-100: #EDE7F6   /* tag backgrounds, focus ring */
--lavender-050: #F7F4FB   /* alternating section backgrounds */

--silver-500: #9DA2AE     /* footer bottom text */
--silver-400: #B8BCC8     /* rules, borders in hero */
--silver-200: #D6D9E0     /* standard card borders */
--silver-100: #E5E7EC     /* light dividers */

--ink:   #221E2E          /* headings */
--body:  #3E3A4A          /* body text */
--muted: #6B6878          /* secondary text */

--cream: #FDFCFF          /* page background */
--white: #FFFFFF          /* card backgrounds */
```

### Typography

- **Display serif:** Fraunces (variable, 300–700). Used for headings,
  the hero name, stat numerals, section markers, the pull quote, and the
  testimonial body. Italic Fraunces is used for eyebrows and section
  markers to carry the editorial feel — do not replace with roman.
- **Body sans:** DM Sans (400–700). Used for body copy, buttons, nav,
  form fields, tags.

### Design intent (so the look survives edits)

- **Editorial, not promotional.** Think academic journal redesigned for the
  web — numbered section markers (`01 · About`), thin silver hairlines,
  generous vertical rhythm, pull quote with a vertical rule.
- **Lavender is an accent, not a wash.** Dominant surfaces are cream and
  white. Lavender appears in headings, buttons, tags, and the alternating
  `section--alt` background. Resist the pull to lavender gradients or
  lavender-tinted bodies of text.
- **Silver is a structural color**, not a fill. It's for rules, borders,
  and dividers. Silver fills read as washed-out gray; avoid them.
- **Animation is minimal and front-loaded.** The hero stagger-fades in on
  load; topic cards lift on hover. That is the complete motion budget.
  Do not add scroll-triggered reveals, parallax, carousels, or modals.

## 6. Sitemap and content outline

A single long page, nine sections in order:

| # | Section | Purpose |
|---|---|---|
| — | **Nav** | Sticky, blurred background, brand + 4 anchor links + pill CTA |
| — | **Hero** | Name, credentials, tagline, 2 CTAs, circular headshot |
| 0 | **Trusted by** | Text strip of 9 orgs between hero and §01 |
| 01 | **About** | Narrative bio + credentials card + 3-stat row |
| 02 | **Training Topics** | 6 topics in 3 groups of 2 |
| 03 | **Recent Engagements** | 12 curated past appearances |
| 04 | **What Hosts Say** | 3 testimonial cards (placeholder) |
| 05 | **Logistics** | Formats, CEU hours, travel, honorarium |
| 06 | **Request Training** | Booking form |
| — | **Footer** | Brand, nav, contact, copyright |

### The six training topics (memorize these, they appear in 3 places)

Grouped for the audience's mental model of CEU categories:

**Clinical OB Training**
1. Intermediate & Advanced Fetal Monitoring — AWHONN-credentialed
2. High-Risk Obstetrics & OB Emergencies

**Health Equity & Maternal Outcomes**
3. Implicit Bias & African American Maternal Health
4. Pregnancy Loss, Grief & Bereavement Care

**Nursing Excellence**
5. Vigilance, Civility & Leadership at the Bedside
6. Health & Humor: Stress, Burnout & Resilience

These six appear in §02 as topic cards *and* in the §06 form's topic dropdown.
If one changes, update both places.

## 7. Placeholders — what Dr. Johnson still needs to provide

Every placeholder in `index.html` is wrapped in `<span class="placeholder">`
and contains literal text `[PLACEHOLDER: ...]`. Grep for `placeholder` or
`PLACEHOLDER` to find them all. The full list:

1. **CEU contact hours per program** — six topics, each tagged
   `CEU hours: [Dr. Johnson to confirm]`
2. **CEU approving body** — AWHONN, TNA, ANCC, or other — goes in the
   Logistics card
3. **Travel policy** — Houston-local only? Regional? National? Virtual-only
   tier? — Logistics card
4. **Honorarium structure** — flat, tiered by audience type, or
   "quote on request" — Logistics card
5. **Response-time commitment** — e.g. "within 3 business days" — in the
   booking intro copy
6. **3–5 testimonials** with full name, title, organization, and permission
   to publish — §04
7. **Contact email** — footer
8. **Optional contact phone** — footer

When she sends these over, a global find-and-replace on the `[PLACEHOLDER: ...]`
strings is the whole job. The highlighted styling (`.placeholder` class) can
be removed along with the text — it exists only to make incomplete spots
visible during the draft phase.

## 8. The booking form — backend integration

The form in §06 currently does `event.preventDefault()` and shows an alert.
It needs a real handler before launch. Three recommended paths:

### Option A — Formspree (simplest, paid after free tier)

```html
<form class="form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

Remove the inline `onsubmit` handler. Formspree emails each submission.

### Option B — Netlify Forms (free, requires Netlify hosting)

```html
<form class="form" name="booking" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="booking" />
  <!-- existing fields -->
</form>
```

### Option C — Basin (simple, free tier)

Same as Formspree — change the `action` URL.

**Pick one based on the chosen host.** If the host is Netlify, use Option B
for zero extra config. Otherwise Formspree or Basin are equivalent.

Whichever is chosen, add a real success state — redirect to a thank-you
anchor or swap the form for a confirmation message — rather than leaving
the user on a blank form after submit.

## 9. Current file inventory

```
/
├── CLAUDE.md                     ← this file
├── index.html                    ← the one-pager, complete scaffold
└── dr-johnson-headshot.jpg       ← hero image, 456×548 JPEG
```

`index.html` references the headshot with a relative path
(`src="dr-johnson-headshot.jpg"`). Keep them as siblings.

## 10. What to do next (ordered TODO)

1. **Local preview.** Open `index.html` in a browser and confirm fonts load,
   hero animation runs, mobile layout (≤ 600px) works, and no console
   errors appear.
2. **Form backend.** Pick a provider from §8 and wire the form. Add a
   success state.
3. **Favicon and meta.** The page has a `<title>` and `<meta name="description">`
   but no favicon, no Open Graph tags, no Twitter card. Add:
   - A favicon (derive a small mark from her initials in Fraunces, or use
     a simple lavender monogram).
   - OG tags with a 1200×630 preview image for when the link is shared.
   - Structured data (`Person` schema.org JSON-LD) to help search visibility
     for her name and credentials.
4. **Deploy.** Push to the chosen host, point `OlindaJohnsonSpeaks.com` at it,
   confirm HTTPS and the redirect from `www.` (or to `www.` — pick one).
5. **Content pass #1.** Fill placeholders from §7 as Dr. Johnson sends
   information. Remove the `.placeholder` highlight styling from any
   element that now has real content.
6. **Media kit.** Optional but recommended: a downloadable PDF with the
   three bio lengths, headshot, credentials, and topic list. Link from
   the footer or About section. A simple way is an HTML-to-PDF export
   that mirrors the site's typography.
7. **QA pass.**
   - Run through Lighthouse (accessibility, SEO, performance).
   - Tab through the form; confirm every field has a visible focus ring
     and a label.
   - Check color contrast on lavender-on-cream text (WCAG AA minimum).
   - View on iPhone SE width (375px) and up.
   - Confirm all six topic names match between §02 cards and §06 dropdown.

## 11. Decisions already made (do not re-litigate without reason)

Flag these if a reason to change comes up — but the default is to keep them:

- **"Request Training" as the primary CTA** instead of "Book Dr. Johnson."
  The target audience searches for trainings, not speakers.
- **Text-based "Trusted by" strip, not logos.** Logos would need
  permission-to-use from each org; text is cleaner on lavender/silver and
  launches faster.
- **Fraunces + DM Sans** as the type pairing. Fraunces gives academic
  gravitas; DM Sans keeps body copy fast to read. Do not swap to Inter,
  Roboto, Arial, or Space Grotesk — those choices would flatten the look.
- **Editorial structure with numbered section markers** rather than a
  typical speaker-site layout with big centered blocks. This is
  deliberate — it leans into her PhD credentials.
- **Circular headshot in the hero** with a silver ring and a dashed
  lavender outer ring. Do not switch to a full-bleed hero image or a
  rectangular portrait without a good reason.
- **Houston, Texas** as the location in the footer. She is Houston-based.
- **Pull quote in §01 is paraphrased in her voice** based on recurring
  themes in her talks. Mark it for her review; she may want to swap in
  a direct quote from one of her presentations.

## 12. Known gaps and soft suggestions

Things that would strengthen the site if she wants to invest:

- **Video.** Even 60 seconds of phone-quality footage of her at a podium,
  embedded in the hero or §02, is one of the strongest possible booking
  tools. A professional sizzle reel is better but not essential.
- **Case studies.** One or two short writeups of a hospital or conference
  that booked her — what they asked for, what she delivered, the CEU
  outcomes. These convert better than testimonials alone.
- **A "press / in the news" strip** if any nursing publications have
  covered her or interviewed her.
- **Booking calendar.** If she wants to show availability rather than
  handle every inquiry manually, Cal.com or Calendly embeds work well
  with a static site.

---

**Questions for Dr. Johnson to answer before launch**, consolidated:

1. CEU hours and approving body per topic (6 topics)
2. Travel policy
3. Honorarium structure
4. Response time commitment
5. 3–5 testimonials with attribution
6. Contact email (and optional phone)
7. Preferred domain handling — `www.olindajohnsonspeaks.com` or
   apex `olindajohnsonspeaks.com`
8. Any direct quote from her talks she'd prefer in the §01 pull quote
   slot, replacing the paraphrased placeholder

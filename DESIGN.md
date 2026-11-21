# moola — design reference and system

## 1. The reference

**Source.** One full-page desktop screenshot supplied in chat (`IMG_1582.jpeg`): the landing page of a product called "Space", headline "The Personal Cloud Computer".

**How it was captured.** Not with Firecrawl. The Firecrawl CLI is not installed in this environment, no `FIRECRAWL_API_KEY` is set, and the reference site did not answer when requested. So there is no scraped HTML, stylesheet, branding JSON or asset list. Everything below about the reference is read from the pixels of that one screenshot.

**What that means.** Colours are visual estimates, fonts are described by character and not identified, and spacing is not measured. The screenshot says nothing about mobile layout, hover states or animation.

### What the reference does (visual estimates)

| | Observed |
|---|---|
| Colour logic | Warm cream paper as the ground. Painted pastel skies (lavender, pink, peach, blue) as full-width bands. One pink used for every button. One near-black section late in the page. |
| Type logic | Three voices: a script line above each headline, a condensed display serif for headlines, a monospace for body copy. Everything centred. |
| Layout logic | A single centred column, long scroll. Sections alternate: painted band, then script line, headline, short paragraph, then a row or grid of small cards. |
| Material | Hand-painted animation-style illustrations (clouds, a machine, a red biplane, a figure at a workbench) that fade into the paper at their edges. Faint dotted grid behind the upper sections. |
| The one move | Painted skies dissolving into plain paper, so the page feels like one long illustration. |
| Section order | Hero on sky, icon row and three-line statement, sky band with product mock-ups, biplane with a 10-card grid, pink cloud band with 3 cards, dark section, cloud vignette with closing statement, footer with link columns. |

## 2. What moola takes, and what it changes

Taken as principles: painted skies that dissolve into paper, the script + serif + mono trio, a long quiet scroll with very few words, a dark passage near the end.

Changed:

- **Idea.** The reference is a collection of scenes. moola is one flight: the form you would otherwise fill in is folded into a paper plane, and it flies from dawn to night down the whole page, leaving a dotted trail.
- **Hue.** Lavender and pink become a day's sky: cobalt and teal dawn, amber dusk, ink-blue night. No pink.
- **Buttons.** Ink, not a brand colour. The one accent (a vermilion stamp, the plane's wax seal) appears on the object only.
- **Composition.** Not everything is centred. The statement is set left with a handwritten reply, and "How it works" is a two-column sticky layout.
- **Script.** In the reference it is a label above each headline. Here it is always part of the sentence: the lead-in to the headline, a handwritten answer, the writing on the form.
- **Content.** No icon grid, product mock-ups, card rows or link columns. moola has three facts (it forms companies, it is faster, it costs $99 a year) and the page says only those.
- **Typefaces.** Different families from the reference (see below).
- **Dropped.** The dotted grid, the pink buttons, the figure illustration, the multi-column footer.

Nothing from the reference is reused: no logo, illustration, copy, icon or screenshot.

## 3. The moola system

### Colour

All sampled from the three sky paintings.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f7f0e1` | Page ground |
| `--paper-deep` | `#efe6d2` | Input fill |
| `--sheet` | `#fffdf6` | The form, the nav capsule |
| `--ink` | `#17203a` | Text, buttons, the `$99` |
| `--ink-soft` | `#4a5270` | Body copy, labels |
| `--pen` | `#2b4ba8` | Handwriting on paper |
| `--sun` | `#d9541e` | The stamp only |
| `--cream` | `#fff6e3` | Text on sky and night |
| `--cream-soft` | `#c9cfdd` | Secondary text on night |
| `--night` | `#0b101d` | Night ground |

Contrast (WCAG ratio): ink on paper 14.2, ink-soft on paper 6.8, pen on paper 6.9, ink on the hero's teal 8.7, cream on the hero's cobalt 5.2, ink on the dusk sky 5.7 to 7.6, cream on night 16.2, cream-soft on night 8.2, input placeholder on its fill above 4.5.

### Type

| Voice | Family | Where |
|---|---|---|
| Display | Fraunces (variable; `opsz` 144, `SOFT` 30, weight 480 to 560), tracking -0.035em, line-height 0.92 to 0.98 | Headlines, the wordmark, `$99` |
| Hand | La Belle Aurore | Lead-ins, the handwritten reply, the form |
| Mono | DM Mono 400/500, 15px / 1.65 | Body, labels, buttons, nav |

All three are open source (SIL OFL 1.1) and self-hosted in `assets/fonts/`.

Sizes are fluid: hero headline `clamp(54px, 10.6vw, 172px)`, statement `clamp(42px, 7.4vw, 124px)`, section heading `clamp(40px, 5.4vw, 84px)`, step title `clamp(28px, 3.3vw, 46px)`, price `clamp(148px, min(37vw, 60svh), 620px)`.

### Space and shape

- One spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
- Content width 1180px, gutter `clamp(20px, 5vw, 72px)`.
- Buttons and the nav are full capsules. The input has a 12px radius and a soft fill, no border. The form is a 3px-radius sheet with one soft shadow.

### Imagery

Generated with Nano Banana (`gemini-3.1-flash-image`), prompts in `tools/generate-art.mjs`, processing in `tools/process-art.py`.

| File | What | Treatment |
|---|---|---|
| `dawn-sky.webp` | Hero sky | Full-bleed, slow parallax |
| `dusk-sky.webp` | Price sky | Fades in from paper, out to night |
| `night-sky.webp` | Closing sky | Full-bleed |
| `cloud-layer-a.webp` | Three clouds, transparent | Drifts across the hero on a loop |
| `cloud-layer-b.webp` | Cloud bank, transparent | Where the hero sky dissolves into paper |
| `cloud-layer-dusk.webp` | Same bank, repainted in dusk colours | In front of the `$99` |
| `paper-plane.webp` | Top-down paper plane, cut out | Flies the route |

The cloud layers were painted white on black and converted so brightness became transparency. The plane was painted on chroma green and keyed out. No people appear in any image.

### Motion

| What | How |
|---|---|
| The flight | A curve through waypoints in each section (`ROUTES` in `main.js`). The plane sits at the point on the curve level with the middle of the screen and eases toward it, so it glides behind the scroll. It starts at the left edge on load and flies in. |
| The trail | Dots along the same curve, lit behind the plane and unlit again on the way back up. |
| Headlines | Words rise from behind their own baseline, 85ms apart. |
| Handwriting | Wiped on left to right, then the underline or tick is drawn. |
| The form | Each step writes its own line as it reaches the middle of the screen. Step 3 lands the stamp. Typing a name in step 1 writes it on the form. On small screens the three lines write in sequence when the form comes into view. |
| Skies | Sky, clouds and copy move at different rates. Clouds drift on a 150s loop. |
| `$99` | Starts low behind the cloud bank and rises as the section arrives. |
| Nav | Bare over the hero sky, becomes a paper capsule once the clouds reach it. |

Easing is `cubic-bezier(0.2, 0.7, 0.2, 1)` throughout: ease-out, no bounce. With `prefers-reduced-motion` everything is simply in place, and without JavaScript all content is visible.

## 4. Open items

- The copy uses only what is known: company formation, faster, $99 a year. What the price includes, which countries or company types, and how fast "faster" is are not stated anywhere, because they were not given.
- "Start for $99" has no destination yet. Set `SIGNUP_URL` at the top of `main.js`.
- No privacy or terms links, because those pages do not exist yet.
- No logo was supplied. The wordmark is the name set in Fraunces.
- The reference could not be scraped, so section 1 is an estimate. To redo it against a live site, install the Firecrawl CLI, add a key and run the skill with a URL.

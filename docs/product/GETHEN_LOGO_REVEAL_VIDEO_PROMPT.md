# Gethen Clever-Fusion Logo Reveal Video Prompt

Last reviewed: 2026-09-03.

Status: Self-contained prompt package for generating a short vertical concept video. The depicted logo is exploratory until a final vector mark is approved.

## How To Use This File

1. Use the **Master Video Prompt** for a text-to-video concept test.
2. For better control, generate the four shots separately with the **Shot Prompts**, then edit them together.
3. Do not ask the video model to render the product name or tagline. Add exact typography in post-production.
4. Once a final SVG logo exists, use it as the final-frame image reference and replace the exploratory mark in Shots 3–4.

Recommended format:

```text
Aspect ratio: 9:16 vertical
Resolution: 1080 x 1920
Duration: 12 seconds
Frame rate: 24 or 30 fps
Style: minimal geometric motion design
Background: Winter Night #0D121B
Primary color: Aurora Cyan #62D6E3
Secondary color: Perspective Violet #A797F2
Final text: added in post, not generated in-video
```

## Creative Idea

Working title: **The Gethen Step**.

Visual fusion:

```text
Gethen initial “G”
        +
data-grid cells
        +
one forward-moving cell / next step
```

The final symbol is one bold geometric `G` constructed from a minimal grid. Its inner crossbar is also a cell moving one step forward, communicating:

```text
Get the data.
Then shape it.
Then see another perspective.
```

The animation should reveal the idea visually instead of explaining it with a paragraph. It should feel clever when the separate forms suddenly become one economical symbol.

## Master Video Prompt

Copy only the prompt inside this code block into the video generator:

```text
Create a 12-second premium vertical logo-reveal motion-design video in 9:16 format. Use a deep cool blue-black background, exact target color #0D121B, with crisp flat vector-like geometry. No people, no physical environment, no mockup scene.

The concept is a clever visual fusion between a capital letter G, a data grid, and one forward step. Begin with a single small glowing cyan square cell centered in a large field of negative space. A restrained set of connected cyan cells grows outward from it in clean horizontal and vertical movements, forming a minimal data-grid structure. Keep the number of cells low and the geometry bold; never resemble a QR code or pixel-art game graphic.

As the structure becomes complete, subtly shift the virtual camera by a few degrees so the same grid is briefly perceived from a second perspective. A small violet echo appears behind only one edge, suggesting an alternate view of the same dataset, then aligns back into the cyan structure.

The grid cells smoothly merge into one solid, unmistakable geometric capital G. The inner horizontal bar of the G is simultaneously one rectangular cell that slides exactly one step to the right and settles, creating a subtle forward-step or arrow reading. This is the visual aha moment: grid plus G plus progress become one symbol through shared geometry and negative space, not by layering separate icons.

Finish on the centered Gethen symbol in Aurora Cyan #62D6E3 with one restrained Perspective Violet #A797F2 edge accent. Hold the final mark completely still for the last 2 seconds so a wordmark can be added in post-production below it.

Motion is precise, calm, intelligent, and satisfying: measured ease-in/ease-out, confident alignment, clean snapping, no bouncing. Use only subtle soft light and a faint aurora-like atmospheric glow. Preserve a strong monochrome-readable silhouette. High contrast, minimal modern enterprise developer-tool aesthetic, perfectly clean edges, generous negative space.

Do not generate any text, letters other than the intentional geometric G symbol, captions, watermark, user-interface panels, spreadsheet documents, formulas, numbers, code, particles, lens flares, stars, snowflakes, mountains, planets, eyes, database cylinders, cubes, infinity loops, AI sparkles, Microsoft Excel imagery, green X shapes, or brand logos.

End frame: one centered geometric G logo, stable and sharp, empty space below reserved for the wordmark, no camera movement, no text.
```

## Shot Plan

| Time | Shot | Visual event | Meaning |
| --- | --- | --- | --- |
| `0.0–2.0s` | Origin | One cyan cell appears from darkness | One datum / “Get” |
| `2.0–5.0s` | Dataset | The cell expands into a restrained grid | Structure / dataset |
| `5.0–8.5s` | Perspective and fusion | Violet edge shows a second view; cells merge into `G` | Every perspective / Gethen |
| `8.5–10.0s` | Forward step | The inner bar moves one unit right and locks | “Then...” / progress |
| `10.0–12.0s` | Brand hold | Finished symbol; wordmark space remains empty | Recognition |

## Separate Shot Prompts

Use these when the generator produces inconsistent geometry in one long generation.

### Shot 1 — One Datum

```text
Vertical 9:16 minimal motion-graphics shot, 2 seconds. Deep cool blue-black background #0D121B. One precise square cell in Aurora Cyan #62D6E3 fades into view at exact center, starting as a faint point and resolving into a crisp flat vector square. Very subtle cyan atmospheric glow, generous negative space, locked camera, no text, no particles, no extra symbols. Calm premium developer-tool identity, clean geometric motion.
```

### Shot 2 — Dataset Emerges

```text
Vertical 9:16 minimal vector-like motion graphics, 3 seconds. Start from one centered cyan square cell on #0D121B. Connected rectangular cells extend horizontally and vertically with precise measured snapping, creating a sparse bold data-grid structure using no more than 12 large joined modules. The silhouette begins to hint at a capital G but is not yet complete. Flat Aurora Cyan #62D6E3, crisp edges, subtle glow, locked camera. No QR-code density, no pixel-art style, no text, no UI, no spreadsheet page.
```

### Shot 3 — Perspective Becomes G

```text
Vertical 9:16 clever visual-fusion logo animation, 3.5 seconds. Begin with a sparse bold cyan grid structure centered on a deep blue-black background #0D121B. A restrained Perspective Violet #A797F2 edge separates by a few degrees like a second view of the exact same plane, then realigns. During realignment, the cell seams disappear and the same shared geometry resolves into one solid unmistakable geometric capital G. Use negative space, not overlapping clip-art. Precise smooth easing, no bounce, no camera spin, no cube, no ribbon, no eye, no snowflake, no text.
```

### Shot 4 — The Forward Step And Hold

```text
Vertical 9:16 final logo-reveal shot, 3.5 seconds. A bold geometric capital G in Aurora Cyan #62D6E3 is centered on #0D121B. Its inner horizontal bar is a rectangular cell; slide that cell exactly one modular step to the right, implying a restrained forward arrow, then snap it cleanly into the final G silhouette. Add only one subtle Perspective Violet #A797F2 edge accent. Hold the completed mark perfectly still and sharp for the final 2 seconds. Leave generous empty space below for typography added later. No generated text, no watermark, no particles, no camera movement during the hold.
```

## Transition And Editing Notes

```text
Shot 1 → Shot 2: match-cut on the original center cell.
Shot 2 → Shot 3: preserve exact scale, position, and background.
Shot 3 → Shot 4: match-cut on the completed G silhouette.
Do not cross-dissolve the logo geometry; use shape morphing or a hard match-cut.
Keep every major alignment on the same invisible modular grid.
```

Recommended motion behavior:

- cell creation: `180–240 ms` per move;
- stagger between cell moves: `60–90 ms`;
- perspective separation: `300–400 ms`;
- merge into `G`: `600–800 ms`;
- final forward step: `350–500 ms`;
- final still hold: minimum `2 seconds`.

Use a restrained cubic ease-in/ease-out. Avoid elastic easing, overshoot, spring motion, playful bounce, liquid morphing, or chaotic glitch effects.

## Typography Added In Post

Do not generate these words inside the video model. Add them as vector text in the editor after generation:

```text
Gethen
One dataset. Every perspective.
```

Suggested final layout:

```text
                [symbol]

                 Gethen
       One dataset. Every perspective.
```

- Center-align the lockup.
- Use primary text `#EDF4F7` on Winter Night.
- Set the tagline in muted text `#A7B7C2`.
- Keep `Gethen` visually dominant.
- Use a neutral system sans-serif for the concept video until an approved wordmark exists.
- Do not animate the tagline letter by letter. Fade the complete line in as one unit.
- Recommended timing: wordmark appears at `10.1s`; tagline appears at `10.5s`.

Exact spelling and capitalization:

```text
Gethen
One dataset. Every perspective.
```

## Sound Design Prompt

```text
Create a restrained 12-second technology brand sound for a precise geometric logo reveal. Begin with one soft crystalline data ping. Add three quiet, dry alignment ticks as grid cells assemble. At the perspective shift, introduce a brief airy cyan-to-violet shimmer with no fantasy or magical character. Resolve the final forward step with one warm, confident low-mid click and a short clean tonal bloom. Modern enterprise developer tool, intelligent, calm, minimal, no epic trailer, no EDM beat, no vocals, no cinematic boom, no excessive reverb.
```

Sound timing:

| Time | Sound |
| --- | --- |
| `0.4s` | Single crystalline data ping |
| `2.2–4.8s` | Three or four quiet alignment ticks |
| `5.2–6.5s` | Short airy perspective shimmer |
| `8.8–9.3s` | Confident lock/click |
| `9.3–11.5s` | Restrained tonal resolve |

## Negative Prompt

Append this when the video model supports a separate negative prompt:

```text
text, misspelled words, captions, watermark, signature, TikTok interface, people, hands, devices, office, physical mockup, spreadsheet document, Excel logo, green X, Microsoft branding, AG Grid branding, QR code, pixel-art game icon, maze, power button, speech bubble, camera focus icon, crop icon, cube, open box, database cylinder, eye, snowflake, mountain, planet, compass, infinity symbol, chain link, recycling symbol, neural network, AI sparkle, magic, fantasy, cyberpunk, hologram HUD, rainbow, excessive gradient, heavy glow, lens flare, particles, smoke, liquid morph, glitch, camera spin, zoom burst, elastic bounce, shaky edges, tiny grid lines, overly complex geometry, illegible logo, extra letters
```

## Alternate Frost Light Version

After the Winter Night version succeeds, create a separate light-mode render. Do not ask one generated shot to transition between modes.

```text
Recreate the approved motion and exact geometry on a Frost Light background #F7FAFC. Use the light-mode Aurora Cyan #087785 for the primary symbol and Perspective Violet #6848D8 for the single secondary edge. Preserve identical timing, scale, negative space, and final-frame composition. Use primary text #17212B and muted text #586B78 in post-production. No additional shadows or gradients.
```

## Generator-Specific Guidance

### Text-To-Video

Use the Master Video Prompt for ideation only. Expect the geometry to vary between runs. Generate several candidates and judge the motion idea, not final logo consistency.

### Image-To-Video

Preferred after a logo sketch exists:

- upload a clean `1080 x 1920` start frame for Shot 1;
- upload an exact final frame containing only the approved symbol for Shot 4;
- lock the camera where supported;
- use low or medium motion strength;
- preserve subject geometry/identity at maximum strength;
- add wordmark and tagline after export.

### Keyframe/Storyboard Models

Provide these frames:

```text
Frame A: one cyan cell
Frame B: sparse grid hinting at G
Frame C: cyan grid with one violet perspective edge
Frame D: completed geometric G
Frame E: completed G with inner bar one step forward
```

Use Frame E as the final still reference for at least the last 2 seconds.

## Quality Checklist

Reject the generated video if any answer is “no”:

- Does the story read as cell → dataset → new perspective → `G` → next step?
- Is the final symbol the same geometry for at least 2 seconds?
- Does it feel like one fused idea instead of three icons layered together?
- Is the final `G` legible at phone-feed size?
- Would the silhouette still work in one color?
- Are cyan and violet used with restraint?
- Is the motion calm, precise, and developer-tool credible?
- Is all generated text absent?
- Is there enough clean space to add the exact wordmark in post?
- Is the result free from recognizable third-party or literary artwork?

## Brand Facts The Generator Must Respect

- Product name: **Gethen**.
- Pronunciation: **GETH-en** (`/ˈɡɛθ.ən/`).
- Thai reading aid: **เกธ-เธ็น**.
- Tagline: **One dataset. Every perspective.**
- Product: an open-source, MIT-licensed data-grid ecosystem for web applications.
- Core idea: get data, then shape, explore, and understand it.
- Identity: Frost Light, Winter Night, Aurora Cyan, and Perspective Violet.
- Personality: intelligent, precise, restrained, modern, extensible, developer-friendly.
- Literary inspiration does not authorize copying artwork, maps, book covers, typography, characters, film imagery, or publisher assets from *The Left Hand of Darkness*.
- Do not imitate any specific logo or creator. Use only the general clever-visual-fusion method.

## Final Production Deliverables

```text
01_gethen-logo-reveal-winter-night-1080x1920.mp4
02_gethen-logo-reveal-frost-light-1080x1920.mp4
03_gethen-logo-reveal-winter-night-clean-no-text.mp4
04_gethen-logo-reveal-frost-light-clean-no-text.mp4
05_gethen-logo-reveal-poster-winter-night.png
06_gethen-logo-reveal-poster-frost-light.png
07_gethen-logo-reveal-captions.srt
08_gethen-logo-reveal-audio.wav
09_gethen-logo-reveal-project-source/
```

Export one clean master without text so future wordmark changes do not require regenerating the motion.

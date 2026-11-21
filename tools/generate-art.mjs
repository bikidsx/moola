#!/usr/bin/env node
// Generates the site's painted artwork with Nano Banana (Gemini image models).
//
//   node tools/generate-art.mjs            # every image that does not exist yet
//   node tools/generate-art.mjs dusk-sky   # just this one (overwrites)
//
// Raw output goes to art/raw/. tools/process-art.py turns it into assets/img/.
// The key is read from GEMINI_API_KEY or the gitignored .nano-banana-config.json.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const MODEL = process.env.NANO_BANANA_MODEL || "gemini-3.1-flash-image";

const STYLE =
  "Hand-painted gouache background art, visible soft brushwork, the look of a " +
  "traditional painted animation backdrop. No text, no letters, no people, no " +
  "logos, no border, no watermark.";

const ART = {
  "dawn-sky": {
    aspectRatio: "16:9",
    prompt:
      "A vast sky just after sunrise, seen from high above the ground. Deep clear " +
      "cobalt blue at the top fading through soft teal to a warm butter-yellow and " +
      "apricot glow along the bottom. Tall towering cumulus clouds rise from the " +
      "lower third on the left and right, their undersides lit warm apricot, their " +
      "tops cool white. The upper centre of the sky is open and empty. " + STYLE,
  },
  "dusk-sky": {
    aspectRatio: "21:9",
    prompt:
      "A wide panorama of a sky at golden hour. Long banks of cumulus clouds lit " +
      "marigold gold and warm coral from the low sun, against a sky that goes from " +
      "soft teal at the top to glowing amber at the horizon. The clouds sit mostly " +
      "in the lower half and at the far left and right; the centre is open sky. " + STYLE,
  },
  "night-sky": {
    aspectRatio: "21:9",
    prompt:
      "A wide panorama of a calm night sky. Deep ink blue, almost black at the top, " +
      "with a few small scattered stars. Along the bottom, a quiet sea of clouds " +
      "seen from above, their tops faintly lit cool silver-blue by moonlight from " +
      "off-frame. Very dark overall, restful, lots of empty sky. " + STYLE,
  },
  "cloud-layer-a": {
    aspectRatio: "21:9",
    prompt:
      "Three separate fluffy cumulus clouds painted in white and very pale grey on " +
      "a pure solid black background (#000000). The clouds are spread apart across " +
      "the width with plenty of pure black between and around them, none touching " +
      "the edges of the frame. Soft feathered edges that fade fully to black. " + STYLE,
  },
  "cloud-layer-b": {
    aspectRatio: "21:9",
    prompt:
      "A long low bank of soft cumulus cloud painted in white and very pale grey " +
      "along the bottom edge of the frame, on a pure solid black background " +
      "(#000000). The top two thirds of the frame is pure black. The cloud tops " +
      "are billowy and feathered and fade fully to black. " + STYLE,
  },
  "paper-plane": {
    aspectRatio: "1:1",
    prompt:
      "A single classic dart-shaped paper airplane seen from directly above, " +
      "perfectly symmetrical, nose pointing straight up to the top of the frame, " +
      "centred, filling about seventy percent of the frame height. It is folded " +
      "from cream-white writing paper with faint pale blue ruled lines, and has a " +
      "small round marigold-orange wax seal near the tail on the centre fold. " +
      "Painted in gouache with crisp fold lines and gentle shading on one wing. " +
      "The background is a flat, even, pure chroma-key green (#00FF00) with no " +
      "shadow, no gradient and no texture. No text, no letters, no people.",
  },
};

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (existsSync(".nano-banana-config.json")) {
    return JSON.parse(readFileSync(".nano-banana-config.json", "utf8")).geminiApiKey;
  }
  throw new Error("Set GEMINI_API_KEY or create .nano-banana-config.json");
}

async function generate(name) {
  const { prompt, aspectRatio } = ART[name];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio, imageSize: "2K" },
        },
      }),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${JSON.stringify(body.error ?? body)}`);
  const part = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`${name}: no image in response ${JSON.stringify(body).slice(0, 400)}`);
  const ext = part.inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
  mkdirSync("art/raw", { recursive: true });
  writeFileSync(`art/raw/${name}.${ext}`, Buffer.from(part.inlineData.data, "base64"));
  console.log(`${name}.${ext} (${part.inlineData.mimeType})`);
}

const wanted = process.argv.slice(2);
const names = wanted.length
  ? wanted
  : Object.keys(ART).filter((n) => !existsSync(`art/raw/${n}.png`) && !existsSync(`art/raw/${n}.jpg`));

const results = await Promise.allSettled(names.map(generate));
for (const r of results) if (r.status === "rejected") console.error(String(r.reason));
process.exit(results.some((r) => r.status === "rejected") ? 1 : 0);

# moola

Landing page for moola: company formation, faster, for $99 a year.

A static site with no build step and no dependencies.

## Run it

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk also works.

## Files

| | |
|---|---|
| `index.html`, `styles.css`, `main.js` | The page |
| `assets/img/`, `assets/fonts/` | Artwork and self-hosted fonts |
| `DESIGN.md` | The design system, and how it relates to the reference |
| `preview/moola-scroll.mp4` | A recorded scroll through the page |
| `art/raw/` | The original generated artwork |
| `tools/generate-art.mjs` | Generates the artwork with Nano Banana |
| `tools/process-art.py` | Turns `art/raw/` into `assets/img/` |
| `tools/nano-banana-mcp.mjs`, `.mcp.json` | The Nano Banana MCP server for Claude Code |

## Before it goes live

- Set `SIGNUP_URL` at the top of `main.js`. Until then "Start for $99" scrolls to the last section. If a visitor typed a company name, it is passed along as `?company=`.
- Check the copy against what the $99 actually covers.
- Add privacy and terms links to the footer.

## Regenerating artwork

```sh
export GEMINI_API_KEY=...                 # or put it in .nano-banana-config.json (gitignored)
node tools/generate-art.mjs dusk-sky      # one image; no argument generates any that are missing
python3 tools/process-art.py              # needs Pillow and numpy
```

Each run paints a new image, so regenerate only what you mean to replace.

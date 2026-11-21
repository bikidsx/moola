#!/usr/bin/env node
// Launcher for the Nano Banana MCP server (https://github.com/ConechoAI/Nano-Banana-MCP).
//
// The published package hardcodes the retired model id
// "gemini-2.5-flash-image-preview", which the Gemini API now answers with 404.
// This installs a pinned version into a cache directory, points it at a current
// model, and starts it. Override the model with NANO_BANANA_MODEL.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = "1.0.3";
const MODEL = process.env.NANO_BANANA_MODEL || "gemini-2.5-flash-image";

const prefix = join(homedir(), ".cache", "nano-banana-mcp", VERSION);
const entry = join(prefix, "node_modules", "nano-banana-mcp", "dist", "index.js");

if (!existsSync(entry)) {
  // stdout is the MCP channel, so npm's output goes to stderr.
  execFileSync(
    "npm",
    ["install", "--prefix", prefix, "--no-audit", "--no-fund", `nano-banana-mcp@${VERSION}`],
    { stdio: ["ignore", 2, 2], shell: process.platform === "win32" },
  );
}

// The server reads its key from GEMINI_API_KEY, then from .nano-banana-config.json
// in the working directory. With neither, pass a placeholder so requests still go
// out and a network proxy holding the real key can fill in the x-goog-api-key header.
const envKey = process.env.GEMINI_API_KEY ?? "";
if (envKey === "" || envKey.startsWith("${")) {
  if (existsSync(".nano-banana-config.json")) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = "injected-by-network-secret";
}

const source = readFileSync(entry, "utf8");
const patched = source.replace(/model: "gemini-[^"]*"/g, `model: "${MODEL}"`);
if (patched !== source) writeFileSync(entry, patched);

await import(pathToFileURL(entry).href);

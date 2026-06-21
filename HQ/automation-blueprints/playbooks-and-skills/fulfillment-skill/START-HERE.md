# Fulfillment Kit — Start Here

This is your fulfillment engine. Drop in a client's intake-call transcript and
Claude turns it into a clean, ready-to-reach list of real people — finding them
in public databases and building a scraper when no clean dataset exists. You
never decide who fits; the transcript does that.

---

## What's in this folder

- **`SKILL.md`** — the brain. You don't read this line by line; Claude does.
- **`build-a-scraper/`** — the scraper engine: a full course + 24 working
  scrapers you can run or clone.
- **`demo-transcript.txt`** — an example intake call so you can try it today.

---

## What you need first (one-time)

1. **Claude Code** installed. (claude.ai/code → install the CLI)
2. **Node.js** — only if you want to run the scrapers. (nodejs.org, the LTS one)
3. **An Apollo API key** — only for the enrichment step (turning companies into
   emails). You bring your own; it's never hardcoded.

You can skip 2 and 3 and still do the whole find-the-list part. They only matter
when you go to scrape or enrich.

---

## Install (60 seconds) — do this once

First: right-click the downloaded zip → **Extract All / Unzip** so the
`fulfillment-skill` folder is sitting on your **Desktop**. Then:

### Mac
Open **Terminal**, paste this one line, hit enter:
```
cp -R ~/Desktop/fulfillment-skill ~/.claude/skills/fulfillment
```

### Windows
Open **PowerShell**, paste this one line, hit enter:
```
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null; Copy-Item -Recurse "$env:USERPROFILE\Desktop\fulfillment-skill" "$env:USERPROFILE\.claude\skills\fulfillment"
```

Then restart Claude Code. Type `/` — if you see the skill in the list, you're live.

---

## How to use it

1. Get the intake call transcript (Fathom export, or any transcript).
2. Open Claude Code, paste the transcript, and tell it what you want:

   **To preview first (it shows the plan and waits):**
   > Read this intake call, extract the ICP, and show me your plan for finding
   > them. Don't run anything yet. Ready when I am.

   **To run the whole thing:**
   > Here's the intake call. Fulfill it end to end — find them, pull the list.
   > Don't stop to ask me between steps. Go.

That's it. Claude reads the call, figures out where those people live publicly,
pulls the fits, drops the non-fits, and hands you a clean list.

---

## The rules baked in (so you don't have to think about them)

- Pull every genuine fit; report the honest count. No padding to hit a number.
- Never buy inboxes or domains for a client — use your own. (This is the margin.)
- Honor the client's "do not bring me ___" list absolutely.
- When a market is thin, it says so — it won't fake volume.

---

## Try it right now

Paste the contents of `demo-transcript.txt` into Claude Code, then the "preview
first" line above. Watch it read a real call and tell you exactly who to go get.

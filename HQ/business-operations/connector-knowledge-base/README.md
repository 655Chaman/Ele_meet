# Connect Your Business — Plug & Play Knowledge Base

This folder is a complete, drop-in operating system for running a **connector business** (market-making / matchmaking between supply and demand in a niche). It's built to plug straight into **Claude Code**.

## How to use it (plug & play)

1. **Drop this folder into Claude Code.** Open Claude Code with this folder as your working directory (or copy its contents into your project). `CLAUDE.md` loads automatically and turns Claude into your connector operator.
2. **Add your own keys.** Open `templates/keys.template.txt` and fill in your Instantly / data-source keys. (No keys ship in this folder — you bring your own.)
3. **Connect the Instantly MCP** (see `playbooks/instantly-mcp.md`) so Claude can create campaigns and push leads for you.
4. **Tell Claude what to build.** Examples:
   - "Pick me a penalty market that prints, like the FMCSA one."
   - "Build the supply side — 500 enriched."
   - "Build the demand side — 200 with verified emails."
   - "Create the campaigns and write the copy off the proven bones."

## What's inside

```
Viewer Connect Your Business/
├── CLAUDE.md                      ← master instructions (auto-loads in Claude Code)
├── README.md                      ← this file
├── knowledge/
│   ├── 01-connector-model.md      ← the paradigm: lane/lens/flow, inventory, 6-month build
│   ├── 02-demand-doctrine.md      ← making demand respond: copy, replies, onboarding, routing
│   ├── 03-pricing-and-the-call.md ← who pays, how much, the exact qualifying call
│   └── 04-penalty-markets-playbook.md ← picking a market + FMCSA worked example
├── playbooks/
│   ├── building-supply-side.md    ← Super Search → enrichment → campaign (today's build)
│   ├── building-demand-side.md    ← public enforcement DB → verify → campaign (today's build)
│   └── instantly-mcp.md           ← the Instantly MCP: campaigns, leads, follow-ups
├── templates/
│   ├── copy-bones.md              ← proven subjects + 3-step sequences
│   └── keys.template.txt          ← your API keys go here
└── scripts/
    ├── supersearch_pull.py        ← state-fan-out lead pull (reference)
    └── enrich_notes.md            ← enrichment options (native + waterfall)
```

## The one-paragraph version
Pick one niche. Find a side that's *bleeding* (an urgent, recurring, public problem) — that's demand. Find the people who fix that for a living — that's supply. Reach both, qualify both, and route the match. Demand pays once (the problem is episodic); supply pays monthly (the need is constant). You don't fulfill — you connect. Do that with volume and good timing and you've built a market-making machine that runs on near-zero overhead.

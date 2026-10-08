# Claude Status Widget

A lightweight status-widget tool for Claude Code sessions.

## 1. What it is

- `scripts/status-widget.mjs`: Generates a single RTL (Arabic) HTML status page summarizing the current Claude Code session environment (container CPU, memory, and disk usage, model name, tokens, tool execution counts, context size extracted from the session transcript, git repository state, and Swedish local time).
- `scripts/status-shot.mjs`: Captures a screenshot of the generated HTML page as a PNG image formatted at phone width.

## 2. Requirements

- **Node.js**: Version 20+
- **For screenshot generation (`status-shot.mjs`)**:
  - The `playwright` package must be installed in your environment.
  - A Chromium binary (configured via `CHROMIUM_PATH` environment variable, or installed at `/opt/pw-browsers/chromium`).
  - *Note*: Playwright is NOT bundled in this repository and must not be added as a dependency.

## 3. Usage

Generate the HTML status page:
```bash
node scripts/status-widget.mjs --out status.html --model "<name>" [--fragment] [--transcript <session.jsonl>] [--quota-week-left <pct> --quota-5h-left <pct> --quota-renew "<text>"]
```

Capture the screenshot to PNG:
```bash
node scripts/status-shot.mjs <absolute status.html> <status.png>
```

## 4. How to use it in another project

1. Copy `scripts/status-widget.mjs` and `scripts/status-shot.mjs` into your project's `scripts/` directory.
2. Paste the contents of `SNIPPET.md` into your project's `CLAUDE.md`.
3. Adjust file paths or artifact URLs in `CLAUDE.md` if needed.

## 5. Honest limits

- **Environment context**: It shows metrics of the host machine where the script executes (a cloud container is not the user's local computer).
- **Missing metrics**: Values that cannot be measured directly will display as `"—"`.
- **Subscription quota**: Quota details are only displayed when explicitly passed in via command-line flags.
- **Context window**: The maximum context-window limit is not known by the script.

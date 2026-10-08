# Claude Status Widget

A lightweight RTL (Arabic) status widget for Claude Code sessions with a phone-width screenshot tool.

## 1. What it is

- `scripts/status-widget.mjs`: Generates a single RTL (Arabic) HTML status page summarizing the current Claude Code session environment (container CPU, memory, and disk usage, model name, tokens, tool execution counts, context size extracted from the session transcript, git repository state, and Swedish local time).
- `scripts/status-shot.mjs`: Captures a screenshot of the generated HTML page as a PNG image formatted at phone width.

## 2. Requirements

- **Node.js**: Version 20+
- **For screenshot generation (`status-shot.mjs`)**:
  - The `playwright` package must be installed in your environment.
  - A Chromium binary (configured via `CHROMIUM_PATH` environment variable, or installed at `/opt/pw-browsers/chromium`).

---

## 3. Usage Methods

### Method A: Direct Execution via `npx` (No Local Installation)
Run directly from GitHub without adding files to your repo:
```bash
# Generate the status HTML page
npx github:m760622/claude-status-widget --out status.html --model "Claude 3.5 Sonnet"

# Take a screenshot to PNG
npx -p github:m760622/claude-status-widget claude-status-shot status.html status.png
```

### Method B: One-Liner Quick Download / Run
Execute on the fly or download via curl:
```bash
# Generate directly via piping:
curl -fsSL https://raw.githubusercontent.com/m760622/claude-status-widget/main/scripts/status-widget.mjs | node - --out status.html --model "Claude 3.5 Sonnet"

# Or install the scripts into your project's scripts/ folder:
curl -fsSL https://raw.githubusercontent.com/m760622/claude-status-widget/main/install.sh | bash
```

### Method C: Git Submodule (Shared Across Repositories)
Link this repository as a submodule in any project:
```bash
git submodule add https://github.com/m760622/claude-status-widget.git tools/status-widget
node tools/status-widget/scripts/status-widget.mjs --out status.html --model "Claude 3.5 Sonnet"
```

---

## 4. How to use it in another project's `CLAUDE.md`

1. Paste the contents of `SNIPPET.md` into your project's `CLAUDE.md`.
2. When the user sends `جججج` or `صصصص`, Claude will automatically run the tool (either from GitHub or locally) and display the session status screenshot.

---

## 5. Honest limits

- **Environment context**: It shows metrics of the host machine where the script executes (a cloud container is not the user's local computer).
- **Missing metrics**: Values that cannot be measured directly will display as `"—"`.
- **Subscription quota**: Quota details are only displayed when explicitly passed in via command-line flags.
- **Context window**: The maximum context-window limit is not known by the script.

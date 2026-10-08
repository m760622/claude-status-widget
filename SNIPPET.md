## Status widget

- When the user's whole message is `جججج` or `صصصص`, show the status widget instead of answering in text.
- If the scripts are not present locally in `scripts/`, fetch or run them directly from GitHub:
  ```bash
  # Option A: One-line on-demand execution (no files added to git)
  curl -fsSL https://raw.githubusercontent.com/m760622/claude-status-widget/main/scripts/status-widget.mjs | node - --out <scratchpad>/status.html --model <your model> --ctx-used <tokens used so far> --ctx-total <session token budget>
  # Option B: Run locally if installed in scripts/
  node scripts/status-widget.mjs --out <scratchpad>/status.html --model <your model> --ctx-used <tokens used so far> --ctx-total <session token budget>
  ```
- Turn it into an image with `node scripts/status-shot.mjs <scratchpad>/status.html <scratchpad>/status.png` (or fetch from GitHub if missing), and send the PNG with SendUserFile (display: render). If the screenshot script fails, say so in one line and offer the artifact page instead.
- Send only the image. Publish the interactive page (same command plus `--fragment`) to the artifact only when the user asks for the page or the link.
- Quota: pass `--quota-week-left`, `--quota-5h-left` (percent left) and `--quota-renew` only when the user gave you numbers from `/usage`; otherwise the card says it is unavailable.
- The widget reads real tool counts, context size and last-call token usage from the session transcript on its own (newest `.jsonl` under `~/.claude/projects/<this directory>`); pass `--transcript <file>` if two sessions run at once.
- Pass only numbers you actually know; leave a flag out and the widget shows "—". Say in one line that the device is the cloud container, not the user's computer.

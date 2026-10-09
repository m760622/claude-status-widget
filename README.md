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

## 4. Prompts for other AI Assistants

See [PROMPT.md](PROMPT.md) for ready-to-copy prompts formatted for ChatGPT, Claude, Cursor, Windsurf, and Antigravity.

## 5. How to use it in another project's `CLAUDE.md`

1. Paste the contents of `SNIPPET.md` into your project's `CLAUDE.md`.
2. When the user sends `جججج` or `صصصص`, Claude will automatically run the tool (either from GitHub or locally) and display the session status screenshot.

---

## 6. Honest limits

- **Environment context**: It shows metrics of the host machine where the script executes (a cloud container is not the user's local computer).
- **Missing metrics**: Values that cannot be measured directly will display as `"—"`.
- **Subscription quota**: Quota details are only displayed when explicitly passed in via command-line flags.
- **Context window**: The maximum context-window limit is not known by the script.

## دعم المساعدين ومصادر القياس

- كودكس: `--provider codex --transcript /absolute/session.jsonl` يقرأ نافذة السياق والتوكنز والحصص من السجل الفعلي، مع منع جمع المخزن مرتين وإزالة أحداث الاستهلاك المكررة.
- كلود: `--provider claude --transcript /absolute/session.jsonl` يحافظ على قراءة سجلاته، وتحتاج نافذة السياق إلى قياس يمرر صراحة إذا لم يذكرها السجل.
- الاكتشاف التلقائي: يختار أحدث سجل للمشروع الحالي؛ عند تعدد الجلسات مرر السجل صراحة.
- جيميني وكيرسر وويندسيرف وغيرها: `--metrics /absolute/metrics.json` يستقبل بيانات موحدة من مضيف المساعد. هذا توافق عبر البيانات، وليس ادعاء قراءة سجلاتها الأصلية تلقائيا.
- الخيارات `--input --cache --output --calls --ctx-now --ctx-window` تعمل وتتقدم على بيانات السجل. الإدخال يعني التوكنز الجديدة، والمخزن منفصل عنه.
- القيم المفقودة تظهر غير متاحة، والحصص المنتهية لا تعرض. لا تحوّل النقد إلى نسبة من الحصة.
- التصوير يدعم `playwright-core` ومتصفح كروم المثبت، إضافة إلى مكتبات التصوير السابقة.
- قراءة `version.json` تتقدم على نسخة `package.json` عند عرض نسخة المشروع.
- الذاكرة الحرة والضغط منفصلان على ماك؛ لا يفسر استعمال الذاكرة وحده بأنه ضغط حرج.

مثال المدخل الموحد (الأعداد مثال توضيحي فقط):
```json
{"schemaVersion":1,"provider":"gemini","model":"اسم النموذج","context":{"used":200,"window":1000},"lastRequest":{"input":70,"cache":120,"output":10},"calls":3,"quotas":{"week":{"left":43,"resetsAt":"2026-10-15T06:42:38Z"}}}
```
احذف أي حقل لا تملك مصدر قياس له. عدد النداءات في سجلات كودكس هو عدد أحداث الاستهلاك الفريدة، وليس عدد استدعاءات الأدوات؛ الأدوات لها قسم منفصل.

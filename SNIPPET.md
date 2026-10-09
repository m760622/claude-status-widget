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

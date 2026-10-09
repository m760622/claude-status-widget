# Prompts for AI Coding Assistants (تلقينات النماذج)

Copy and paste the relevant prompt into your AI coding assistant’s custom instructions, rules file, or system prompt.

---

## 1. General Arabic Prompt (تلقينة موحدة عامة لأي نموذج)
Suitable for ChatGPT, Claude, DeepSeek, or any interactive AI model:

```markdown
## ودجت حالة الجلسة والنظام (Status Widget)

عندما تكون رسالة المستخدم كاملة هي: `جججج` أو `صصصص`:
لا تجب بنص طويل، بل قم بتوليد وعرض صورة ودجت الحالة فوراً باتباع الخطوات التالية:

1. توليد صفحة الحالة بصيغة HTML:
   npx github:m760622/claude-status-widget --out /tmp/status.html --model "<اسم النموذج الحالي>"
   - إذا كان مسار transcript الجلسة متوفراً مرره عبر: `--transcript <مسار الملف>` لقراءة عدد استدعاءات الأدوات والتوكنز.
   - إذا زوّدك المستخدم بنسب الحصص مررها عبر: `--quota-5h-left <النسبة>` و `--quota-week-left <النسبة>` و `--quota-renew "<الوقت>"`.

2. التقاط صورة الودجت بصيغة PNG:
   npx -p github:m760622/claude-status-widget claude-status-shot /tmp/status.html /tmp/status.png
   (يكتشف Playwright تلقائياً أو يستخدم Google Chrome المثبت على النظام كبديل).

3. عرض النتيجة:
   أرسل أو اعرض ملف الصورة الناتج `/tmp/status.png` مباشرة للمستخدم في المحادثة.
   إذا تعذر التقاط الصورة، أبلغ المستخدم بسطر واحد واعرض عليه صفحة الـ HTML بدلاً منها.
```

---

## 2. Cursor IDE (`.cursorrules`)

Add this snippet to your project's `.cursorrules`:

```markdown
# Status Widget
When the user sends `جججج` or `صصصص`:
1. Generate the status widget HTML:
   run: `npx github:m760622/claude-status-widget --out /tmp/status.html --model "Cursor / Claude"`
2. Capture screenshot to PNG:
   run: `npx -p github:m760622/claude-status-widget claude-status-shot /tmp/status.html /tmp/status.png`
3. Tell the user the image is ready at `/tmp/status.png` and render or link it.
```

---

## 3. Windsurf / Cascade (`.windsurfrules`)

Add this snippet to your project's `.windsurfrules`:

```markdown
# System Status Widget
When the user prompt is exactly `جججج` or `صصصص`:
- Execute: `npx github:m760622/claude-status-widget --out /tmp/status.html --model "Cascade"`
- Execute: `npx -p github:m760622/claude-status-widget claude-status-shot /tmp/status.html /tmp/status.png`
- Return the image `/tmp/status.png` to the user.
```

---

## 4. Antigravity / Gemini Code Agent (`RULE` or `SKILL`)

```markdown
## ودجت مؤشرات النظام والعتاد
عند كتابة «جججج» أو «صصصص»:
- نفّذ محلياً: `npx github:m760622/claude-status-widget --out /tmp/status.html --model "Antigravity Agent"`
- التقط الصورة: `npx -p github:m760622/claude-status-widget claude-status-shot /tmp/status.html /tmp/status.png`
- اعرض الصورة للمستخدم مباشرة.
```

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

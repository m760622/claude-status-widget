// Writes a one-page status widget (device, memory, model, context window, last request, repo) as HTML.
//   node scripts/status-widget.mjs --out <file.html> [--model <name>] [--ctx-used <tokens>] [--ctx-total <tokens>]
//        [--fragment] [--transcript <session.jsonl>] [--quota-week-left <pct> --quota-5h-left <pct> --quota-renew <text>] [--ctx-window <tokens> --ctx-now <tokens>] [--calls <n>] [--input <tokens>] [--output <tokens>] [--cache <tokens>]
// Device, memory, disk and repo are read live; the model, context and request numbers can only come from the
// caller, and show "—" when left out. Claude prints it when the user types "جججج" (see CLAUDE.md).
import { writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { cpus, type, release, arch, loadavg, homedir, totalmem, freemem } from 'node:os';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const out = arg('out');
if (!out) { console.error('usage: status-widget.mjs --out <file.html> [options]'); process.exit(2); }

const run = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = v => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const tok = n => (n === null ? '—' : n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : String(n));
const gb = kb => `${(kb / 1048576).toFixed(1)} GB`;
const pct = (a, b) => (b > 0 ? Math.min(100, Math.max(0, (a / b) * 100)) : 0);

const n = cpus().length;
const cpuSample = process.platform === 'darwin' ? run('top', ['-l', '1', '-n', '0']).match(/([\d.]+)% idle/) : null;
const cpuPct = cpuSample ? 100 - Number(cpuSample[1]) : null;
const mem = (() => {
  try {
    if (readFileSync('/proc/meminfo', 'utf8')) {
      return Object.fromEntries(readFileSync('/proc/meminfo', 'utf8').split('\n').filter(Boolean).map(l => { const [k, v] = l.split(':'); return [k, parseInt(v, 10)]; }));
    }
  } catch {}
  return {
    MemTotal: Math.round(totalmem() / 1024),
    MemAvailable: Math.round(freemem() / 1024)
  };
})();
// In a container /proc/meminfo describes the host, so prefer the cgroup limit and usage (v2, then v1) when they are lower.
const readNum = f => { try { const t = readFileSync(f, 'utf8').trim(); return /^\d+$/.test(t) ? Number(t) : null; } catch { return null; } };
const stat = f => { try { return Object.fromEntries(readFileSync(f, 'utf8').trim().split('\n').map(l => l.split(' '))); } catch { return {}; } };
const cg = [['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory.stat', 'inactive_file'],
  ['/sys/fs/cgroup/memory/memory.limit_in_bytes', '/sys/fs/cgroup/memory/memory.usage_in_bytes', '/sys/fs/cgroup/memory/memory.stat', 'total_inactive_file']]
  .map(([lim, cur, st, key]) => ({ lim: readNum(lim), cur: readNum(cur), cache: Number(stat(st)[key] || 0) / 1024 }))
  .find(c => c.lim !== null && c.cur !== null && c.lim / 1024 < mem.MemTotal);
if (cg) { mem.MemTotal = cg.lim / 1024; mem.MemAvailable = Math.max(0, mem.MemTotal - Math.max(0, cg.cur / 1024 - cg.cache)); }
const memUsed = mem.MemTotal - mem.MemAvailable;
const disk = run('df', ['-Pk', homedir()]).split('\n')[1]?.split(/\s+/) || [];
const diskTotal = Number(disk[1]) || 0, diskUsed = Number(disk[2]) || 0;

const pkg = (() => { try { const p = JSON.parse(readFileSync('package.json', 'utf8')); try { p.version = JSON.parse(readFileSync('version.json', 'utf8')).version || p.version; } catch {} return p; } catch { return { name: process.cwd().split('/').pop(), version: '—' }; } })();
const branch = run('git', ['branch', '--show-current']) || '—';
const dirty = run('git', ['status', '--short']).split('\n').filter(Boolean).length;
const last = run('git', ['log', '-1', '--format=%h · %s']);

const ctxUsed = num(arg('ctx-used')), ctxTotal = num(arg('ctx-total'));
const ctxPct = ctxUsed !== null && ctxTotal ? pct(ctxUsed, ctxTotal) : null;
let model = arg('model') || '—';


// Numbers and units stay left-to-right inside the right-to-left page, so "0.4 / 15.7 GB" and "25K / 15M" read in order.
const ltr = s => `<span class="n">${esc(s)}</span>`;
const levelText = { ok: 'طبيعي', warn: 'مرتفع', crit: 'حرج' };
const level = p => (p >= 90 ? 'crit' : p >= 70 ? 'warn' : 'ok');
const bar = (p, c) => `<div class="bar ${level(p)}" style="--c:var(--c-${c})"><i style="width:${Math.max(p, p > 0 ? 1.5 : 0).toFixed(1)}%"></i></div>`;
const meter = (label, p, detail, c) => p === null
  ? `<div class="meter"><div class="row"><span>${label}</span><span class="tag">غير معروف</span></div><div class="mut">${detail}</div></div>`
  : `<div class="meter"><div class="row"><span>${label}</span><b class="v ${level(p)}">${ltr(p.toFixed(1) + '%')}</b></div>${bar(p, c)}<div class="mut"><span class="lv ${level(p)}">${levelText[level(p)]}</span>${detail ? ' ' + detail : ''}</div></div>`;
const tile = (k, v) => `<div class="tile"><span class="mut">${esc(k)}</span><b>${ltr(v)}</b></div>`;

const memPct = pct(memUsed, mem.MemTotal), diskPct = pct(diskUsed, diskTotal);
const today = new Date();
const TZ = 'Europe/Stockholm'; // Swedish time (CET/CEST)
const now = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ, timeZoneName: 'short' });
const dateAr = today.toLocaleDateString('ar-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TZ });
// Normalize available measurements across assistants; absent fields stay unknown.
const metric = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
const readJSON = file => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };
const provider = arg('provider') || 'auto';
const findTranscript = () => {
  if (arg('transcript')) return arg('transcript');
  const candidates = [];
  if (provider === 'auto' || provider === 'claude') {
    try { const dir = `${homedir()}/.claude/projects/${process.cwd().replace(/[\\/]/g, '-')}`;
      for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) candidates.push(`${dir}/${f}`);
    } catch {}
  }
  if (provider === 'auto' || provider === 'codex') {
    const walk = dir => { try { for (const entry of readdirSync(dir, {withFileTypes:true})) {
      const file = `${dir}/${entry.name}`; if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.jsonl')) {
        // Match the session's actual project, never pick an unrelated latest chat.
        const header = readFileSync(file, 'utf8').split('\n').slice(0, 10);
        if (header.some(line => { try { const o=JSON.parse(line); return o.type==='session_meta' && o.payload?.cwd===process.cwd(); } catch { return false; } })) candidates.push(file);
      }
    }} catch {} };
    walk(`${homedir()}/.codex/sessions`);
  }
  return candidates.sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs)[0] || null;
};
const normalizeUsage = (u, kind) => {
  if (!u) return null;
  const input = metric(u.input_tokens), cache = metric(kind === 'codex' ? u.cached_input_tokens : u.cache_read_input_tokens);
  const created = metric(u.cache_creation_input_tokens);
  const context = input === null ? null : kind === 'codex' ? input : input + (cache || 0) + (created || 0);
  return {input: input === null ? null : kind === 'codex' ? Math.max(0,input-(cache||0)) : input + (created||0), cache, output:metric(u.output_tokens), context};
};
const readTranscript = file => {
  const tools=new Map(), calls=new Map(), seenTool=new Set(); let latest=null, window=null, limits=null, kind=null, observedModel=null;
  try { for (const line of readFileSync(file,'utf8').split('\n')) {
    let o; try { o=JSON.parse(line); } catch { continue; }
    if (o.type==='assistant' && o.message) {
      kind='claude'; const m=o.message; if(m.model)observedModel=m.model;
      if(m.id && m.usage) {const usage=normalizeUsage(m.usage,'claude');calls.set(m.id,usage);latest=usage;}
      for(const item of Array.isArray(m.content)?m.content:[]) if(item.type==='tool_use' && item.id && !seenTool.has(item.id)) {seenTool.add(item.id);tools.set(item.name,(tools.get(item.name)||0)+1);}
    }
    if(o.type==='turn_context' && o.payload?.model)observedModel=o.payload.model;
    const p=o.payload;
    if(o.type==='event_msg' && p?.type==='token_count' && p.info?.last_token_usage) {
      kind='codex'; const key=JSON.stringify(p.info.total_token_usage || {time:o.timestamp,usage:p.info.last_token_usage});
      latest=normalizeUsage(p.info.last_token_usage,'codex');calls.set(key,latest);
      window=metric(p.info.model_context_window); if(p.rate_limits)limits=p.rate_limits;
    }
    if(o.type==='response_item' && ['function_call','custom_tool_call'].includes(p?.type) && p.call_id && !seenTool.has(p.call_id)){seenTool.add(p.call_id);tools.set(p.name,(tools.get(p.name)||0)+1);}
  }} catch { return null; }
  return latest ? {tools:[...tools].sort((a,b)=>b[1]-a[1]),apiCalls:calls.size,last:latest,window,limits,provider:kind,model:observedModel} : null;
};
const tr = arg('transcript') || !arg('metrics') ? (()=>{const file=findTranscript();return file?readTranscript(file):null;})() : null;
// Portable JSON adapter for Gemini, Cursor, Windsurf and other hosts.
const supplied = arg('metrics') ? readJSON(arg('metrics')) : null;
const data = supplied && supplied.schemaVersion === 1 ? supplied : null;
if (!arg('model')) model = data?.model || tr?.model || '—';
const override = (name, fallback) => arg(name) === undefined ? metric(fallback) : metric(Number(arg(name)));
const lastIn=override('input', data?.lastRequest?.input ?? tr?.last?.input);
const lastCache=override('cache', data?.lastRequest?.cache ?? tr?.last?.cache);
const lastOut=override('output', data?.lastRequest?.output ?? tr?.last?.output);
const calls=override('calls', data?.calls ?? tr?.apiCalls);
const toolName = n => String(n).replace(/^mcp__([^_]+(?:_[^_]+)*)__/, '$1:');
const ctxWin=override('ctx-window',data?.context?.window ?? tr?.window);
const ctxNow=override('ctx-now',data?.context?.used ?? tr?.last?.context);
const ctxNowPct=ctxWin && ctxNow !== null ? pct(ctxNow,ctxWin) : null;
const quotaWindow = duration => Object.values(tr?.limits || {}).find(v=>v && typeof v==='object' && v.window_minutes===duration);
const freshQuota = q => q && metric(q.used_percent)!==null && q.used_percent<=100 && Number(q.resets_at)*1000>Date.now() ? q : null;
const week=freshQuota(quotaWindow(10080)), five=freshQuota(quotaWindow(300));
const portableQuota = name => {const q=data?.quotas?.[name];return q && Date.parse(q.resetsAt)>Date.now() && metric(q.left)!==null && q.left<=100 ? q : null;};
const pw=portableQuota('week'),pf=portableQuota('fiveHour');
const weekLeft=override('quota-week-left',pw?.left ?? (week?100-week.used_percent:null));
const hourLeft=override('quota-5h-left',pf?.left ?? (five?100-five.used_percent:null));
const renewal = pw?.resetsAt || (week ? new Date(week.resets_at*1000).toISOString() : null);
const renew=arg('quota-renew') || (renewal?new Date(renewal).toLocaleString('en-GB',{timeZone:'Europe/Stockholm',dateStyle:'short',timeStyle:'short'}):null);
const quotaRow=(label,left)=> left===null || left>100
 ? `<div class="meter"><div class="row"><span>${label}</span><span class="tag">غير متاحة</span></div></div>`
 : `<div class="meter"><div class="row"><span>${label}</span><b class="v ${level(100-left)}">${ltr(left.toFixed(0)+'%')} <span class="mut">متبقٍّ</span></b></div>${bar(left,'repo')}</div>`;

// --fragment: no doctype/html/head/body, for publishing as a claude.ai Artifact (the host adds the skeleton).
const fragment = args.includes('--fragment');
const head = fragment ? '' : '<!doctype html>\n<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n';
writeFileSync(out, `${head}<title>حالة الجلسة</title>
<style>
:root{--bg:#0e0f12;--card:#17181c;--line:#2a2c32;--fg:#f2f3f5;--mut:#9094a0;--acc:#4b7bec;--ok:#3ddc97;--warn:#f5a524;--crit:#ff6b6b;--c-cpu:#5b8def;--c-mem:#a78bfa;--c-disk:#2dd4bf;--c-tok:#fbbf24;--c-model:#f472b6;--c-node:#84cc16;--c-req:#fb923c;--c-repo:#38bdf8;color-scheme:dark}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){--bg:#f4f5f7;--card:#fff;--line:#dcdee3;--fg:#15161a;--mut:#5f636e;--acc:#2f5fd0;--ok:#0f8f5b;--warn:#a85f00;--crit:#c62828;--c-cpu:#2f5fd0;--c-mem:#7c3aed;--c-disk:#0d9488;--c-tok:#b45309;--c-model:#be185d;--c-node:#4d7c0f;--c-req:#c2410c;--c-repo:#0369a1;color-scheme:light}}
:root[data-theme="light"]{--bg:#f4f5f7;--card:#fff;--line:#dcdee3;--fg:#15161a;--mut:#5f636e;--acc:#2f5fd0;--ok:#0f8f5b;--warn:#a85f00;--crit:#c62828;--c-cpu:#2f5fd0;--c-mem:#7c3aed;--c-disk:#0d9488;--c-tok:#b45309;--c-model:#be185d;--c-node:#4d7c0f;--c-req:#c2410c;--c-repo:#0369a1;color-scheme:light}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,"Segoe UI",Tahoma,sans-serif;padding:12px 16px}
.w{max-width:680px;margin:0 auto;padding:0 4px;box-sizing:border-box;display:grid;gap:8px}
.card{background:var(--card);border:1px solid var(--line);border-top:3px solid var(--c,var(--acc));border-radius:12px;padding:8px 12px;min-width:0}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
h1{font-size:16px;margin:0}.mut{color:var(--mut);font-size:12px}.v{font-size:15px}
.n{direction:ltr;unicode-bidi:isolate;display:inline-block;font-variant-numeric:tabular-nums}
.bar{height:6px;border-radius:6px;background:var(--line);overflow:hidden;margin:3px 0 2px}.bar i{display:block;height:100%;border-radius:6px;background:var(--c,var(--acc))}
.bar.warn i{background:var(--warn)}.bar.crit i{background:var(--crit)}
.v.warn,.lv.warn{color:var(--warn)}.v.crit,.lv.crit{color:var(--crit)}.lv.ok{color:var(--ok)}.lv{font-weight:600;margin-inline-end:6px}
.foot{text-align:center;line-height:1.7;padding:2px 4px}
.tag{font-size:11px;border:1px solid var(--line);border-radius:6px;padding:0 6px;color:var(--mut);white-space:nowrap}.tag.ok{color:var(--ok);border-color:var(--ok)}.tag.warn{color:var(--warn);border-color:var(--warn)}
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:6px}.three .mut{font-size:11px}
.k{color:var(--c);font-weight:700}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px}.tile{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:8px;padding:2px 8px;min-width:0}.tile b{font-size:14px}
@media(max-width:380px){.tiles{grid-template-columns:repeat(2,1fr)}}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.chip{border:1px solid var(--line);border-radius:8px;padding:1px 8px;font-size:12px}.chip b{margin-inline-start:4px}
</style>${fragment ? '' : '</head><body>'}<div class="w" dir="rtl">
<div class="card"><div class="row"><h1>حالة الجلسة</h1><span class="mut">${esc(dateAr)} · ${ltr(now)} (السويد)</span></div>
<div class="row"><span class="mut">${ltr(type() + ' ' + release() + ' · ' + arch())}</span><span class="tag">${process.platform === 'darwin' ? 'جهاز محلي (macOS)' : 'حاوية سحابية'} · ${n} أنوية</span></div>
<div class="three">
${meter('المعالج', cpuPct, 'الاستخدام الفعلي', 'cpu')}
<div class="meter"><div class="row"><span>الذاكرة الحرة</span><b>${ltr(gb(mem.MemAvailable))}</b></div><div class="mut">من ${ltr(gb(mem.MemTotal))} ${process.platform==='darwin' ? '· ضغط النظام: '+esc(({1:'طبيعي',2:'مرتفع',4:'حرج'})[run('sysctl',['-n','kern.memorystatus_vm_pressure_level'])] || 'غير متاح') : ''}</div></div>
${meter('القرص', diskPct, ltr(`${gb(diskUsed)} / ${gb(diskTotal)}`), 'disk')}</div></div>
<div class="card" style="--c:var(--c-tok)">${meter('نافذة السياق',ctxNowPct,ctxWin ? ltr(`${tok(ctxNow)} / ${tok(ctxWin)}`) : 'حجم النافذة غير متاح','tok')}</div>
<div class="card" style="--c:var(--c-repo)"><div class="row"><b>حصة الاشتراك</b><span class="mut">${renew ? `التجدد ${ltr(renew)}` : 'تاريخ التجدد: غير متاح لي'}</span></div>
${quotaRow('الأسبوع', weekLeft)}${quotaRow('كل 5 ساعات', hourLeft)}</div>
<div class="card" style="--c:var(--c-model)"><div class="row"><span><span class="mut">النموذج</span> <b class="k" style="--c:var(--c-model)">${ltr(model)}</b></span><span><span class="mut">Node</span> <b class="k" style="--c:var(--c-node)">${ltr(process.version)}</b></span></div></div>
<div class="card" style="--c:var(--c-req)"><span class="mut">آخر نداء للنموذج${calls!==null ? ` · نداءات الجلسة ${ltr(String(calls))}` : ''}</span><div class="tiles">${tile('نداءات', tok(calls))}${tile('مخزن', tok(lastCache))}${tile('إدخال', tok(lastIn))}${tile('مخرج', tok(lastOut))}</div></div>
${tr ? `<div class="card" style="--c:var(--c-node)"><span class="mut">أدوات الجلسة (${ltr(String(tr.tools.reduce((a, [, n]) => a + n, 0)))} استدعاءً)</span><div class="chips">${tr.tools.slice(0, 8).map(([n, c]) => `<span class="chip">${ltr(toolName(n))} <b>${ltr(String(c))}</b></span>`).join('')}${tr.tools.length > 8 ? `<span class="chip mut">${ltr('+' + (tr.tools.length - 8))}</span>` : ''}</div></div>` : ''}
<div class="card" style="--c:var(--c-repo)"><div class="row"><span><b>${ltr(pkg.name)}</b> <span class="tag">${ltr('v' + pkg.version)}</span> <span class="tag ${dirty ? 'warn' : 'ok'}">${dirty ? `${dirty} ملفات معدّلة` : 'مستقر'}</span></span><span class="mut">${ltr(branch)}</span></div>
<div class="mut">${ltr(last)}</div></div>
<div class="mut foot">لقطة وقت التوليد ${ltr(now)} (السويد) · لا تحديث تلقائي، اكتب «جججج» لتحديثها<br>— تعني أن القياس غير متاح لي</div>
</div>${fragment ? '' : '</body></html>'}
`);
console.log(`wrote ${out}`);

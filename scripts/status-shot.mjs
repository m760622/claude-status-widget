// Screenshots an HTML file at phone width (400px, dark) and crops to the .w widget. Needs the playwright package (not a dependency of this app) and a Chromium: CHROMIUM_PATH, else /opt/pw-browsers/chromium, else playwright's own browser.
//   node scripts/status-shot.mjs <abs/in.html> <out.png>
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const req = createRequire(process.cwd() + '/');

let pw;
try { 
    pw = req('playwright'); 
} catch { 
    try { 
        pw = req('@playwright/test'); 
    } catch { 
        pw = null; 
    } 
}

const [,, inp, outp] = process.argv;

if (!pw) {
    const chromePaths = [
        process.env.CHROME_PATH,
        process.env.CHROMIUM_PATH,
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ].filter(Boolean);

    const chromePath = chromePaths.find(p => existsSync(p));

    if (chromePath) {
        try {
            execFileSync(chromePath, ['--headless', `--screenshot=${outp}`, '--window-size=540,1060', '--hide-scrollbars', inp]);
            process.exit(0);
        } catch (e) {
            console.error(`status-shot: failed to take screenshot with ${chromePath}: ${e.message}`);
            process.exit(1);
        }
    } else {
        console.error('status-shot: neither playwright nor chrome found; send the artifact link instead of an image.');
        process.exit(1);
    }
}

const exe = process.env.CHROMIUM_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const b = await pw.chromium.launch(exe ? { executablePath: exe } : {}).catch(e => { console.error('status-shot: cannot start Chromium (' + e.message.split('\n')[0] + '); send the artifact link instead of an image.'); process.exit(1); });
const p = await b.newPage({ viewport: { width: 540, height: 2000 }, deviceScaleFactor: 2, colorScheme: 'dark' });
await p.goto('file://' + inp);
const h = await p.evaluate(() => Math.ceil(document.querySelector(".w").getBoundingClientRect().bottom) + 12);
await p.screenshot({ path: outp, clip: { x: 0, y: 0, width: 540, height: h } });
await b.close();

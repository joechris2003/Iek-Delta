// Γράφει το preview σε mp4 (1080x1920, 30fps, 32s) με Playwright + ffmpeg.
// Χρήση: node render_video.js [έξοδος.mp4] [μέγιστος χρόνος σε δευτερόλεπτα]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const out = path.resolve(process.argv[2] || 'PULSE_X1_Story_preview.mp4');
const limit = parseFloat(process.argv[3] || '32');
const FPS = 30;
const audio = path.resolve(__dirname, '../assets/pulse_soundtrack.wav');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'ad.html'));
  await page.evaluate(() => window.fontsReady);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio,
    '-t', String(limit),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '160k', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));

  const frames = Math.round(limit * FPS);
  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log('Έτοιμο:', out);
})();

// Measure real frame-time while scrolling through the zone.
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,300));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});
await new Promise(r=>setTimeout(r,1500));

// Install frame-time sampler
await page.evaluate(() => {
  window.__frames = [];
  let prev = performance.now();
  const loop = () => {
    const now = performance.now();
    window.__frames.push(now - prev);
    prev = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

// Simulate scrolling from top to bottom of the zone over 4 seconds
const z = await page.evaluate(() => ({ top: document.querySelector(".dna3d-zone").offsetTop, h: document.querySelector(".dna3d-zone").offsetHeight }));
const steps = 60;
const start = Date.now();
for (let i = 0; i <= steps; i++) {
  const p = i / steps;
  const y = Math.round(z.top + p * (z.h - 900));
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise(r => setTimeout(r, 80));
}

// Wait 500ms after final scroll for smoothing to settle
await new Promise(r => setTimeout(r, 500));

const stats = await page.evaluate(() => {
  const f = window.__frames.slice(10); // ignore first 10 warmup
  f.sort((a,b)=>a-b);
  const avg = f.reduce((a,b)=>a+b,0) / f.length;
  const p50 = f[Math.floor(f.length * 0.5)];
  const p95 = f[Math.floor(f.length * 0.95)];
  const p99 = f[Math.floor(f.length * 0.99)];
  const worst = f[f.length - 1];
  const dropped = f.filter(x => x > 20).length;
  return { count: f.length, avg, p50, p95, p99, worst, dropped, fps_avg: 1000/avg };
});

console.log("Frames sampled:", stats.count);
console.log("Avg frame:", stats.avg.toFixed(2), "ms  (~", stats.fps_avg.toFixed(0), "fps)");
console.log("p50:", stats.p50.toFixed(2), "ms");
console.log("p95:", stats.p95.toFixed(2), "ms");
console.log("p99:", stats.p99.toFixed(2), "ms");
console.log("Worst:", stats.worst.toFixed(2), "ms");
console.log("Dropped frames (>20ms):", stats.dropped);

await browser.close();

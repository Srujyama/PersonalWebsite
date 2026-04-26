// Profile how much work happens in the render loop itself.
import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,300));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});

// Scroll to chapter with active labels
const z = await page.evaluate(() => ({ top: document.querySelector(".dna3d-zone").offsetTop, h: document.querySelector(".dna3d-zone").offsetHeight }));
await page.evaluate((y) => window.scrollTo(0, y), Math.round(z.top + 0.5 * (z.h - 900)));
await new Promise(r => setTimeout(r, 1500));

// Use Performance API to measure paint times
const longTasks = await page.evaluate(() => new Promise((resolve) => {
  const tasks = [];
  const obs = new PerformanceObserver((list) => {
    list.getEntries().forEach(e => tasks.push({ name: e.name, dur: e.duration, start: e.startTime }));
  });
  try { obs.observe({ entryTypes: ["longtask"] }); } catch {}
  setTimeout(() => { obs.disconnect(); resolve(tasks); }, 3000);
}));
console.log("Long tasks (>50ms) during 3s of idle scrolling:", longTasks.length);
longTasks.forEach(t => console.log(" ", t.name, t.dur.toFixed(0), "ms at", t.start.toFixed(0)));

// Number of DOM nodes and render-heavy checks
const domInfo = await page.evaluate(() => ({
  nodes: document.getElementsByTagName("*").length,
  canvasNodes: document.querySelectorAll("canvas").length,
  labelCount: document.querySelectorAll(".dna3d-label").length,
}));
console.log("DOM:", domInfo);

await browser.close();

import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
page.on("console", (m) => { const t = m.text(); if (t.startsWith("[")) console.log(t); });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,300));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});
await new Promise(r=>setTimeout(r,1000));

const z = await page.evaluate(()=>({ top: document.querySelector(".dna3d-zone").offsetTop, h: document.querySelector(".dna3d-zone").offsetHeight }));
const y = Math.round(z.top + 0.70 * (z.h - 900));
await page.evaluate(y=>window.scrollTo(0,y), y);
await new Promise(r=>setTimeout(r,1200));

await page.evaluate(()=>{ window.__dbg = true; });
await new Promise(r=>setTimeout(r,500));
await page.evaluate(()=>{ window.__dbg = false; });
await browser.close();

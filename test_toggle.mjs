import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,300));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});
await new Promise(r=>setTimeout(r,800));

console.log("[1] Initial state — DNA hero active");
const s1 = await page.evaluate(()=>({ dna: !!document.querySelector(".dna3d-zone"), classicH1: document.querySelector("main h1")?.textContent }));
console.log("    ", s1);

// Click the "Classic hero" pill
const clickBtn = await page.evaluate(()=>{
  const btn = document.querySelector(".dna3d-archive-btn");
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, text: btn.textContent };
});
console.log("    archive btn:", clickBtn);
if (clickBtn) await page.mouse.click(clickBtn.x, clickBtn.y);
await new Promise(r=>setTimeout(r,600));

console.log("\n[2] After clicking 'Classic hero' — DNA should be gone, classic h1 visible");
const s2 = await page.evaluate(()=>({ dna: !!document.querySelector(".dna3d-zone"), classicH1: document.querySelector("main h1")?.textContent, storage: localStorage.getItem("hero_mode") }));
console.log("    ", s2);
await page.screenshot({ path: "test-shots/classic_hero.png" });

// Click "⌬ DNA hero" back
const back = await page.evaluate(()=>{
  const b = document.querySelector(".hero-mode-btn");
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, text: b.textContent };
});
console.log("\n[3] Classic hero's DNA button:", back);
if (back) await page.mouse.click(back.x, back.y);
await new Promise(r=>setTimeout(r,600));
const s3 = await page.evaluate(()=>({ dna: !!document.querySelector(".dna3d-zone"), storage: localStorage.getItem("hero_mode") }));
console.log("    restored:", s3);

await browser.close();

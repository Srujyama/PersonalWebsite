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

for (const p of [0.30, 0.40, 0.50, 0.55, 0.60, 0.70]) {
  const z = await page.evaluate(() => ({ top: document.querySelector(".dna3d-zone").offsetTop, h: document.querySelector(".dna3d-zone").offsetHeight }));
  const y = Math.round(z.top + p * (z.h - 900));
  await page.evaluate((y)=>window.scrollTo(0,y), y);
  await new Promise(r=>setTimeout(r,800)); // more time for smoothing
  const all = await page.evaluate(() => {
    return [...document.querySelectorAll(".dna3d-label")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        text: el.querySelector(".dna3d-label-title")?.textContent,
        op: +getComputedStyle(el).opacity,
        x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0,
        onscreen: r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight,
      };
    });
  });
  const chapter = await page.evaluate(() => {
    const t = document.querySelector(".dna3d-chapter-title");
    return t ? t.textContent : "";
  });
  const visible = all.filter(l => l.op > 0.05 && l.onscreen);
  console.log(`[${p}] chapter="${chapter}" visible=${visible.length}`);
  visible.forEach(v => console.log(`    ${v.text} op=${v.op.toFixed(2)} pos=(${v.x},${v.y})`));
  // dump opacity distribution
  const opDist = all.map(l => `${l.text}:${l.op.toFixed(2)}`).join(" ");
  console.log(`    all: ${opDist}`);
}
await browser.close();

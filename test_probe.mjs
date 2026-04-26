import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 15000 });
await new Promise(r=>setTimeout(r,400));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});
await new Promise(r=>setTimeout(r,1000));

for (const p of [0, 0.1, 0.2, 0.3, 0.5, 0.8]) {
  const zoneTop = await page.evaluate(()=>document.querySelector(".dna3d-zone").offsetTop);
  const zoneH   = await page.evaluate(()=>document.querySelector(".dna3d-zone").offsetHeight);
  const y = Math.round(zoneTop + p * (zoneH - 900));
  await page.evaluate(y=>window.scrollTo(0,y),y);
  await new Promise(r=>setTimeout(r,500));
  const info = await page.evaluate(()=>{
    const stage = document.querySelector(".dna3d-stage");
    const canvas = document.querySelector(".dna3d-canvas");
    const sr = stage.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    const cs = getComputedStyle(stage);
    const cc = getComputedStyle(canvas);
    // Sample a few pixels from canvas to see if it's actually rendering something
    const ctx = canvas.getContext("2d"); // will be null for WebGL
    return {
      stageRect: { x:sr.x, y:sr.y, w:sr.width, h:sr.height },
      canvasRect:{ x:cr.x, y:cr.y, w:cr.width, h:cr.height },
      stageTop: cs.top,
      stagePos: cs.position,
      stageVisibility: cs.visibility,
      canvasDisplay: cc.display,
      canvasOpacity: cc.opacity,
      canvasWidth: canvas.width, canvasHeight: canvas.height,
      sY: window.scrollY,
    };
  });
  console.log(`[${p}]`, JSON.stringify(info));
}
await browser.close();

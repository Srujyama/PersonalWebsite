// Test that clicking a label opens the accordion + scrolls to the target.
import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE ERR: " + m.text()); });

await page.evaluateOnNewDocument(() => { try { localStorage.setItem("hero_mode","dna"); } catch {} });
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await new Promise(r=>setTimeout(r,300));
await page.mouse.click(700,450).catch(()=>{});
await new Promise(r=>setTimeout(r,400));
await page.waitForSelector(".dna3d-zone",{timeout:15000});
await new Promise(r=>setTimeout(r,800));

// Scroll to ~0.40 so labels are visible and clickable
const z = await page.evaluate(() => ({ top: document.querySelector(".dna3d-zone").offsetTop, h: document.querySelector(".dna3d-zone").offsetHeight }));
await page.evaluate((y)=>window.scrollTo(0,y), Math.round(z.top + 0.40*(z.h-900)));
await new Promise(r=>setTimeout(r,900)); // let smoothing catch up

const labels = await page.evaluate(() => {
  return [...document.querySelectorAll(".dna3d-label")].map((el, i) => {
    const r = el.getBoundingClientRect();
    return {
      i, text: el.querySelector(".dna3d-label-title")?.textContent,
      href: el.href,
      opacity: +getComputedStyle(el).opacity,
      x: r.x + r.width/2, y: r.y + r.height/2,
      onscreen: r.right > 0 && r.left < 1400 && r.bottom > 0 && r.top < 900,
    };
  });
});

const pickable = labels.filter(l => l.opacity > 0.5 && l.onscreen);
console.log("Pickable labels:", pickable.length, "/", labels.length);
pickable.slice(0,5).forEach(l => console.log(" ", l.text, "→", l.href, "at", l.x.toFixed(0), l.y.toFixed(0)));

if (pickable.length === 0) { console.log("NO PICKABLE"); await browser.close(); process.exit(1); }

// Click the first pickable one (likely "Visa" or similar)
const target = pickable.find(l => l.text === "Visa") || pickable[0];
console.log("\nClicking:", target.text);

await page.mouse.click(target.x, target.y);
await new Promise(r=>setTimeout(r,1200)); // smooth scroll

const after = await page.evaluate(() => {
  const openGrids = [...document.querySelectorAll(".grid")]
    .filter(g => g.className.includes("grid-rows-[1fr]")).length;
  const visa = document.querySelector("#exp-visa");
  return {
    scrollY: window.scrollY,
    openGrids,
    heroMode: localStorage.getItem("hero_mode"),
    expVisa: visa ? { top: visa.getBoundingClientRect().top, bottom: visa.getBoundingClientRect().bottom } : null,
    visibleVisa: visa ? (visa.getBoundingClientRect().top < 900 && visa.getBoundingClientRect().bottom > 0) : false,
  };
});
console.log("After click:", JSON.stringify(after, null, 2));
await page.screenshot({ path: "test-shots/after_click.png" });
console.log("\nERRORS:", errors.length ? errors : "(none)");
await browser.close();

// Headless test: scroll through the site in increments, screenshot each.
// Also dumps canvas/label diagnostics so I can verify the helix is rendering.
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";

const OUT = "test-shots";
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 1400, height: 900 },
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("CONSOLE ERR: " + m.text());
});

// Force DNA hero mode even if localStorage is stale
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem("hero_mode", "dna"); } catch {}
});

await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded", timeout: 15000 });

// Skip the intro animation: click the page; the intro commits on click.
await new Promise((r) => setTimeout(r, 300));
await page.mouse.click(700, 450).catch(() => {});
await new Promise((r) => setTimeout(r, 400));
await page.mouse.click(700, 450).catch(() => {});

// Wait for DNA zone to mount
try {
  await page.waitForSelector(".dna3d-zone, .dna3d-fallback", { timeout: 15000 });
} catch (e) {
  console.log("DNA zone never mounted — intro probably stuck.");
}
// Let rAF run a couple of cycles
await new Promise((r) => setTimeout(r, 1200));

// Dump diagnostics about the DNA zone
const diag = await page.evaluate(() => {
  const zone = document.querySelector(".dna3d-zone");
  const stage = document.querySelector(".dna3d-stage");
  const canvas = document.querySelector(".dna3d-canvas");
  const labels = document.querySelector(".dna3d-labels");
  const name = document.querySelector(".dna3d-name");
  const mainHero = document.querySelector(".pb-12.border-b-2");
  return {
    zoneExists: !!zone,
    zoneH: zone ? zone.offsetHeight : 0,
    stageExists: !!stage,
    stageRect: stage ? stage.getBoundingClientRect() : null,
    canvasExists: !!canvas,
    canvasRect: canvas ? canvas.getBoundingClientRect() : null,
    labelCount: labels ? labels.children.length : 0,
    nameExists: !!name,
    nameOpacity: name ? getComputedStyle(name).opacity : null,
    classicHeroPresent: !!mainHero,
    docHeight: document.documentElement.scrollHeight,
    winHeight: window.innerHeight,
    localStorageHero: localStorage.getItem("hero_mode"),
  };
});

console.log("DIAG:", JSON.stringify(diag, null, 2));

// Screenshot at scroll positions 0%, 15%, 30%, 50%, 70%, 90% through the zone
const zoneTop = await page.evaluate(() => {
  const z = document.querySelector(".dna3d-zone");
  return z ? z.offsetTop : 0;
});
const zoneH = diag.zoneH;
const positions = [0.0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.98, 1.02, 1.1];

for (const p of positions) {
  const y = Math.round(zoneTop + p * (zoneH - 900));
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 900)); // let rAF settle + scroll smoothing catch up

  // Per-frame diagnostics
  const frameInfo = await page.evaluate(() => {
    const name = document.querySelector(".dna3d-name");
    const labels = [...document.querySelectorAll(".dna3d-label")].map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        text: el.querySelector(".dna3d-label-title")?.textContent || "",
        opacity: cs.opacity,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        onscreen: r.x + r.width > 0 && r.x < window.innerWidth && r.y + r.height > 0 && r.y < window.innerHeight,
      };
    });
    return {
      nameOpacity: name ? getComputedStyle(name).opacity : null,
      scrollY: window.scrollY,
      visibleLabels: labels.filter((l) => +l.opacity > 0.05 && l.onscreen).length,
      totalLabels: labels.length,
      labels: labels.filter((l) => +l.opacity > 0.05),
    };
  });

  const file = `${OUT}/scroll_${String(p).padStart(4, "0").replace(".", "_")}.png`;
  await page.screenshot({ path: file, fullPage: false });
  // Where is the Education block?
  const contentInfo = await page.evaluate(() => {
    const edu = document.querySelector("#section-education");
    const main = document.querySelector("main");
    return {
      eduTop: edu ? edu.getBoundingClientRect().top : null,
      mainTop: main ? main.getBoundingClientRect().top : null,
      zoneBottom: document.querySelector(".dna3d-zone")?.getBoundingClientRect().bottom,
    };
  });
  console.log(`[${p.toFixed(2)}] y=${y} name=${frameInfo.nameOpacity} visibleLabels=${frameInfo.visibleLabels}/${frameInfo.totalLabels} mainTop=${contentInfo.mainTop} eduTop=${contentInfo.eduTop} zoneBottom=${contentInfo.zoneBottom}`);
  if (frameInfo.visibleLabels > 0 && frameInfo.visibleLabels <= 4) {
    console.log("   →", frameInfo.labels.map((l) => `${l.text}@(${l.x},${l.y}) op=${l.opacity}`).join("  "));
  }
}

console.log("\nERRORS:", errors.length ? errors : "(none)");
await browser.close();
console.log(`\nScreenshots in ${OUT}/`);

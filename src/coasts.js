// Two small, rotating architectural studies. Triangles are rasterised straight
// into character cells: no WebGL context, canvas, model download or dependency.
const COLS = 76;
const ROWS = 44;
// The shaded surfaces use letters from Srujan Yamali's name.
const INK = " .,:;ilrjunsyaYAMS@";

function sculpture(place) {
  const mesh = [];
  const triangle = (a, b, c, tone) => mesh.push({ points: [a, b, c], tone });
  const quad = (a, b, c, d, tone = 0.85) => {
    triangle(a, b, c, tone);
    triangle(a, c, d, tone);
  };
  const box = (x, y, z, w, h, d, tone = 0.85) => {
    const p = [
      [x-w/2,y,z-d/2], [x+w/2,y,z-d/2],
      [x+w/2,y+h,z-d/2], [x-w/2,y+h,z-d/2],
      [x-w/2,y,z+d/2], [x+w/2,y,z+d/2],
      [x+w/2,y+h,z+d/2], [x-w/2,y+h,z+d/2],
    ];
    for (const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],
      [1,2,6,5],[3,7,6,2],[0,1,5,4]]) quad(p[a],p[b],p[c],p[d],tone);
  };
  const cone = (y, h, r0, r1, sides = 24, tone = 0.85, x = 0, z = 0) => {
    for (let i = 0; i < sides; i++) {
      const a = i / sides * Math.PI * 2;
      const b = (i+1) / sides * Math.PI * 2;
      const point = (r, y, a) => [x+Math.cos(a)*r, y, z+Math.sin(a)*r];
      quad(point(r0,y,a),point(r0,y,b),point(r1,y+h,b),point(r1,y+h,a),tone);
      triangle([x,y+h,z],point(r1,y+h,a),point(r1,y+h,b),tone);
    }
  };

  if (place === "berkeley") {
    // The Campanile: stepped plinth, slender shaft, four clock faces,
    // open belfry and a pyramidal roof. Small details are actual surfaces.
    // A plaza and cypress trees give the tower a place, rather than leaving
    // an isolated column floating in the page's negative space.
    box(0,-0.15,0,9,0.15,6,0.42);
    box(0,-0.28,0.5,10,0.13,7,0.35);
    for (const [x,z,h] of [[-3,0.8,2.8],[3,-1,3.4],[-3.5,-1.7,2.2]]) {
      box(x,0,z,0.14,0.8,0.14,0.75);
      cone(0.5,h,0.5,0,12,1.05,x,z);
    }
    box(0,0,0,4.2,0.35,4.2);
    box(0,0.35,0,3.3,0.35,3.3);
    box(0,0.7,0,2.1,9.1,2.1);
    box(0,9.8,0,2.4,0.22,2.4);
    box(0,10.02,0,2.22,1.35,2.22);
    box(0,11.37,0,2.55,0.22,2.55);
    box(0,11.59,0,2.18,1.5,2.18);
    box(0,13.09,0,2.7,0.2,2.7);
    // Square roof, rotated a quarter-turn to align with the square shaft.
    const roof = [[-1.4,13.29,-1.4],[1.4,13.29,-1.4],
      [1.4,13.29,1.4],[-1.4,13.29,1.4]];
    for (let i=0;i<4;i++) triangle(roof[i],roof[(i+1)%4],[0,15,0],0.95);
    for (let side=0;side<4;side++) {
      const turn = ([x,y,z]) => {
        const a = side * Math.PI/2;
        return [x*Math.cos(a)+z*Math.sin(a),y,-x*Math.sin(a)+z*Math.cos(a)];
      };
      const face = (x,y,w,h,z,tone) => quad(...[
        [x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z],
      ].map(turn),tone);
      // Recessed vertical panels and paired belfry openings.
      face(0,1.3,0.24,7.7,1.052,0.36);
      for (const x of [-0.47,0.47]) face(x,11.8,0.45,1.05,1.092,1.45);
      // A clock disk on each of the four sides, with quiet stone around it.
      for (let i=0;i<16;i++) {
        const a = i/16*Math.PI*2;
        const b = (i+1)/16*Math.PI*2;
        triangle(turn([0,10.7,1.113]),
          turn([Math.cos(a)*0.39,10.7+Math.sin(a)*0.39,1.113]),
          turn([Math.cos(b)*0.39,10.7+Math.sin(b)*0.39,1.113]),1.5);
      }
    }
  } else {
    // A study of Harbor of Refuge Light, at the mouth of Delaware Bay.
    cone(-0.2,0.1,6,6,48,0.28);
    cone(0,0.6,4.1,4.1,32,0.65);
    cone(0.6,0.8,3.1,2.8,24,0.95);
    cone(1.4,2.5,2.8,2.15,24,0.8);
    cone(3.9,0.3,2.4,2.4);
    cone(4.2,4.4,1.8,1.25,24,0.75);
    cone(8.6,0.25,2.05,2.05,24,1.05);
    // Lantern, mullions, overhanging roof and finial.
    cone(8.85,1.8,1.12,1.12,12,0.32);
    for (let i=0;i<8;i++) {
      const a = i/8*Math.PI*2;
      box(Math.cos(a)*1.14,8.85,Math.sin(a)*1.14,0.12,1.8,0.12,1.3);
    }
    cone(10.65,0.2,1.65,1.65,24,1.1);
    cone(10.85,1.2,1.65,0.1,24,1.1);
    cone(12.05,0.6,0.09,0.03,8,1.1);
    for (let i=0;i<16;i++) {
      const a=i/16*Math.PI*2;
      box(Math.cos(a)*1.98,8.85,Math.sin(a)*1.98,0.06,0.6,0.06);
    }
    cone(9.45,0.06,2.02,2.02,32,0.8);
    for (const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
      const p = (x,y,z) => [x*Math.cos(a)+z*Math.sin(a),y,-x*Math.sin(a)+z*Math.cos(a)];
      quad(p(-0.23,5.4,1.68),p(0.23,5.4,1.68),
        p(0.23,6.3,1.57),p(-0.23,6.3,1.57),1.4);
    }
  }
  return mesh;
}

const MODELS = {
  berkeley: { mesh: sculpture("berkeley"), centre: 7.1, scale: 2.4,
    caption: "Sather Tower · Berkeley, CA" },
  delaware: { mesh: sculpture("delaware"), centre: 6.1, scale: 2.65,
    caption: "Harbor of Refuge Light · Delaware" },
};

function render(model, angle) {
  const cells = new Array(COLS * ROWS).fill(" ");
  const depth = new Float32Array(COLS * ROWS).fill(-Infinity);
  const sin = Math.sin(angle), cos = Math.cos(angle);
  const pitch = 0.16;
  const transform = ([x,y,z]) => {
    const rx = x*cos+z*sin;
    const rz = -x*sin+z*cos;
    const cy = y-model.centre;
    return [rx,cy*Math.cos(pitch)-rz*Math.sin(pitch),
      cy*Math.sin(pitch)+rz*Math.cos(pitch)];
  };
  for (const { points, tone } of model.mesh) {
    const world = points.map(transform);
    const u = world[1].map((v,i)=>v-world[0][i]);
    const v = world[2].map((v,i)=>v-world[0][i]);
    const normal = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length = Math.hypot(...normal);
    if (length < 1e-8) continue;
    const light = Math.abs((-0.45*normal[0]+0.65*normal[1]+0.6*normal[2])/length);
    const ink = INK[Math.min(INK.length-1,Math.round((0.26+0.6*light)*tone*(INK.length-1)))];
    const p = world.map(([x,y,z])=>[COLS/2+x*model.scale/0.6,ROWS/2-y*model.scale,z]);
    const [a,b,c] = p;
    const area = (b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if (Math.abs(area)<1e-8) continue;
    const x0 = Math.max(0,Math.floor(Math.min(...p.map(v=>v[0]))));
    const x1 = Math.min(COLS-1,Math.ceil(Math.max(...p.map(v=>v[0]))));
    const y0 = Math.max(0,Math.floor(Math.min(...p.map(v=>v[1]))));
    const y1 = Math.min(ROWS-1,Math.ceil(Math.max(...p.map(v=>v[1]))));
    for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
      const s=((b[1]-c[1])*(x+0.5-c[0])+(c[0]-b[0])*(y+0.5-c[1]))/area;
      const t=((c[1]-a[1])*(x+0.5-c[0])+(a[0]-c[0])*(y+0.5-c[1]))/area;
      if(s < -1e-6 || t < -1e-6 || s+t > 1+1e-6) continue;
      const z=s*a[2]+t*b[2]+(1-s-t)*c[2];
      const i=y*COLS+x;
      if(z>=depth[i]) {depth[i]=z;cells[i]=ink;}
    }
  }
  return Array.from({length:ROWS},(_,r)=>cells.slice(r*COLS,(r+1)*COLS).join("")).join("\n");
}

const figure = document.querySelector(".coasts");
if (figure) {
  const art = figure.querySelector("pre");
  const place = figure.querySelector(".coast-place");
  const motion = figure.querySelector(".coast-motion");
  const stage = figure.querySelector(".coast-stage");
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let selected = "berkeley";
  let angle = -0.55;
  let paused = reduced.matches;
  let visible = false;
  let timer;
  let previous = 0;
  let dragging = false;
  let pointerX = 0;

  const draw = () => { art.textContent = render(MODELS[selected],angle); };
  const syncControl = () => {
    motion.querySelector("span").textContent = paused ? "Play" : "Pause";
    motion.querySelector("path").setAttribute("d",paused ? "M5 3 13 8 5 13Z" : "M5 3v10M11 3v10");
    motion.setAttribute("aria-label",`${paused ? "Play" : "Pause"} text animation`);
  };
  const canRun = () => !paused && !dragging && visible && !document.hidden &&
    !root.classList.contains("intro");
  function tick() {
    const now = performance.now();
    angle += Math.min(120,now-previous)*0.00022;
    previous = now;
    draw();
    timer = setTimeout(tick,100); // Ten small text frames a second.
  }
  function schedule() {
    clearTimeout(timer);
    if (!canRun()) return;
    previous = performance.now();
    timer = setTimeout(tick,100);
  }
  for (const button of figure.querySelectorAll("[data-coast]")) {
    button.addEventListener("click",()=>{
      selected = button.dataset.coast;
      for (const other of figure.querySelectorAll("[data-coast]")) {
        other.setAttribute("aria-pressed",String(other === button));
      }
      place.textContent = MODELS[selected].caption;
      stage.setAttribute("aria-label",`Text sculpture of ${MODELS[selected].caption}. Drag or use the left and right arrow keys to rotate.`);
      angle = -0.55;
      draw();
    });
  }
  motion.addEventListener("click",()=>{
    paused = !paused;
    syncControl();
    schedule();
  });
  stage.addEventListener("pointerdown",event=>{
    if (event.button !== 0) return;
    dragging = true;
    pointerX = event.clientX;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
    schedule();
  });
  stage.addEventListener("pointermove",event=>{
    if (!dragging) return;
    angle += (event.clientX-pointerX)*0.012;
    pointerX = event.clientX;
    draw();
  });
  const release = () => {
    dragging = false;
    stage.classList.remove("is-dragging");
    schedule();
  };
  stage.addEventListener("pointerup",release);
  stage.addEventListener("pointercancel",release);
  stage.addEventListener("lostpointercapture",release);
  stage.addEventListener("keydown",event=>{
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    angle += event.key === "ArrowLeft" ? -0.16 : 0.16;
    paused = true;
    syncControl();
    schedule();
    draw();
  });
  reduced.addEventListener("change",()=>{
    paused = reduced.matches;
    syncControl();
    schedule();
  });
  new IntersectionObserver(([entry])=>{
    visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
    schedule();
  },{threshold:0.1}).observe(art);
  document.addEventListener("visibilitychange",schedule);
  window.addEventListener("pagehide",()=>clearTimeout(timer));
  window.addEventListener("pageshow",schedule);
  if (root.classList.contains("intro")) {
    const observer = new MutationObserver(()=>{
      if (!root.classList.contains("intro")) {
        observer.disconnect();
        schedule();
      }
    });
    observer.observe(root,{attributes:true,attributeFilter:["class"]});
  }
  draw();
  syncControl();
  figure.querySelector(".coast-toolbar").hidden = false;
}

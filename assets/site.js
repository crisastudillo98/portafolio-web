// Portafolio — interacción de paneles
// 1) Entradas coreografiadas por panel (una vez por visita).
// 2) Transición entre paneles: el panel que sale se hunde y se oscurece mientras el siguiente sube encima.
// 3) Barra superior y riel siguen el tono del panel que tienen debajo; contador 01/06 con giro direccional.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const panels = Array.from(document.querySelectorAll(".panel"));
const topbar = document.querySelector(".topbar");
const rail = document.querySelector(".rail");
const railLinks = rail ? Array.from(rail.querySelectorAll("a")) : [];
const roll = document.querySelector(".counter-roll");

/* ---------- Año del pie ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

/* ---------- Coreografía: retrasos por rol, con intervalos que se acortan ---------- */
// Titular (lead) primero, luego texto y botones (support), luego tarjetas (items).
const LINE_STEPS = [0, 80, 145, 195, 235];
const ITEM_STEPS = [0, 70, 125, 170, 205, 235];

panels.forEach((panel) => {
  const lines = panel.querySelectorAll('[data-r="line"]');
  const ups = panel.querySelectorAll('[data-r="up"]');
  const items = panel.querySelectorAll('[data-r="item"]');
  const fades = panel.querySelectorAll('[data-r="fade"]');
  const isHero = panel.classList.contains("hero");

  const lineBase = isHero ? 120 : 0;
  lines.forEach((el, i) => el.style.setProperty("--d", `${lineBase + (LINE_STEPS[i] ?? 235 + i * 25)}ms`));

  const afterLines = lines.length ? lineBase + (LINE_STEPS[lines.length - 1] ?? 235) + 140 : 120;
  ups.forEach((el, i) => el.style.setProperty("--d", `${(isHero ? afterLines + 450 : afterLines) + i * 90}ms`));

  const itemBase = afterLines + 40;
  items.forEach((el, i) => el.style.setProperty("--d", `${itemBase + (ITEM_STEPS[i] ?? 235 + i * 20)}ms`));

  // Decoración: el primer fundido (eyebrow) acompaña al titular; el resto llega al final.
  fades.forEach((el, i) => el.style.setProperty("--d", i === 0 ? "0ms" : `${afterLines + (isHero ? 700 : 260)}ms`));
});

/* ---------- Entradas: una sola vez por panel ---------- */
const reveal = (panel) => panel.classList.add("is-in");

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        reveal(entry.target);
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

// Esperamos a las fuentes (con tope) para que las líneas del titular no salten de ancho a mitad de la animación.
const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
fontsReady.then(() => {
  requestAnimationFrame(() => {
    panels.forEach((p) => io.observe(p));
  });
});

/* ---------- Medidas ---------- */
let vh = window.innerHeight;
let fits = [];

function measure() {
  vh = window.innerHeight;
  // Un panel "cabe" si su contenido no supera la pantalla; solo esos usan el efecto de hundirse.
  fits = panels.map((p) => p.offsetHeight <= vh * 1.04);
}

/* ---------- Estado activo, tono y contador ---------- */
let activeIndex = 0;

function setCounter(index, forward) {
  if (!roll) return;
  const panel = panels[index];
  const label = `${String(index + 1).padStart(2, "0")} — ${panel.dataset.label}`;
  const current = roll.querySelector(".counter-item:not(.is-leaving)");
  if (current && current.textContent === label) return;

  // Quitar restos de giros anteriores para que un scroll rápido nunca apile elementos.
  roll.querySelectorAll(".is-leaving").forEach((el) => el.remove());

  const next = document.createElement("span");
  next.className = `counter-item ${forward ? "is-below" : "is-above"}`;
  next.textContent = label;
  roll.appendChild(next);

  if (current) {
    current.classList.add("is-leaving", forward ? "is-above" : "is-below");
    setTimeout(() => current.remove(), 360);
  }
  // Forzar el estilo inicial antes de pasar al final.
  next.getBoundingClientRect();
  next.classList.remove("is-below", "is-above");
}

function panelAt(y) {
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i].getBoundingClientRect();
    if (r.top <= y) return i;
  }
  return 0;
}

/* ---------- Bucle de scroll (solo transform/opacity) ---------- */
let ticking = false;

function frame() {
  ticking = false;

  // Transición entre paneles
  if (!reduceMotion.matches) {
    for (let i = 0; i < panels.length - 1; i++) {
      const inner = panels[i].querySelector(".panel-inner");
      const shade = panels[i].querySelector(".shade");
      const nextTop = panels[i + 1].getBoundingClientRect().top;
      const p = Math.min(Math.max(1 - nextTop / vh, 0), 1);

      if (p <= 0 || p >= 1) {
        // Fuera de la transición: estado de reposo (o completamente cubierto).
        inner.style.transform = p >= 1 && fits[i] ? `translate3d(0, ${vh * 0.42}px, 0) scale(0.94)` : "";
        if (shade) shade.style.opacity = p >= 1 ? "0.6" : "0";
        continue;
      }

      if (fits[i]) {
        // El contenido se queda atrás (parallax) y se aleja un poco: se lee como profundidad.
        const lag = (vh - nextTop) * 0.42;
        inner.style.transform = `translate3d(0, ${lag.toFixed(1)}px, 0) scale(${(1 - p * 0.06).toFixed(4)})`;
      }
      if (shade) shade.style.opacity = (p * 0.6).toFixed(3);
    }
  }

  // Tono de la barra superior y del riel
  const topIndex = panelAt(36);
  topbar.dataset.tone = panels[topIndex].dataset.tone;
  const midIndex = panelAt(vh * 0.5);
  if (rail) rail.dataset.tone = panels[midIndex].dataset.tone;

  if (midIndex !== activeIndex) {
    const forward = midIndex > activeIndex;
    activeIndex = midIndex;
    railLinks.forEach((a, i) => (i === midIndex ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    setCounter(midIndex, forward);
  }
}

function requestFrame() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(frame);
  }
}

function resetTransforms() {
  panels.forEach((p) => {
    const inner = p.querySelector(".panel-inner");
    const shade = p.querySelector(".shade");
    inner.style.transform = "";
    if (shade) shade.style.opacity = "0";
  });
}

measure();
frame();

window.addEventListener("scroll", requestFrame, { passive: true });
window.addEventListener("resize", () => {
  measure();
  requestFrame();
});
reduceMotion.addEventListener("change", () => {
  resetTransforms();
  requestFrame();
});
if (document.fonts) document.fonts.ready.then(() => { measure(); requestFrame(); });

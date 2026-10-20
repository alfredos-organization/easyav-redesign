// Progressive enhancement only: the page works without this file.

const $ = <T extends Element>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(.2,.7,.2,1)";
const root = document.documentElement;
root.classList.add("js");
root.style.scrollBehavior = "auto"; // we animate scrolling ourselves

// smooth in-page scrolling, same feel in every browser
const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let scrolling = 0;
const scrollToY = (y: number) => {
  cancelAnimationFrame(scrolling);
  const from = scrollY, dist = y - from;
  if (still || Math.abs(dist) < 2) return scrollTo(0, y);
  const dur = Math.min(1100, Math.max(450, Math.abs(dist) * .35));
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    scrollTo(0, from + dist * easeInOut(p));
    if (p < 1) scrolling = requestAnimationFrame(step);
  };
  scrolling = requestAnimationFrame(step);
};
// a wheel or touch takes over from the animation
["wheel", "touchstart", "keydown"].forEach(e => addEventListener(e, () => cancelAnimationFrame(scrolling), { passive: true }));

$$<HTMLAnchorElement>('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
  const id = a.getAttribute("href")!.slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  const head = $<HTMLElement>(".bar")?.offsetHeight ?? 0;
  const y = el === document.body ? 0 : el.getBoundingClientRect().top + scrollY - head;
  scrollToY(Math.max(0, y));
  history.pushState(null, "", id === "top" ? location.pathname : `#${id}`);
}));

// mobile menu
const menu = $<HTMLButtonElement>(".menu");
const nav = $<HTMLElement>("#nav");
if (menu && nav) {
  const set = (open: boolean) => {
    nav.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? "Close" : "Menu";
  };
  menu.addEventListener("click", () => set(!nav.classList.contains("is-open")));
  $$<HTMLAnchorElement>("a", nav).forEach(a => a.addEventListener("click", () => set(false)));
}

// rule under the header once scrolled
const bar = $<HTMLElement>(".bar");
const onScroll = () => bar?.classList.toggle("is-stuck", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// project rows open and close with a height animation
$$<HTMLDetailsElement>(".work details").forEach(d => {
  const sum = $<HTMLElement>("summary", d)!;
  let anim: Animation | null = null;
  sum.addEventListener("click", e => {
    if (still) return;
    e.preventDefault();
    const start = d.offsetHeight;
    const opening = !d.open || d.classList.contains("is-closing");
    anim?.cancel();
    d.classList.toggle("is-closing", !opening);
    d.open = true;
    const end = opening ? d.scrollHeight : sum.offsetHeight;
    d.style.overflow = "hidden";
    anim = d.animate({ height: [`${start}px`, `${end}px`] }, { duration: 380, easing: EASE });
    if (opening) $$<HTMLElement>("p", d).forEach((p, i) =>
      p.animate({ opacity: [0, 1], transform: ["translateY(6px)", "none"] }, { duration: 380, delay: 80 + i * 60, easing: EASE, fill: "backwards" }));
    anim.onfinish = () => {
      if (!opening) d.open = false;
      d.classList.remove("is-closing");
      d.style.overflow = "";
      anim = null;
    };
  });
});

// project filters: fade out, swap, stagger back in
const filters = $$<HTMLButtonElement>(".filters button");
const projects = $$<HTMLLIElement>(".work li");
filters.forEach(btn => btn.addEventListener("click", async () => {
  const f = btn.dataset.f ?? "all";
  filters.forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  const show = (li: HTMLLIElement) => f === "all" || (li.dataset.s ?? "").split(" ").includes(f);
  if (!still) await Promise.all(projects.filter(li => !li.hidden).map(li =>
    li.animate({ opacity: [1, 0] }, { duration: 140, fill: "forwards" }).finished));
  projects.forEach(li => { li.hidden = !show(li); li.getAnimations().forEach(a => a.cancel()); });
  if (!still) projects.filter(li => !li.hidden).forEach((li, i) =>
    li.animate({ opacity: [0, 1], transform: ["translateY(12px)", "none"] }, { duration: 420, delay: i * 50, easing: EASE, fill: "backwards" }));
}));

// things flow in as they scroll into view
const groups = [
  ".hero__text > *", ".hero__img", ".facts > div", ".certs li", ".block__head",
  ".services li", ".strip figure", ".work li", ".clients", ".quote blockquote",
  ".people figure", ".spaces li", ".ids > div", ".naics tr", ".supplies",
  ".foot h2", ".foot__grid > div",
];
if (!still && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in");
    io.unobserve(en.target);
  }), { rootMargin: "0px 0px -8% 0px", threshold: .1 });
  groups.forEach(sel => $$<HTMLElement>(sel).forEach((el, i) => {
    el.dataset.reveal = "";
    el.style.setProperty("--d", String(i % 8));
    io.observe(el);
  }));
}

// click-to-copy for CAGE / DUNS / NAICS
const toast = $<HTMLElement>(".toast");
let t = 0;
const say = (msg: string) => {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("is-on");
  clearTimeout(t);
  t = window.setTimeout(() => toast.classList.remove("is-on"), 1600);
};
$$<HTMLButtonElement>(".copy").forEach(b => {
  b.title = "Copy";
  b.addEventListener("click", async () => {
    const v = b.textContent?.trim() ?? "";
    try { await navigator.clipboard.writeText(v); say(`Copied ${v}`); }
    catch { say(v); }
  });
});

const yr = $("#yr");
if (yr) yr.textContent = String(new Date().getFullYear());

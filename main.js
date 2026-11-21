/* moola — motion. No dependencies. */
(() => {
  "use strict";

  // Where "Start for $99" goes. Until this is set, the buttons scroll to the last section.
  const SIGNUP_URL = "";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- Signup links ---------- */

  const nameInput = $("[data-name-input]");
  function signupHref() {
    if (!SIGNUP_URL) return "#start";
    const name = nameInput ? nameInput.value.trim() : "";
    if (!name) return SIGNUP_URL;
    const url = new URL(SIGNUP_URL, window.location.href);
    url.searchParams.set("company", name);
    return url.toString();
  }
  const signupLinks = $$("[data-signup]");
  const syncSignup = () => signupLinks.forEach((a) => a.setAttribute("href", signupHref()));
  syncSignup();

  /* ---------- Headlines: split into words that rise ---------- */

  $$("[data-words]").forEach((el) => {
    const text = el.textContent.trim();
    if (!el.hasAttribute("aria-hidden") && !el.hasAttribute("aria-label")) {
      el.setAttribute("aria-label", text);
    }
    el.textContent = "";
    text.split(/\s+/).forEach((word, i, all) => {
      const outer = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.style.setProperty("--i", String(i));
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < all.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- Handwriting: the clip lives on an inner span so the line itself stays observable ---------- */

  $$("[data-write]").forEach((el) => {
    const inner = document.createElement("span");
    inner.className = "write";
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);
  });

  /* ---------- Reveal on scroll ---------- */

  const revealTargets = $$("[data-reveal], [data-words], [data-write]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------- The form fills in as the steps pass ---------- */

  const form = $("[data-form]");
  const formName = $("[data-form-name]");
  const steps = $$("[data-step-item]");
  let formStep = 0;

  function setFormStep(n) {
    if (!form || n <= formStep) return;
    formStep = n;
    form.dataset.step = String(n);
  }

  if (form) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setFormStep(3);
      steps.forEach((s) => s.classList.add("is-active"));
    } else {
      const stacked = window.matchMedia("(max-width: 860px)");
      // Side by side: each step writes its own line as it reaches the middle of the screen.
      const stepIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const n = Number(entry.target.dataset.stepItem);
            entry.target.classList.toggle("is-active", entry.isIntersecting);
            if (entry.isIntersecting && !stacked.matches) setFormStep(n);
          });
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
      );
      steps.forEach((s) => stepIO.observe(s));

      // Stacked: the form writes all three lines, one after another, when it comes into view.
      const formIO = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting || !stacked.matches) return;
          formIO.disconnect();
          setFormStep(1);
          window.setTimeout(() => setFormStep(2), 1000);
          window.setTimeout(() => setFormStep(3), 2300);
        },
        { threshold: 0.6 },
      );
      formIO.observe(form);
    }
  }

  if (nameInput && formName) {
    const fallback = formName.textContent;
    nameInput.addEventListener("input", () => {
      formName.textContent = nameInput.value.trim() || fallback;
      setFormStep(1);
      syncSignup();
    });
  }

  /* ---------- Nav turns into a capsule once the sky is behind you ---------- */

  const nav = $("[data-nav]");
  const hero = $(".hero");

  /* ---------- Parallax and the flight, in one frame loop ---------- */

  const main = $("[data-main]");
  const trail = $("[data-trail]");
  const plane = $("[data-plane]");
  const NS = "http://www.w3.org/2000/svg";

  const parallax = $$("[data-parallax]").map((el) => ({
    el,
    speed: Number(el.dataset.parallax),
    clampUp: el.hasAttribute("data-parallax-clamp"),
    // Measured against the section, or against the element's own (unmoved) parent.
    host: el.dataset.parallaxHost === "parent" ? el.parentElement : el.closest("section"),
  }));

  // The route, as [x, y] fractions of each section. y only ever increases, so the
  // plane can always be found at the middle of the screen.
  const ROUTES = {
    wide: {
      top: [[0.03, 0.19], [0.36, 0.17], [0.78, 0.22], [0.935, 0.5], [0.88, 0.84]],
      about: [[0.9, 0.3], [0.86, 0.74]],
      how: [[0.42, 0.0], [0.065, 0.11], [0.06, 0.5], [0.075, 0.9]],
      price: [[0.42, 0.02], [0.88, 0.2], [0.915, 0.5], [0.86, 0.88]],
      start: [[0.9, 0.22]],
    },
    narrow: {
      top: [[0.06, 0.2], [0.5, 0.17], [0.88, 0.24], [0.93, 0.5], [0.9, 0.84]],
      about: [[0.93, 0.3], [0.91, 0.78]],
      how: [[0.93, 0.06], [0.94, 0.5], [0.93, 0.94]],
      price: [[0.9, 0.1], [0.93, 0.5], [0.9, 0.86]],
      start: [[0.9, 0.2]],
    },
  };
  const END_X = { wide: 0.885, narrow: 0.9 };

  let route = null; // { path, total, lut: [{len, y}], dots: [{el, len}] }
  let shown = 0; // how many dots are lit
  let cur = 0; // smoothed distance along the path
  let angle = 0; // smoothed heading, degrees
  let planeW = 0;
  let planeH = 0;

  // Smooth curve through points (Catmull-Rom, written as cubic Béziers).
  function smoothPath(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      // Keep the curve from doubling back on itself vertically.
      c1[1] = clamp(c1[1], p1[1], p2[1]);
      c2[1] = clamp(c2[1], p1[1], p2[1]);
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function buildRoute() {
    if (!main || !trail || !plane) return;
    const W = main.clientWidth;
    const H = main.offsetHeight;
    const vh = window.innerHeight;
    const kind = W < 860 ? "narrow" : "wide";
    const spec = ROUTES[kind];

    planeW = plane.offsetWidth;
    planeH = plane.offsetHeight;
    const pad = planeW / 2 + 6;

    const pts = [];
    const zones = [];
    $$("section", main).forEach((section) => {
      zones.push({ top: section.offsetTop, zone: section.dataset.zone || "paper" });
      (spec[section.id] || []).forEach(([fx, fy]) => {
        pts.push([clamp(fx * W, pad, W - pad), section.offsetTop + fy * section.offsetHeight]);
      });
    });
    // Land in the middle of the last screen.
    const endY = H - vh * 0.5;
    while (pts.length > 2 && pts[pts.length - 1][1] > endY - 60) pts.pop();
    pts.push([clamp(END_X[kind] * W, pad, W - pad), endY]);

    trail.setAttribute("width", String(W));
    trail.setAttribute("height", String(H));
    trail.setAttribute("viewBox", `0 0 ${W} ${H}`);
    trail.textContent = "";

    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", smoothPath(pts));
    path.setAttribute("fill", "none");
    trail.appendChild(path);
    const total = path.getTotalLength();

    const zoneAt = (y) => {
      let z = zones[0].zone;
      for (const item of zones) if (y >= item.top) z = item.zone;
      return z;
    };

    const lut = [];
    const dots = [];
    const STEP = 15;
    const frag = document.createDocumentFragment();
    let maxY = -Infinity;
    for (let len = 0; len <= total; len += STEP) {
      const p = path.getPointAtLength(len);
      maxY = Math.max(maxY, p.y);
      lut.push({ len, y: maxY });
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", p.x.toFixed(1));
      dot.setAttribute("cy", p.y.toFixed(1));
      dot.setAttribute("r", kind === "narrow" ? "1.5" : "1.9");
      dot.setAttribute("class", `on-${zoneAt(p.y)}`);
      frag.appendChild(dot);
      dots.push({ el: dot, len });
    }
    trail.appendChild(frag);

    route = { path, total, lut, dots };
    shown = 0;
    cur = Math.min(cur, total);
  }

  // Distance along the path at which it reaches a given height on the page.
  function lengthAtY(y) {
    const { lut, total } = route;
    if (y <= lut[0].y) return 0;
    if (y >= lut[lut.length - 1].y) return total;
    let lo = 0;
    let hi = lut.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lut[mid].y < y) lo = mid;
      else hi = mid;
    }
    const a = lut[lo];
    const b = lut[hi];
    const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return a.len + (b.len - a.len) * t;
  }

  function lightDots() {
    const { dots } = route;
    const upTo = cur - planeH * 0.42; // the trail starts just behind the tail
    while (shown < dots.length && dots[shown].len <= upTo) {
      dots[shown].el.classList.add("is-on");
      shown++;
    }
    while (shown > 0 && dots[shown - 1].len > upTo) {
      shown--;
      dots[shown].el.classList.remove("is-on");
    }
  }

  function placePlane(time) {
    const { path, total } = route;
    const p = path.getPointAtLength(cur);
    const q = path.getPointAtLength(Math.min(total, cur + 2));
    const r = path.getPointAtLength(Math.max(0, cur - 2));
    const heading = (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI + 90;
    let delta = heading - angle;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    angle += reduceMotion ? delta : delta * 0.14;
    const bob = reduceMotion ? 0 : Math.sin(time / 900) * 3;
    const sway = reduceMotion ? 0 : Math.sin(time / 1300) * 2.2;
    plane.style.transform =
      `translate3d(${(p.x - planeW / 2).toFixed(1)}px, ${(p.y - planeH / 2 + bob).toFixed(1)}px, 0) ` +
      `rotate(${(angle + sway).toFixed(2)}deg)`;
  }

  let lastScrollY = -1;
  let settled = false;

  function frame(time) {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const moved = scrollY !== lastScrollY;
    lastScrollY = scrollY;

    if (moved) {
      if (nav && hero) nav.classList.toggle("is-solid", scrollY > hero.offsetHeight * 0.42);

      if (!reduceMotion) {
        for (const item of parallax) {
          const rect = item.host.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > vh + 200) continue;
          let y = (rect.top + rect.height / 2 - vh / 2) * item.speed;
          // Clamped layers only move on the way in, and rest once they reach the middle.
          if (item.clampUp) y = item.speed < 0 ? Math.min(0, y) : Math.max(0, y);
          item.el.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
        }
      }
    }

    if (route) {
      const target = lengthAtY(scrollY + vh * 0.5 - main.offsetTop);
      const gap = target - cur;
      if (reduceMotion) cur = target;
      else cur += gap * 0.075;
      if (Math.abs(gap) < 0.3) cur = target;
      const idle = Math.abs(gap) < 0.3;
      if (!idle || !settled || !reduceMotion) {
        placePlane(time);
        lightDots();
      }
      settled = idle;
    }

    window.requestAnimationFrame(frame);
  }

  function start() {
    buildRoute();
    if (route) {
      // Open with the plane already in the frame, at the left edge, then let it fly in.
      cur = reduceMotion ? lengthAtY(window.scrollY + window.innerHeight * 0.5) : 0;
      const p0 = route.path.getPointAtLength(cur);
      const p1 = route.path.getPointAtLength(cur + 2);
      angle = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI + 90;
      placePlane(0);
      plane.classList.add("is-ready");
    }
    window.requestAnimationFrame(frame);

    let resizeTimer = 0;
    const rebuild = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        buildRoute();
        lastScrollY = -1;
      }, 120);
    };
    if ("ResizeObserver" in window && main) new ResizeObserver(rebuild).observe(main);
    else window.addEventListener("resize", rebuild);
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();

/* ==========================================================================
   INVESTY — futuristic dotted world map (no dependencies, no network)
   Land data: simplified outlines rasterised to a hex dot grid, run-length encoded.
   Draws dots, glowing heat around markets, and animated routes from Alexandria.
   ========================================================================== */
(() => {
  const MAP = {"lon0": -130, "lat0": 74, "step": 1.6, "cols": 183, "rows": 74, "rle": "7.25.14.23.65.18.31|9.4.33.22.59.42.14|20.4.23.22.28.1.28.52.5|0.7.10.8.22.19.26.10.22.59|0.31.18.15.27.15.3.74|0.31.18.11.7.5.17.13.7.74|0.31.18.9.9.5.16.6.3.86|0.24.24.8.30.6.3.88|0.23.25.7.30.7.3.88|0.22.11.8.44.8.5.80.2.3|0.23.10.10.35.1.10.4.4.73.10.3|0.25.7.11.35.2.6.2.1.2.3.75.10.4|0.29.3.13.31.2.1.2.6.2.4.75.11.4|0.30.2.13.30.3.1.3.3.83.11.2.2|2.45.32.4.1.86.9.1.3|2.43.36.88.14|4.41.34.90.14|4.40.36.88.15|4.38.39.19.2.10.3.53.2.1.12|4.36.40.6.1.2.2.8.7.5.4.51.4.2.11|4.34.38.8.5.2.3.5.8.5.3.48.7.1.12|4.31.41.6.8.3.1.2.2.14.2.48.7.1.13|5.30.41.6.13.1.2.14.3.43.2.2.7.1.13|5.29.42.4.6.1.11.15.1.43.3.2.5.2.14|6.28.44.2.1.7.16.53.4.1.3.4.14|6.27.44.11.15.54.6.3.17|9.23.45.14.13.54.5.1.19|9.22.44.26.1.55.26|10.13.1.2.4.1.44.37.1.45.25|10.11.9.1.42.29.1.9.2.43.26|12.9.10.1.41.30.2.8.4.39.27|12.8.52.31.2.8.2.2.6.32.28|14.7.9.2.40.32.2.13.6.28.30|15.6.5.1.5.2.37.33.2.12.7.12.2.10.34|17.5.3.2.10.1.33.34.2.11.9.9.4.9.34|18.8.10.1.34.34.2.9.11.7.6.8.8.2.25|21.6.44.35.2.7.13.5.8.8.8.2.24|23.6.42.35.2.4.15.4.12.6.7.2.25|26.3.42.37.1.2.17.4.11.1.1.5.7.2.24|27.2.43.36.20.3.12.1.1.4.8.2.24|29.1.5.7.31.40.16.3.11.1.2.3.9.2.23|30.14.29.39.19.1.11.1.14.2.23|33.14.28.37.20.1.11.1.13.3.22|33.15.28.4.6.25.33.1.8.3.27|33.17.37.23.31.2.2.1.7.3.27|32.18.37.21.33.3.1.1.4.5.28|32.18.38.20.35.2.5.5.2.2.24|31.21.35.20.36.3.4.4.9.1.19|32.23.33.19.38.2.4.3.3.1.6.6.13|31.26.32.17.40.1.9.2.7.7.11|31.29.29.17.62.8.7|31.28.30.17.42.5.14.8.8|32.28.30.17.64.5.7|33.25.32.17.76|34.24.32.17.5.1.51.3.3.1.12|34.23.32.18.4.2.49.5.3.1.12|35.22.32.18.4.2.46.8.3.3.10|37.20.32.16.4.3.46.10.1.4.10|38.19.33.14.5.4.45.16.9|37.19.34.13.6.3.43.19.9|38.17.36.13.5.3.41.23.7|37.16.37.13.6.2.41.24.7|37.15.39.12.50.24.6|37.14.40.11.51.24.6|37.14.41.10.51.25.5|37.13.42.9.52.24.6|37.13.43.7.53.10.1.13.6|36.13.44.5.55.6.7.10.7|36.11.108.1.11.9.7|36.10.122.7.8|36.10.124.5.8|35.7.141|36.6.130.2.9|35.6.131.2.9"};
  const canvas = document.getElementById("world-map");
  if (!canvas || !canvas.getContext) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  const stage = canvas.parentElement;

  // Decode run-length rows -> list of dot [col,row]
  const dots = [];
  MAP.rle.split("|").forEach((row, r) => {
    let c = 0, on = false;
    row.split(".").forEach((n) => { n = +n; if (on) for (let i = 0; i < n; i++) dots.push([c + i, r]); c += n; on = !on; });
  });

  const markers = [...stage.querySelectorAll(".map-marker")].map((el) => ({
    el, id: el.dataset.node, lon: +el.dataset.lon, lat: +el.dataset.lat,
  }));
  const hq = markers.find((m) => m.id === "eg");
  const routes = markers.filter((m) => m !== hq).map((m, i) => ({ to: m, t: (i * 0.33) % 1, speed: 0.0045 + i * 0.0008 }));

  let W = 0, H = 0, cell = 0, dpr = 1, raf = 0, running = false, active = null;
  const toXY = (lon, lat) => [((lon - MAP.lon0) / MAP.step + 0.5) * cell, ((MAP.lat0 - lat) / MAP.step + 0.5) * cell];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; cell = W / MAP.cols; H = cell * MAP.rows;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const curve = (a, b) => {
    const [x1, y1] = a, [x2, y2] = b;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    return [x1, y1, (x1 + x2) / 2, Math.min(y1, y2) - dist * 0.38, x2, y2];
  };
  const pointAt = (c, t) => {
    const [x1, y1, cx, cy, x2, y2] = c, u = 1 - t;
    return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const r = Math.max(0.9, cell * 0.24);
    const mPts = markers.map((m) => ({ m, p: toXY(m.lon, m.lat) }));
    const heatR = cell * 9;

    // dots, brighter near markets
    for (const [c, row] of dots) {
      const x = (c + 0.5 + (row % 2 ? 0.5 : 0)) * cell, y = (row + 0.5) * cell;
      let heat = 0;
      for (const { m, p } of mPts) {
        const d = Math.hypot(x - p[0], y - p[1]);
        if (d < heatR) heat = Math.max(heat, (1 - d / heatR) * (active && active !== m.id ? 0.35 : 1));
      }
      if (heat > 0.05) ctx.fillStyle = `rgba(255,212,0,${0.18 + heat * 0.6})`;
      else ctx.fillStyle = "rgba(255,255,255,0.17)";
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // routes from HQ
    const a = toXY(hq.lon, hq.lat);
    for (const rt of routes) {
      const c = curve(a, toXY(rt.to.lon, rt.to.lat));
      const on = !active || active === rt.to.id || active === "eg";
      ctx.lineWidth = Math.max(1, cell * 0.12);
      ctx.setLineDash([cell * 0.5, cell * 0.45]);
      ctx.strokeStyle = on ? "rgba(125,211,252,0.55)" : "rgba(125,211,252,0.15)";
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.quadraticCurveTo(c[2], c[3], c[4], c[5]); ctx.stroke();
      ctx.setLineDash([]);
      if (!on) continue;
      // comet with tail
      const steps = 14;
      for (let i = steps; i >= 0; i--) {
        const tt = rt.t - i * 0.012;
        if (tt < 0 || tt > 1) continue;
        const [px, py] = pointAt(c, tt);
        const k = 1 - i / steps;
        ctx.fillStyle = `rgba(255,212,0,${k * 0.9})`;
        ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, cell * 0.32) * (0.4 + k * 0.6), 0, Math.PI * 2); ctx.fill();
      }
      if (rt.t > 1) continue;
      const [hx, hy] = pointAt(c, rt.t);
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, cell * 2.2);
      g.addColorStop(0, "rgba(255,212,0,0.55)"); g.addColorStop(1, "rgba(255,212,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, cell * 2.2, 0, Math.PI * 2); ctx.fill();
    }
  };

  const tick = () => {
    for (const rt of routes) { rt.t += rt.speed; if (rt.t > 1.25) rt.t = 0; }
    draw(); raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(tick); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  if (reduce) routes.forEach((rt) => (rt.t = 1));
  draw();
  let rto; window.addEventListener("resize", () => { clearTimeout(rto); rto = setTimeout(() => { resize(); draw(); }, 120); });
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(stage);
  else start();
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // Highlight a market from the node list or its marker
  const setActive = (id) => {
    active = id;
    document.querySelectorAll("[data-node]").forEach((el) => el.classList.toggle("is-active", !!id && el.dataset.node === id));
    if (!running) draw();
  };
  document.querySelectorAll(".node, .map-marker").forEach((el) => {
    el.addEventListener("pointerenter", () => setActive(el.dataset.node));
    el.addEventListener("pointerleave", () => setActive(null));
  });

  // Live local clocks
  const clocks = [...document.querySelectorAll("time[data-tz]")];
  const fmt = {};
  const updateClocks = () => clocks.forEach((t) => {
    const tz = t.dataset.tz;
    try {
      fmt[tz] = fmt[tz] || new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
      t.textContent = fmt[tz].format(new Date());
      t.dateTime = new Date().toISOString();
    } catch (e) { t.textContent = ""; }
  });
  updateClocks(); setInterval(updateClocks, 20000);
})();

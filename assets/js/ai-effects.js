/* ==========================================================================
   INVESTY — AI / tech visual effects (vanilla JS, no dependencies)
   1. Neural-network canvas behind the hero
   2. Rotating headline (typewriter)
   3. AI agent console replay
   4. Text "decode" on section labels
   5. Cursor spotlight on cards
   Everything respects prefers-reduced-motion and pauses when off-screen.
   ========================================================================== */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- 1. Neural network canvas ---------- */
  const canvas = document.getElementById("neural-bg");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, nodes = [], pulses = [], raf = 0, running = false, lastSpawn = 0;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 150;
    // Colours follow the active theme (read from CSS custom properties)
    const pal = { fg: "255,255,255", cyan: "125,211,252", gold: "255,212,0", lineA: 1, light: false };
    const readPalette = () => {
      const cs = getComputedStyle(document.documentElement);
      const fg = cs.getPropertyValue("--fg-rgb").trim().split(/\s+/).join(",") || "255,255,255";
      const cy = cs.getPropertyValue("--cyan-rgb").trim().split(/\s+/).join(",") || "125,211,252";
      pal.light = fg !== "255,255,255";
      pal.fg = fg; pal.cyan = cy; pal.gold = pal.light ? "224,168,0" : "255,212,0"; pal.lineA = pal.light ? 0.9 : 1;
    };
    readPalette();
    window.addEventListener("themechange", () => { readPalette(); if (!running) draw(); });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(90, Math.round((w * h) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.8,
        ai: Math.random() < 0.18, // a few cyan "AI" nodes
      }));
      pulses = [];
    };

    const spawnPulse = () => {
      const a = nodes[(Math.random() * nodes.length) | 0];
      let best = null, bestD = LINK;
      for (const b of nodes) {
        if (b === a) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < bestD && Math.random() < 0.5) { best = b; bestD = d; }
      }
      if (best) pulses.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.01 });
    };

    const draw = (time = 0) => {
      ctx.clearRect(0, 0, w, h);

      // move
      if (!reduce) for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }

      // links
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.strokeStyle = (a.ai || b.ai) ? `rgba(${pal.cyan},${alpha * 1.3})` : `rgba(${pal.fg},${alpha * pal.lineA})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // links to cursor
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = `rgba(${pal.gold},${(1 - md / 180) * 0.55})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      // nodes
      for (const n of nodes) {
        ctx.fillStyle = n.ai ? `rgba(${pal.cyan},0.9)` : `rgba(${pal.fg},${pal.light ? 0.4 : 0.55})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }

      // signal pulses travelling along links
      if (!reduce) {
        if (time - lastSpawn > 260 && pulses.length < 14) { spawnPulse(); lastSpawn = time; }
        pulses = pulses.filter((p) => p.t <= 1);
        for (const p of pulses) {
          p.t += p.speed;
          const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
          g.addColorStop(0, `rgba(${pal.gold},0.95)`); g.addColorStop(1, `rgba(${pal.gold},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
    const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize(); draw();
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(); }, 150); });
    if (finePointer) {
      hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
    } else start();
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  /* ---------- 2. Rotating headline ---------- */
  const rotator = document.getElementById("rotator");
  if (rotator && !reduce) {
    const words = ["your software.", "AI agents.", "mobile apps.", "SaaS products.", "smart platforms."];
    let wi = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async function cycle() {
      await sleep(2600);
      while (true) {
        const cur = words[wi];
        for (let i = cur.length; i >= 0; i--) { rotator.textContent = cur.slice(0, i); await sleep(32); }
        wi = (wi + 1) % words.length;
        const next = words[wi];
        await sleep(220);
        for (let i = 1; i <= next.length; i++) { rotator.textContent = next.slice(0, i); await sleep(62); }
        await sleep(2400);
      }
    })();
  }

  /* ---------- 3. Agent console replay ---------- */
  const promptEl = document.getElementById("console-prompt");
  const logEl = document.getElementById("console-log");
  const progEl = document.getElementById("console-progress");
  if (promptEl && logEl && !reduce) {
    const scripts = [
      { prompt: "Launch a B2B ordering platform for KSA restaurants", steps: [
        ["Mapping users, market &amp; competitors", "1.2s"],
        ["Drafting architecture <span class=\"dim\">· web · mobile · API</span>", "0.8s"],
        ["Designing UI system &amp; user flows", "2.1s"],
        ["Shipping v1.0 to production", "3.4s"],
        ["Growth loop <span class=\"dim\">· testing checkout variants</span>", "live"],
      ]},
      { prompt: "Add an Arabic & English support assistant to our app", steps: [
        ["Reading help centre &amp; order data", "0.9s"],
        ["Tuning tone of voice <span class=\"dim\">· AR · EN</span>", "1.6s"],
        ["Testing on real customer questions", "2.4s"],
        ["Deploying to app &amp; WhatsApp", "1.1s"],
        ["Monitoring answers <span class=\"dim\">· human review</span>", "live"],
      ]},
      { prompt: "Automate lead follow-up from our website to WhatsApp", steps: [
        ["Connecting website forms &amp; CRM", "0.7s"],
        ["Scoring new leads with AI", "1.3s"],
        ["Drafting personalised replies", "1.8s"],
        ["Sending via WhatsApp Business", "0.6s"],
        ["Optimising follow-up timing", "live"],
      ]},
    ];
    const icon = (id) => `<svg><use href="#${id}"/></svg>`;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let visible = true;
    const consoleEl = promptEl.closest(".console");
    if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(consoleEl);
    const waitVisible = async () => { while (!visible || document.hidden) await sleep(400); };

    const run = async (s) => {
      // reset
      promptEl.textContent = "";
      progEl.style.width = "0%";
      logEl.innerHTML = s.steps.map(([m]) => `<li class="pending"><span class="st"></span><span class="msg">${m}</span><span class="t"></span></li>`).join("");
      const items = [...logEl.children];
      // type the prompt
      for (let i = 1; i <= s.prompt.length; i++) { promptEl.textContent = s.prompt.slice(0, i); await sleep(28); }
      await sleep(450);
      // execute steps
      for (let i = 0; i < items.length; i++) {
        const li = items[i];
        const last = i === items.length - 1;
        li.className = "active"; li.querySelector(".st").innerHTML = icon("i-cycle");
        await sleep(last ? 700 : 750 + Math.random() * 600);
        if (last) { li.className = "run"; }
        else { li.className = "done"; li.querySelector(".st").innerHTML = icon("i-check"); }
        li.querySelector(".t").textContent = s.steps[i][1];
        progEl.style.width = `${((i + 1) / items.length) * 100}%`;
      }
    };

    (async () => {
      let si = 1; // the first script is already rendered statically
      await sleep(5000);
      while (true) {
        await waitVisible();
        await run(scripts[si]);
        si = (si + 1) % scripts.length;
        await sleep(5200);
      }
    })();
  }

  /* ---------- 4. Decode effect on section labels ---------- */
  const scrambleEls = document.querySelectorAll("[data-scramble]");
  if (!reduce && "IntersectionObserver" in window) {
    const glyphs = "01<>/_#$%&*+=?";
    const decode = (el) => {
      const final = el.textContent;
      const total = 18;
      let frame = 0;
      const tick = () => {
        frame++;
        const reveal = Math.floor((frame / total) * final.length);
        el.textContent = final.split("").map((c, i) => (i < reveal || c === " " ? c : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        if (frame < total) requestAnimationFrame(() => setTimeout(tick, 28));
        else el.textContent = final;
      };
      tick();
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { decode(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.8 });
    scrambleEls.forEach((el) => io.observe(el));
  }

  /* ---------- 5. Cursor spotlight on cards ---------- */
  if (finePointer) {
    document.querySelectorAll(".card, .diff-item").forEach((el) => el.classList.add("spotlight"));
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }
})();

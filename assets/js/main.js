/* ==========================================================================
   INVESTY — site interactions (vanilla JS, no dependencies)
   ========================================================================== */

/* ---------------------------------------------------------------------------
   CONFIG — edit these before going live
   ---------------------------------------------------------------------------
   FORM_ENDPOINT: where the contact form POSTs (JSON). Works with Formspree,
   Getform, Basin, a Netlify/Vercel function, or your own API.
     e.g. "https://formspree.io/f/xxxxxxx"
   If left empty, the form falls back to opening WhatsApp with the message
   pre-filled, so leads are never lost.

   BOOKING_URL: optional Calendly / Cal.com link. If set, every
   "Book a strategy call" button opens it instead of scrolling to the form.
--------------------------------------------------------------------------- */
const CONFIG = {
  FORM_ENDPOINT: "https://formspree.io/f/meaarkeb",
  BOOKING_URL: "",
  WHATSAPP_NUMBER: "201113062879",
};

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Booking link override ---------- */
  if (CONFIG.BOOKING_URL) {
    document.querySelectorAll('a[data-cta][href="#contact"]').forEach((a) => {
      a.href = CONFIG.BOOKING_URL;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  /* ---------- Navbar: solid on scroll ---------- */
  const nav = document.getElementById("nav");
  const mobileCta = document.getElementById("mobile-cta");
  const hero = document.getElementById("top");
  const contact = document.getElementById("contact");
  let contactInView = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 12);

    if (mobileCta && hero) {
      const show = y > hero.offsetHeight * 0.75 && !contactInView;
      mobileCta.classList.toggle("is-visible", show);
      mobileCta.setAttribute("aria-hidden", String(!show));
      mobileCta.querySelectorAll("a").forEach((a) => (a.tabIndex = show ? 0 : -1));
    }
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  // Hide the sticky mobile bar while the contact form is on screen
  if (contact && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { contactInView = entry.isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(contact);
  }
  onScroll();

  /* ---------- Active nav link ---------- */
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => {
            const active = a.getAttribute("href") === "#" + entry.target.id;
            a.classList.toggle("is-active", active);
            if (active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const menu = document.getElementById("mobile-menu");
  const toggle = document.getElementById("nav-toggle");
  const closeBtn = document.getElementById("menu-close");

  const openMenu = () => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add("is-open"));
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  };
  const closeMenu = (returnFocus = true) => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(() => { menu.hidden = true; }, prefersReducedMotion ? 0 : 240);
    if (returnFocus) toggle.focus();
  };
  toggle?.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", () => closeMenu());
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => closeMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && !menu.hidden) closeMenu();
    // simple focus trap
    if (e.key === "Tab" && menu && !menu.hidden) {
      const f = menu.querySelectorAll("a, button");
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        const dur = 1200;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = "0";
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => countIO.observe(c));
  }

  /* ---------- FAQ: keep one item open at a time ---------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((other) => { if (other !== item) other.open = false; });
    });
  });

  /* ---------- Contact form ---------- */
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const submitBtn = document.getElementById("form-submit");
  const label = submitBtn.querySelector(".btn-label");

  const validators = {
    name: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    message: (v) => v.trim().length >= 10,
  };

  const validateField = (input) => {
    const check = validators[input.name];
    if (!check) return true;
    const ok = check(input.value);
    input.closest(".field").classList.toggle("has-error", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  };

  // Validate on blur, then live once a field has shown an error
  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => { if (input.value) validateField(input); });
    input.addEventListener("input", () => { if (input.closest(".field").classList.contains("has-error")) validateField(input); });
  });

  const setStatus = (type, msg) => {
    status.className = "form-status " + (type ? "is-" + type : "");
    status.textContent = msg;
  };

  const setLoading = (loading) => {
    submitBtn.setAttribute("aria-busy", String(loading));
    submitBtn.disabled = loading;
    label.textContent = loading ? "Sending…" : "Send message";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    const invalid = Object.keys(validators).map((n) => form.elements[n]).filter((i) => !validateField(i));
    if (invalid.length) {
      invalid[0].focus();
      setStatus("error", `Please fix ${invalid.length === 1 ? "the highlighted field" : "the " + invalid.length + " highlighted fields"} and try again.`);
      return;
    }
    if (form.elements.website.value) return; // honeypot tripped — silently ignore

    const data = Object.fromEntries(new FormData(form));
    delete data.website;

    // Fallback: no endpoint configured → hand the lead to WhatsApp
    if (!CONFIG.FORM_ENDPOINT) {
      const text = [
        "Hi Investy, I'd like to discuss a project.",
        "",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.company ? `Company: ${data.company}` : "",
        data.budget ? `Budget: ${data.budget}` : "",
        "",
        data.message,
      ].filter((l, i, arr) => l !== "" || arr[i - 1] !== "").join("\n");
      window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      setStatus("success", "Opening WhatsApp with your message — just press send and we'll reply shortly.");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      // "netlify" → Netlify Forms (submissions show in the Netlify dashboard → Forms)
      const isNetlify = CONFIG.FORM_ENDPOINT === "netlify";
      const res = await fetch(isNetlify ? "/" : CONFIG.FORM_ENDPOINT, {
        method: "POST",
        headers: isNetlify
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : { "Content-Type": "application/json", Accept: "application/json" },
        body: isNetlify ? new URLSearchParams({ "form-name": "contact", ...data }).toString() : JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("Request failed: " + res.status);
      form.reset();
      setStatus("success", "Thanks! Your message is in. We'll reply within one business day to book your strategy call.");
      status.focus();
    } catch (err) {
      setStatus("error", "Something went wrong sending your message. Please try again, or reach us on WhatsApp at +20 111 306 2879.");
    } finally {
      setLoading(false);
    }
  });
})();

/* ---------- Theme toggle (light / dark) ---------- */
(() => {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const current = () => root.getAttribute("data-theme") || (mq.matches ? "light" : "dark");
  const sync = () => {
    const next = current() === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
    btn.title = `Switch to ${next} mode`;
  };
  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("investy-theme", next); } catch (e) {}
    setTimeout(() => root.classList.remove("theme-anim"), 350);
    sync();
    window.dispatchEvent(new Event("themechange"));
  });
  mq.addEventListener?.("change", () => { sync(); window.dispatchEvent(new Event("themechange")); });
  new MutationObserver(() => { sync(); window.dispatchEvent(new Event("themechange")); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  sync();
})();

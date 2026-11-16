/* ==========================================================================
   Modern Design Studio — behaviour
   Header, mobile menu, scroll reveal, slideshows, work filters.
   ========================================================================== */

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");

  /* ---- Site details (assets/js/site.js) --------------------------------- */

  const site = window.SITE || {};

  const fill = {
    email(el) {
      if (!site.email) return;
      el.textContent = site.email;
      if (el.tagName === "A") el.href = "mailto:" + site.email;
    },
    phone(el) {
      if (!site.phone) return;
      el.textContent = site.phone;
      if (el.tagName === "A") el.href = "tel:" + site.phone.replace(/[^\d+]/g, "");
    },
    address(el) {
      const lines = (site.address || []).filter(Boolean);
      if (!lines.length) return;
      el.textContent = "";
      lines.forEach((line, i) => {
        if (i) el.append(document.createElement("br"));
        el.append(line);
      });
    },
    hours(el) {
      if (site.hours) el.textContent = site.hours;
    },
    social(el) {
      const links = (site.social || []).filter((s) => s && s.label && s.url);
      if (!links.length) return;
      el.textContent = "";
      links.forEach(({ label, url }) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = url;
        a.textContent = label;
        a.target = "_blank";
        a.rel = "noopener";
        li.append(a);
        el.append(li);
      });
    }
  };

  $$("[data-site]").forEach((el) => {
    const fn = fill[el.dataset.site];
    if (fn) fn(el);
  });

  $$("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Header ----------------------------------------------------------- */

  const header = $("[data-header]");
  const hero = $("[data-hero]");
  let lastY = window.scrollY;
  let ticking = false;

  const updateHeader = () => {
    ticking = false;
    if (!header) return;
    const y = Math.max(0, window.scrollY);
    const solidAfter = hero ? hero.offsetHeight - header.offsetHeight : 8;
    const delta = y - lastY;

    header.classList.toggle("is-solid", y > solidAfter);

    if (Math.abs(delta) > 6) {
      const hide = delta > 0 && y > solidAfter + 240;
      header.classList.toggle("is-hidden", hide && !header.classList.contains("is-menu"));
      lastY = y;
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeader);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", updateHeader);
  updateHeader();

  /* ---- Mobile menu ------------------------------------------------------ */

  const menu = $("[data-menu]");
  const toggle = $("[data-menu-toggle]");

  if (menu && toggle) {
    const label = $("[data-menu-label]", toggle);

    const setMenu = (open) => {
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      header.classList.toggle("is-menu", open);
      header.classList.remove("is-hidden");
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (label) label.textContent = open ? "Close" : "Menu";
    };

    toggle.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 56.0625rem)").addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ---- Scroll reveal ---------------------------------------------------- */

  const revealEls = $$("[data-reveal]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---- Slideshows (home hero + project viewer) --------------------------
     <section data-slideshow data-autoplay="6500" data-keys>
       <div data-slide class="is-active">…</div>
       <div data-slide>…</div>
       <button data-slide-prev>…  <button data-slide-next>…
       <span data-slide-current>  <span data-slide-total>  <i data-slide-progress>
     ----------------------------------------------------------------------- */

  $$("[data-slideshow]").forEach((root) => {
    const slides = $$("[data-slide]", root);
    if (!slides.length) return;

    const current = $$("[data-slide-current]", root);
    const total = $$("[data-slide-total]", root);
    const progress = $("[data-slide-progress]", root);
    const delay = reduceMotion ? 0 : Number(root.dataset.autoplay) || 0;
    let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
    let timer = 0;

    total.forEach((el) => (el.textContent = pad(slides.length)));

    const schedule = () => {
      window.clearTimeout(timer);
      if (progress) progress.style.animation = "none";
      if (!delay || slides.length < 2 || document.hidden) return;
      if (progress) {
        void progress.offsetWidth; // restart the animation
        progress.style.animation = `progress ${delay}ms linear forwards`;
      }
      timer = window.setTimeout(() => show(index + 1), delay);
    };

    const show = (n) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", String(i !== index));
      });
      current.forEach((el) => (el.textContent = pad(index + 1)));
      schedule();
    };

    $$("[data-slide-prev]", root).forEach((b) => b.addEventListener("click", () => show(index - 1)));
    $$("[data-slide-next]", root).forEach((b) => b.addEventListener("click", () => show(index + 1)));

    if (root.hasAttribute("data-keys")) {
      document.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
        const rect = root.getBoundingClientRect();
        if (rect.bottom < window.innerHeight * 0.4 || rect.top > window.innerHeight * 0.6) return;
        show(index + (e.key === "ArrowRight" ? 1 : -1));
      });
    }

    // Swipe
    let startX = null;
    root.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    root.addEventListener(
      "touchend",
      (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", schedule);
    show(index);
  });

  /* ---- Work index: filters + grid / index view ---------------------------
     Filters are built automatically from each card's data-category value.
     ----------------------------------------------------------------------- */

  const projects = $("[data-projects]");

  if (projects) {
    const cards = $$(".card", projects);
    const filter = $("[data-filter]");
    const viewButtons = $$("[data-view-btn]");

    const transition = (fn) => {
      if (document.startViewTransition && !reduceMotion) document.startViewTransition(fn);
      else fn();
    };

    const categories = [];
    cards.forEach((card) => {
      const c = (card.dataset.category || "").trim();
      if (c && !categories.includes(c)) categories.push(c);
    });

    if (filter && categories.length) {
      const chip = (text, value) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = text;
        b.dataset.value = value;
        b.setAttribute("aria-pressed", String(value === ""));
        return b;
      };
      filter.append(chip("All", ""), ...categories.map((c) => chip(c, c)));

      filter.addEventListener("click", (e) => {
        const b = e.target.closest(".chip");
        if (!b || b.getAttribute("aria-pressed") === "true") return;
        const value = b.dataset.value;
        transition(() => {
          $$(".chip", filter).forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
          cards.forEach((card) => {
            card.hidden = Boolean(value) && (card.dataset.category || "").trim() !== value;
            card.classList.add("is-in");
          });
        });
      });
    }

    const setView = (view) => {
      projects.dataset.view = view;
      viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewBtn === view)));
      try {
        sessionStorage.setItem("mds-view", view);
      } catch (err) {
        /* storage unavailable — the choice simply isn't remembered */
      }
    };

    viewButtons.forEach((b) =>
      b.addEventListener("click", () => {
        if (b.getAttribute("aria-pressed") === "true") return;
        transition(() => {
          setView(b.dataset.viewBtn);
          cards.forEach((card) => card.classList.add("is-in"));
        });
      })
    );

    let saved = null;
    try {
      saved = sessionStorage.getItem("mds-view");
    } catch (err) {
      saved = null;
    }
    setView(saved === "list" ? "list" : "grid");
  }

  /* ---- Contact form ------------------------------------------------------
     The form needs somewhere to send to. Until its action="" is set to a real
     endpoint, submitting does nothing.
     ----------------------------------------------------------------------- */

  $$("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      const action = (form.getAttribute("action") || "").trim();
      if (!action || action === "#") {
        e.preventDefault();
        console.warn("Contact form: set the form's action attribute to a form endpoint.");
      }
    });
  });
})();

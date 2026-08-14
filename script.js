/* =========================================================
   AMW — interactions & animations
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------------
     Preloader
  --------------------------------------------------------- */
  function initPreloader() {
    const pre = $("#preloader");
    if (!pre) return;
    const bar = $(".preloader__bar span", pre);
    const count = $("#preloaderCount");
    let p = 0;

    const finish = () => {
      pre.classList.add("is-done");
      document.body.classList.remove("is-loading");
      startHeroReveal();
    };

    if (prefersReduced) {
      if (bar) bar.style.width = "100%";
      if (count) count.textContent = "100%";
      setTimeout(finish, 200);
      return;
    }

    const tick = setInterval(() => {
      p += Math.random() * 16 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(tick);
        setTimeout(finish, 350);
      }
      if (bar) bar.style.width = p + "%";
      if (count) count.textContent = Math.floor(p) + "%";
    }, 130);
  }

  /* ---------------------------------------------------------
     Hero intro reveal (after preloader)
  --------------------------------------------------------- */
  function startHeroReveal() {
    const title = $(".hero__title");
    if (title) title.classList.add("is-visible");
    $$(".hero [data-reveal]").forEach((el, i) => {
      setTimeout(() => el.classList.add("is-visible"), 180 + i * 90);
    });
  }

  /* ---------------------------------------------------------
     Custom cursor + magnetic
  --------------------------------------------------------- */
  function initCursor() {
    if (window.matchMedia("(hover: none)").matches || prefersReduced) return;
    const cursor = $("#cursor");
    const dot = $("#cursorDot");
    if (!cursor || !dot) return;

    document.body.classList.add("cursor-ready");

    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    let cx = mx,
      cy = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverables = "a, button, [data-magnetic], summary, input, textarea, select, .card, .result";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ---------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------- */
  function initMagnetic() {
    if (window.matchMedia("(hover: none)").matches || prefersReduced) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = 24;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${(x / r.width) * strength}px, ${
          (y / r.height) * strength
        }px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     Header scroll + scroll progress
  --------------------------------------------------------- */
  function initScrollUI() {
    const header = $("#header");
    const progress = $("#scrollProgress");
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle("is-scrolled", y > 30);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     Mobile menu
  --------------------------------------------------------- */
  function initMobileMenu() {
    const burger = $("#burger");
    const menu = $("#mobileMenu");
    if (!burger || !menu) return;
    const toggle = (open) => {
      const isOpen =
        open ?? !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", isOpen);
      burger.classList.toggle("is-open", isOpen);
      burger.setAttribute("aria-expanded", String(isOpen));
      menu.setAttribute("aria-hidden", String(!isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle());
    $$(".mobile-menu__link, .mobile-menu__cta", menu).forEach((l) =>
      l.addEventListener("click", () => toggle(false))
    );
  }

  /* ---------------------------------------------------------
     Reveal on scroll (IntersectionObserver)
  --------------------------------------------------------- */
  function initReveal() {
    const items = $$("[data-reveal]").filter(
      (el) => !el.closest(".hero")
    );

    // stagger index for grids
    [".cards", ".results", ".quotes", ".steps", ".gallery", ".reels"].forEach((sel) => {
      const grid = $(sel);
      if (grid) {
        grid.classList.add("is-stagger");
        $$("[data-reveal]", grid).forEach((c, i) =>
          c.style.setProperty("--i", i)
        );
      }
    });

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      $$(".result").forEach((r) => r.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));

    // result bars use their own visibility class
    const barIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    $$(".result").forEach((r) => barIO.observe(r));
  }

  /* ---------------------------------------------------------
     Count-up numbers
  --------------------------------------------------------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();

    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const frame = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const val = target * ease(t);
      el.textContent =
        prefix +
        val.toLocaleString("de-DE", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;
      if (t < 1) requestAnimationFrame(frame);
      else
        el.textContent =
          prefix +
          target.toLocaleString("de-DE", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) +
          suffix;
    };
    requestAnimationFrame(frame);
  }

  function initCounters() {
    const nums = $$("[data-count]");
    if (prefersReduced || !("IntersectionObserver" in window)) {
      nums.forEach((el) => {
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        el.textContent =
          (el.dataset.prefix || "") +
          parseFloat(el.dataset.count).toLocaleString("de-DE", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) +
          (el.dataset.suffix || "");
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     Process line progress
  --------------------------------------------------------- */
  function initStepsLine() {
    const line = $("#stepsProgress");
    if (!line) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      line.style.width = "100%";
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            line.style.width = "100%";
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(line.closest(".steps"));
  }

  /* ---------------------------------------------------------
     Card cursor glow + tilt
  --------------------------------------------------------- */
  function initCardFX() {
    if (window.matchMedia("(hover: none)").matches || prefersReduced) return;

    $$(".card").forEach((card) => {
      const glow = $(".card__glow", card);
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        if (glow) {
          glow.style.setProperty("--mx", e.clientX - r.left + "px");
          glow.style.setProperty("--my", e.clientY - r.top + "px");
        }
      });
    });

    $$("[data-tilt]").forEach((el) => {
      const max = 8;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${
          -py * max
        }deg) rotateY(${px * max}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     Parallax orbs on scroll
  --------------------------------------------------------- */
  function initParallax() {
    if (prefersReduced) return;
    const orbs = $$(".orb");
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          orbs.forEach((orb, i) => {
            const speed = (i + 1) * 0.04;
            orb.style.marginTop = -(y * speed) + "px";
          });
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------
     Contact form (no backend — graceful UX)
  --------------------------------------------------------- */
  function initForm() {
    const form = $("#contactForm");
    if (!form) return;
    const success = $("#formSuccess");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const btn = $(".form__submit", form);
      if (btn) {
        btn.querySelector("span").textContent = "Wird gesendet…";
        btn.disabled = true;
      }
      setTimeout(() => {
        if (success) success.hidden = false;
        form.reset();
        if (btn) {
          btn.querySelector("span").textContent = "Erstgespräch anfragen";
          btn.disabled = false;
        }
      }, 900);
    });
  }

  /* ---------------------------------------------------------
     Smooth anchor + active nav
  --------------------------------------------------------- */
  function initNavActive() {
    const links = $$(".nav__link");
    const map = new Map();
    links.forEach((l) => {
      const id = l.getAttribute("href");
      if (id && id.startsWith("#")) {
        const sec = $(id);
        if (sec) map.set(sec, l);
      }
    });
    if (!map.size || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const link = map.get(e.target);
          if (link && e.isIntersecting) {
            links.forEach((l) => l.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        });
      },
      { threshold: 0.5 }
    );
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ---------------------------------------------------------
     Gallery lightbox
  --------------------------------------------------------- */
  function initLightbox() {
    const lb = $("#lightbox");
    const tiles = $$(".tile");
    if (!lb || !tiles.length) return;
    const imgEl = $("#lbImg");
    const counter = $("#lbCounter");
    const sources = tiles.map((t) => t.querySelector("img").getAttribute("src"));
    let idx = 0;

    const render = () => {
      imgEl.setAttribute("src", sources[idx]);
      if (counter) counter.textContent = idx + 1 + " / " + sources.length;
    };
    const open = (i) => {
      idx = i;
      render();
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const step = (d) => {
      idx = (idx + d + sources.length) % sources.length;
      render();
    };

    tiles.forEach((t) =>
      t.addEventListener("click", () =>
        open(parseInt(t.dataset.lightbox || "0", 10))
      )
    );
    $("#lbClose").addEventListener("click", close);
    $("#lbPrev").addEventListener("click", () => step(-1));
    $("#lbNext").addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------------------------------------------------------
     Video modal (Showreel)
  --------------------------------------------------------- */
  function initVideoModal() {
    const vm = $("#videoModal");
    const reels = $$(".reel");
    if (!vm || !reels.length) return;
    const stage = $("#vmStage");

    const close = () => {
      vm.classList.remove("is-open");
      vm.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      stage.innerHTML = "";
    };
    const open = (reel) => {
      const src = reel.dataset.videoSrc;
      const poster = reel.querySelector("img").getAttribute("src");
      if (src) {
        stage.innerHTML =
          '<video src="' +
          src +
          '" autoplay loop controls playsinline></video>';
      } else {
        // Placeholder: the animated SVG poster keeps playing enlarged
        stage.innerHTML = '<img src="' + poster + '" alt="" />';
      }
      vm.classList.add("is-open");
      vm.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    reels.forEach((r) => r.addEventListener("click", () => open(r)));
    $("#vmClose").addEventListener("click", close);
    vm.addEventListener("click", (e) => {
      if (e.target === vm) close();
    });
    document.addEventListener("keydown", (e) => {
      if (vm.classList.contains("is-open") && e.key === "Escape") close();
    });
  }

  /* ---------------------------------------------------------
     Misc
  --------------------------------------------------------- */
  function initMisc() {
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  document.body.classList.add("is-loading");
  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initCursor();
    initMagnetic();
    initScrollUI();
    initMobileMenu();
    initReveal();
    initCounters();
    initStepsLine();
    initCardFX();
    initParallax();
    initForm();
    initNavActive();
    initLightbox();
    initVideoModal();
    initMisc();
  });

  // Fallback: if load stalls, force-reveal
  window.addEventListener("load", () => {
    setTimeout(() => {
      const pre = $("#preloader");
      if (pre && !pre.classList.contains("is-done")) {
        pre.classList.add("is-done");
        document.body.classList.remove("is-loading");
        startHeroReveal();
      }
    }, 2600);
  });
})();

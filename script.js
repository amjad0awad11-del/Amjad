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
     Showreel — professional canvas motion engine
     4 renderers: 0 liquid gradient · 1 particle network
     · 2 flowing ribbons · 3 drifting bokeh
  --------------------------------------------------------- */
  var SR_PAL = {
    v: [168, 85, 247], c: [34, 211, 238], p: [236, 72, 153],
    b: [99, 102, 241], i: [124, 58, 237],
  };
  var SR_HUES = [
    [SR_PAL.v, SR_PAL.c, SR_PAL.b],
    [SR_PAL.c, SR_PAL.b, SR_PAL.v],
    [SR_PAL.p, SR_PAL.v, SR_PAL.i],
    [SR_PAL.b, SR_PAL.c, SR_PAL.v],
  ];
  function srRgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function createAnim(canvas, kind, hues) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var w = 0, h = 0, parts = [], raf = null, running = false;
    var t = Math.random() * 100;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    function seed() {
      parts = [];
      if (kind === 1) {
        var n = Math.round(Math.min(70, Math.max(22, w / 11)));
        for (var i = 0; i < n; i++)
          parts.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
          });
      } else if (kind === 3) {
        var m = Math.round(Math.min(26, Math.max(12, w / 30)));
        for (var j = 0; j < m; j++)
          parts.push({
            x: Math.random() * w, y: Math.random() * h,
            r: 10 + Math.random() * 46, s: 0.15 + Math.random() * 0.5,
            col: hues[j % hues.length], a: 0.12 + Math.random() * 0.18,
          });
      }
    }
    function bg() {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0a0b16"); g.addColorStop(1, "#05060c");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function vignette() {
      ctx.globalCompositeOperation = "source-over";
      var g = ctx.createRadialGradient(
        w / 2, h * 0.45, Math.min(w, h) * 0.2,
        w / 2, h * 0.5, Math.max(w, h) * 0.78
      );
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function draw() {
      bg();
      var i, col;
      if (kind === 0) {
        ctx.globalCompositeOperation = "lighter";
        var blobs = [[0.32, 0.4], [0.68, 0.6], [0.5, 0.32]];
        for (i = 0; i < blobs.length; i++) {
          col = hues[i % hues.length];
          var cx = w * (blobs[i][0] + 0.15 * Math.sin(t * 0.5 + i * 2.1));
          var cy = h * (blobs[i][1] + 0.18 * Math.cos(t * 0.42 + i * 1.3));
          var R = Math.min(w, h) * (0.62 + 0.08 * Math.sin(t * 0.6 + i));
          var g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
          g0.addColorStop(0, srRgba(col, 0.5));
          g0.addColorStop(0.45, srRgba(col, 0.12));
          g0.addColorStop(1, srRgba(col, 0));
          ctx.fillStyle = g0;
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        }
      } else if (kind === 1) {
        for (i = 0; i < parts.length; i++) {
          var q = parts[i]; q.x += q.vx; q.y += q.vy;
          if (q.x < 0) q.x += w; if (q.x > w) q.x -= w;
          if (q.y < 0) q.y += h; if (q.y > h) q.y -= h;
        }
        ctx.globalCompositeOperation = "lighter";
        var D = Math.min(w, h) * 0.3;
        for (var a = 0; a < parts.length; a++) {
          for (var bb = a + 1; bb < parts.length; bb++) {
            var dx = parts[a].x - parts[bb].x, dy = parts[a].y - parts[bb].y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < D) {
              ctx.strokeStyle = srRgba(hues[0], (1 - dist / D) * 0.22);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(parts[a].x, parts[a].y);
              ctx.lineTo(parts[bb].x, parts[bb].y);
              ctx.stroke();
            }
          }
        }
        for (var d = 0; d < parts.length; d++) {
          col = hues[d % hues.length];
          ctx.fillStyle = srRgba(col, 0.9);
          ctx.shadowColor = srRgba(col, 0.9); ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(parts[d].x, parts[d].y, 1.6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (kind === 2) {
        ctx.globalCompositeOperation = "lighter";
        for (var wv = 0; wv < 3; wv++) {
          col = hues[wv % hues.length];
          var base = h * (0.4 + wv * 0.12);
          var amp = h * (0.12 + wv * 0.03);
          var grad = ctx.createLinearGradient(0, 0, w, 0);
          grad.addColorStop(0, srRgba(col, 0));
          grad.addColorStop(0.5, srRgba(col, 0.7));
          grad.addColorStop(1, srRgba(col, 0));
          ctx.strokeStyle = grad; ctx.lineWidth = 2;
          ctx.shadowColor = srRgba(col, 0.7); ctx.shadowBlur = 12;
          ctx.beginPath();
          for (var x = 0; x <= w; x += 6) {
            var y = base + Math.sin(x * 0.012 + t * (1.1 + wv * 0.4) + wv * 2) *
              amp * Math.sin(t * 0.3 + wv);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.globalCompositeOperation = "lighter";
        for (var k = 0; k < parts.length; k++) {
          var o = parts[k]; o.y -= o.s;
          if (o.y + o.r < 0) { o.y = h + o.r; o.x = Math.random() * w; }
          var g3 = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
          g3.addColorStop(0, srRgba(o.col, o.a));
          g3.addColorStop(1, srRgba(o.col, 0));
          ctx.fillStyle = g3;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      vignette();
    }
    function frame() { t += 0.016; draw(); raf = requestAnimationFrame(frame); }

    return {
      start: function () {
        if (running) return;
        running = true;
        if (!w) resize();
        if (prefersReduced) { draw(); return; }
        raf = requestAnimationFrame(frame);
      },
      stop: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      resize: resize,
      drawOnce: function () { if (!w) resize(); draw(); },
    };
  }

  function initShowreelAnims() {
    var canvases = $$(".reel__canvas");
    if (!canvases.length) return;
    var runners = canvases.map(function (cv) {
      var reel = cv.closest(".reel");
      var kind = parseInt(reel.dataset.anim || "0", 10);
      return createAnim(cv, kind, SR_HUES[kind % SR_HUES.length]);
    });

    if (prefersReduced) {
      runners.forEach(function (r) { r.drawOnce(); });
      return;
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            var idx = canvases.indexOf(e.target);
            if (idx < 0) return;
            if (e.isIntersecting) runners[idx].start();
            else runners[idx].stop();
          });
        },
        { threshold: 0.2 }
      );
      canvases.forEach(function (cv) { io.observe(cv); });
    } else {
      runners.forEach(function (r) { r.start(); });
    }
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        runners.forEach(function (r) { r.resize(); });
      }, 200);
    });
  }

  /* ---------------------------------------------------------
     Showreel reel previews — muted, looping clips that play
     while in view and pause when scrolled away
  --------------------------------------------------------- */
  function initReelVideos() {
    var vids = $$(".reel__video");
    if (!vids.length) return;
    if (prefersReduced) return; // keep the static first frame
    var play = function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) play(e.target);
            else e.target.pause();
          });
        },
        { threshold: 0.25 }
      );
      vids.forEach(function (v) { io.observe(v); });
    } else {
      vids.forEach(play);
    }
  }

  /* ---------------------------------------------------------
     Video modal (Showreel) — plays a real clip if provided,
     otherwise shows the enlarged live animation
  --------------------------------------------------------- */
  function initVideoModal() {
    const vm = $("#videoModal");
    const reels = $$(".reel");
    if (!vm || !reels.length) return;
    const stage = $("#vmStage");
    let modalRunner = null;

    const close = () => {
      vm.classList.remove("is-open");
      vm.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (modalRunner) { modalRunner.stop(); modalRunner = null; }
      stage.innerHTML = "";
    };
    const open = (reel) => {
      const src = reel.dataset.videoSrc;
      if (src) {
        stage.innerHTML =
          '<video src="' + src + '" autoplay loop controls playsinline></video>';
      } else {
        const kind = parseInt(reel.dataset.anim || "0", 10);
        const cv = document.createElement("canvas");
        stage.innerHTML = "";
        stage.appendChild(cv);
        modalRunner = createAnim(cv, kind, SR_HUES[kind % SR_HUES.length]);
        requestAnimationFrame(() => modalRunner && modalRunner.start());
        setTimeout(() => modalRunner && modalRunner.resize(), 440);
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
    initShowreelAnims();
    initReelVideos();
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

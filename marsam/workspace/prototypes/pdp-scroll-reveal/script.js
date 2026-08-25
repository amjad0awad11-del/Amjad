/* ============================================================
   MARSAM PROTOTYPE — pdp-scroll-reveal
   All content is already visible in the base CSS (no-JS fallback:
   opacity 1, no transform, no collapsed boxes). This script only
   ever HIDES something immediately before it can also animate it
   back in, on the branch that will actually run that animation.
   That ordering is what keeps CLS at zero and keeps the page
   readable if GSAP fails to load from the CDN.
   ============================================================ */

(function () {
  "use strict";

  var prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var debug = new URLSearchParams(location.search).has("debug");
  var fpsBadge = document.getElementById("fpsBadge");

  if (debug) {
    fpsBadge.hidden = false;
    startFpsCounter(fpsBadge);
  }

  if (prefersReduced) {
    document.body.classList.add("no-motion");
    initReducedMotion();
  } else if (window.gsap && window.ScrollTrigger) {
    initFullMotion();
  } else {
    // GSAP failed to load (offline / CDN blocked). Content is already
    // visible via base CSS — nothing further to do. Log for whoever
    // is checking the console during the prototype review.
    console.warn(
      "[marsam] GSAP/ScrollTrigger did not load — showing static fallback."
    );
  }

  // ------------------------------------------------------------
  // FULL MOTION — everyone without a reduced-motion preference
  // ------------------------------------------------------------
  function initFullMotion() {
    gsap.registerPlugin(ScrollTrigger);

    // ---- Hero: one-time load-in stagger. Not scroll-driven. ----
    var heroEls = gsap.utils.toArray(".hero-title, .hero-sub, .hero-cta");
    gsap.set(heroEls, { opacity: 0, y: 16 });
    gsap.to(".hero-title", {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.1,
    });
    gsap.to(".hero-sub", {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.25,
    });
    gsap.to(".hero-cta", {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.4,
    });

    // ---- Pinned product reveal ----
    var pinTarget = document.querySelector(".reveal-pin");
    var visual = document.querySelector(".product-visual");
    var callouts = gsap.utils.toArray(".callout");

    gsap.set(visual, { opacity: 0, scale: 0.94 });
    gsap.set(callouts, { opacity: 0, y: 12 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#reveal",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        pin: pinTarget,
        anticipatePin: 1,
        // will-change on the pinned scroll region only, removed the
        // moment it leaves view in either direction — a permanent
        // will-change on 5 elements for the whole page life is the
        // kind of thing that costs more than it buys.
        onEnter: function () {
          setWillChange([visual].concat(callouts), true);
        },
        onEnterBack: function () {
          setWillChange([visual].concat(callouts), true);
        },
        onLeave: function () {
          setWillChange([visual].concat(callouts), false);
        },
        onLeaveBack: function () {
          setWillChange([visual].concat(callouts), false);
        },
      },
    });

    tl.to(visual, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0);

    // Each callout gets its own slice of scroll — one detail noticed
    // at a time, not four things competing for attention at once.
    callouts.forEach(function (el, i) {
      tl.to(
        el,
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        0.6 + i * 0.5
      );
    });

    // small hold at the end so the last callout is readable before
    // the section releases the pin
    tl.to({}, { duration: 0.3 });

    // ---- Related products grid: one-shot stagger on first view ----
    var cards = gsap.utils.toArray(".product-card");
    gsap.set(cards, { opacity: 0, y: 24 });

    ScrollTrigger.batch(cards, {
      start: "top 85%",
      once: true,
      onEnter: function (batch) {
        setWillChange(batch, true);
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          onComplete: function () {
            setWillChange(batch, false);
          },
        });
      },
    });

    // Static page, so there is no component-unmount lifecycle to hook
    // cleanup into. Left here as the pattern this prototype's ONLY
    // ScrollTrigger set needs when it moves into a real SPA route:
    //   useEffect(() => {
    //     const ctx = gsap.context(() => { /* the code above */ });
    //     return () => ctx.revert(); // kills all ScrollTriggers + tweens
    //   }, []);
    window.addEventListener("beforeunload", function () {
      ScrollTrigger.getAll().forEach(function (t) {
        t.kill();
      });
    });
  }

  function setWillChange(els, on) {
    els.forEach(function (el) {
      el.style.willChange = on ? "transform, opacity" : "auto";
    });
  }

  // ------------------------------------------------------------
  // REDUCED MOTION — a real alternative, not "animation: none".
  // No pin, no scroll-jacking, no scrub. Layout is already the
  // stacked/static version via the .no-motion CSS. The only motion
  // left is a short, transform-free opacity cross-fade as each
  // group scrolls into view naturally — same information, same
  // order, just delivered without hijacking the scrollbar.
  // ------------------------------------------------------------
  function initReducedMotion() {
    var groups = [].slice.call(document.querySelectorAll(".callout"));
    var cards = [].slice.call(document.querySelectorAll(".product-card"));
    var targets = groups.concat(cards);

    if (!("IntersectionObserver" in window) || targets.length === 0) {
      return; // base CSS already shows everything; nothing left to do
    }

    targets.forEach(function (el) {
      el.style.transition = "opacity 120ms ease-out";
      el.style.opacity = "0.001";
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    targets.forEach(function (el) {
      io.observe(el);
    });
  }

  // ------------------------------------------------------------
  // Verification aid only — not shown unless ?debug=1 is on the URL.
  // Rolling 1-second FPS counter via rAF, used to eyeball whether the
  // scrub timeline above is holding 60fps on this machine.
  // ------------------------------------------------------------
  function startFpsCounter(badge) {
    var frames = 0;
    var last = performance.now();

    function tick(now) {
      frames++;
      if (now - last >= 1000) {
        badge.textContent = frames + " fps";
        frames = 0;
        last = now;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

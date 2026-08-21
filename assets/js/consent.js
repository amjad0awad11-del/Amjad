/* =========================================================
   AMW — Consent-Management & Meta Pixel
   ---------------------------------------------------------
   Der Meta Pixel wird ausschließlich nach ausdrücklicher
   Einwilligung geladen (Art. 6 Abs. 1 lit. a DSGVO, § 25
   Abs. 1 TTDSG) — so, wie es die Datenschutzerklärung
   (§ 5 Cookies, § 6 Webanalyse & Marketing) zusichert.

   Ohne Einwilligung wird kein Skript von Meta geladen und
   kein Marketing-Cookie gesetzt.
   ========================================================= */
(function () {
  "use strict";

  var PIXEL_ID = "1381478497268708";
  var STORAGE_KEY = "amw-consent";

  /* ---------- Meta Pixel (Base Code) -----------------------
     Wird erst aus grantConsent() heraus aufgerufen.
     -------------------------------------------------------- */
  var pixelLoaded = false;
  function loadMetaPixel() {
    if (pixelLoaded) return;
    pixelLoaded = true;

    /* Meta Pixel Code */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
    /* End Meta Pixel Code */
  }

  /* ---------- Einwilligung speichern / lesen --------------- */
  /* Die Entscheidung wird doppelt gespeichert: localStorage plus Cookie.
     Der Cookie greift auch dann, wenn localStorage blockiert ist, und gilt
     für http und https gleichermaßen — sonst erschiene der Banner nach dem
     Umstellen auf HTTPS erneut. */
  function readConsent() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      if (v) return v;
    } catch (e) {}
    try {
      var m = document.cookie.match(/(?:^|;\s*)amw-consent=([^;]*)/);
      if (m) return decodeURIComponent(m[1]);
    } catch (e) {}
    return null;
  }
  function writeConsent(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    try {
      document.cookie = STORAGE_KEY + "=" + encodeURIComponent(value) +
        ";path=/;max-age=31536000;SameSite=Lax";
    } catch (e) {}
  }

  /* ---------- Consent-Banner ------------------------------- */
  function buildBanner() {
    var el = document.createElement("div");
    el.className = "consent";
    el.id = "consentBar";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Hinweis zum Datenschutz");
    el.innerHTML =
      '<div class="consent__inner">' +
        '<p class="consent__text">' +
          'Wir verwenden Marketing-Cookies (Meta Pixel), um die Leistung unserer ' +
          'Kampagnen zu messen. Diese werden <strong>nur mit Ihrer Einwilligung</strong> ' +
          'geladen. Details in unserer <a href="datenschutz.html">Datenschutzerklärung</a>.' +
        '</p>' +
        '<div class="consent__actions">' +
          '<button type="button" class="btn btn--sm btn--ghost" id="consentDecline">' +
            '<span>Ablehnen</span>' +
          '</button>' +
          '<button type="button" class="btn btn--sm btn--primary" id="consentAccept">' +
            '<span>Akzeptieren</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  function hideBanner(bar) {
    bar.classList.remove("is-open");
    window.setTimeout(function () {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }, 400);
  }

  function showBanner() {
    var bar = buildBanner();
    document.body.appendChild(bar);

    // Einblenden, sobald der Preloader durch ist
    window.setTimeout(function () { bar.classList.add("is-open"); }, 400);

    bar.querySelector("#consentAccept").addEventListener("click", function () {
      writeConsent("granted");
      loadMetaPixel();
      hideBanner(bar);
    });
    bar.querySelector("#consentDecline").addEventListener("click", function () {
      writeConsent("denied");
      hideBanner(bar);
    });
  }

  /* ---------- Start ---------------------------------------- */
  function init() {
    var consent = readConsent();
    if (consent === "granted") {
      loadMetaPixel();      // Einwilligung liegt bereits vor
    } else if (consent !== "denied") {
      showBanner();         // noch keine Entscheidung getroffen
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Widerruf: window.amwResetConsent() blendet den Banner erneut ein. */
  window.amwResetConsent = function () {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    try { document.cookie = STORAGE_KEY + "=;path=/;max-age=0;SameSite=Lax"; } catch (e) {}
    if (!document.getElementById("consentBar")) showBanner();
  };
})();

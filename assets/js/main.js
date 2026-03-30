/* ==========================================================================
   nekoojisan AI業務改善サポート LP v5.0
   - Scroll-driven fallback (IntersectionObserver)
   - 3D tilt effect
   - Cursor spotlight (hero)
   - Magnet button
   - Cookie consent + GA conditional load
   - Honeypot + timestamp form security
   - passive: true event listeners
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Mobile Navigation ---------- */
  var hamburger = document.querySelector(".hamburger");
  var nav = document.querySelector(".nav");
  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      var isOpen = this.classList.toggle("is-active");
      nav.classList.toggle("is-open");
      this.setAttribute("aria-expanded", isOpen);
    });
    document.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("is-active");
        nav.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll Reveal Fallback (IO) ---------- */
  if (!CSS.supports("animation-timeline", "view()")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".scroll-reveal").forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3D Tilt Effect ---------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    document.querySelectorAll(".tilt-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotateX = ((y - cy) / cy) * -6;
        var rotateY = ((x - cx) / cx) * 6;
        card.style.transform =
          "perspective(800px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) scale(1.02)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
      });
    });
  }

  /* ---------- Cursor Spotlight (Hero) ---------- */
  var spotlight = document.querySelector(".cursor-spotlight");
  if (spotlight && !prefersReducedMotion) {
    var hero = document.querySelector(".hero");
    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      spotlight.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      spotlight.style.setProperty("--my", (e.clientY - rect.top) + "px");
    }, { passive: true });
  }

  /* ---------- Magnet Buttons ---------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-magnet]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - rect.left - rect.width / 2;
        var dy = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + (dx * 0.2) + "px, " + (dy * 0.2) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (id === "#") return;
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        var offset = 60;
        var pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: pos, behavior: "smooth" });
      }
    });
  });

  /* ---------- Contact Form (Netlify Forms) ---------- */
  var form = document.getElementById("contact-form");
  var formWrapper = document.getElementById("form-wrapper");
  var successMsg = document.getElementById("form-success");
  var tsField = document.getElementById("form-timestamp");

  if (tsField) tsField.value = Date.now().toString();

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = form.querySelector('input[name="bot-field"]');
      if (hp && hp.value) return;
      if (tsField) {
        var elapsed = Date.now() - parseInt(tsField.value, 10);
        if (elapsed < 3000) return;
      }
      var data = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      })
        .then(function (r) {
          if (r.ok) {
            formWrapper.style.display = "none";
            successMsg.classList.add("is-visible");
          }
        })
        .catch(function () {
          alert("送信に失敗しました。時間を置いて再度お試しください。");
        });
    });
  }

  /* ---------- Cookie Consent ---------- */
  var CONSENT_KEY = "cookie_consent";
  var consentBanner = document.getElementById("cookie-consent");

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (_) { return null; }
  }

  function saveConsent(accepted) {
    var data = { analytics: accepted, ts: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    if (accepted) loadGA();
    hideBanner();
  }

  function hideBanner() {
    if (consentBanner) consentBanner.classList.remove("is-visible");
  }

  function showBanner() {
    if (consentBanner) {
      requestAnimationFrame(function () { consentBanner.classList.add("is-visible"); });
    }
  }

  function loadGA() {
    if (document.querySelector('script[src*="googletagmanager"]')) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX";
    document.head.appendChild(s);
    s.onload = function () {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", "G-XXXXXXXXXX", { anonymize_ip: true });
    };
  }

  var consent = getConsent();
  if (!consent) {
    showBanner();
  } else if (consent.analytics) {
    loadGA();
  }

  document.querySelectorAll("[data-cookie]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      saveConsent(this.dataset.cookie === "accept");
    });
  });
})();

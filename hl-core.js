/* hl-core.js | Human Limit — Clearance Core (single source of truth) */

(function () {
  "use strict";

  // =========================
  // 1) CONFIG — change codes ONLY here
  // =========================
  const CODES = {
    BLUE:  "111111",  // TODO: set your real 6-digit code
    AMBER: "222222",  // TODO: set your real 6-digit code
    BLACK: "333333"   // TODO: set your real 6-digit code
  };

  const ORDER = { NONE: 0, BLUE: 1, AMBER: 2, BLACK: 3 };
  const KEY = "HL_CLEARANCE";

  function normalizeClearance(v) {
    const x = String(v || "").toUpperCase();
    return ORDER[x] ? x : "NONE";
  }

  function getClearance() {
    return normalizeClearance(localStorage.getItem(KEY));
  }

  function setClearance(level) {
    const v = normalizeClearance(level);
    localStorage.setItem(KEY, v);
    return v;
  }

  function matchCode(code6) {
    const c = String(code6 || "").trim();
    if (c === CODES.BLACK) return "BLACK";
    if (c === CODES.AMBER) return "AMBER";
    if (c === CODES.BLUE)  return "BLUE";
    return null;
  }

  function has(required) {
    const cur = getClearance();
    const need = normalizeClearance(required);
    return ORDER[cur] >= ORDER[need];
  }

  // =========================
  // 2) UI helpers
  // =========================
  function qs(sel) { return document.querySelector(sel); }

  function applyClearanceBadges() {
    const cur = getClearance();

    // Any element with data-hl="clearance" gets text
    document.querySelectorAll('[data-hl="clearance"]').forEach((el) => {
      el.textContent = cur;
    });

    // Any element with data-hl="access-status" gets Active/Restricted
    document.querySelectorAll('[data-hl="access-status"]').forEach((el) => {
      el.textContent = cur === "NONE" ? "Restricted" : "Active";
    });
  }

  function guardPage() {
    // Read requirement from meta tag:
    // <meta name="hl-requires" content="BLUE">
    const meta = qs('meta[name="hl-requires"]');
    if (!meta) return;

    const required = normalizeClearance(meta.getAttribute("content"));
    if (required === "NONE") return;

    if (!has(required)) {
      // Deny: redirect to access
      const url = new URL("access.html", window.location.href);
      url.searchParams.set("need", required);
      url.searchParams.set("from", location.pathname.split("/").pop() || "page");
url.searchParams.set("next", location.href);
      location.replace(url.toString());
    }
  }

  // =========================
  // 3) Public API (used by access.html)
  // =========================
  window.HL = {
    getClearance,
    setClearance,
    matchCode,
    has,
    applyClearanceBadges,
    guardPage
  };

  // Auto-run on every page that includes hl-core.js
  document.addEventListener("DOMContentLoaded", () => {
    applyClearanceBadges();
    guardPage();
  });
})();
/* ===== Consent + Clarity Loader ===== */

(function(){

  const KEY = "hl_consent";
  const consentBox = document.getElementById("hl-consent");
  const acceptBtn = document.getElementById("hl-accept");
  const declineBtn = document.getElementById("hl-decline");

  if (!consentBox || !acceptBtn || !declineBtn) return;

  function hasConsent(){
    return localStorage.getItem(KEY) === "accepted";
  }

  function setConsent(value){
    localStorage.setItem(KEY, value);
  }

  function show(){
    consentBox.classList.remove("hidden");
  }

  function hide(){
    consentBox.classList.add("hidden");
  }

  function loadClarity(){
    if (window.__clarityLoaded) return;

    const s = document.createElement("script");
    s.src = "https://www.clarity.ms/tag/YOUR_ID_HERE";
    s.async = true;
    document.head.appendChild(s);

    window.__clarityLoaded = true;
  }

  if (!hasConsent()){
    show();
  } else {
    hide();
    loadClarity();
  }

  acceptBtn.addEventListener("click", () => {
    setConsent("accepted");
    hide();
    loadClarity();
  });

  declineBtn.addEventListener("click", () => {
    setConsent("declined");
    hide();
  });

})();
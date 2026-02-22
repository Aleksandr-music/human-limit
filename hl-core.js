/* hl-core.js | Human Limit — Core (single source of truth) */

(function () {
  "use strict";

  // ==========================================================
  // 1) CLEARANCE CONFIG — change codes ONLY here
  // ==========================================================
  const CODES = {
    BLUE:  "111111",  // TODO: set real 6-digit code
    AMBER: "222222",  // TODO: set real 6-digit code
    BLACK: "333333"   // TODO: set real 6-digit code
  };

  const ORDER = { NONE: 0, BLUE: 1, AMBER: 2, BLACK: 3 };
  const CLEAR_KEY = "HL_CLEARANCE";

  // ==========================================================
  // 2) CONSENT + OPTIONAL CLARITY (post-consent only)
  // ==========================================================
  const CONSENT_KEY = "hl_consent_state"; // "accepted" | "declined"
  const CLARITY_ID = ""; // TODO: set Clarity project id or leave "" to disable

  function normalizeClearance(v) {
    const x = String(v || "").toUpperCase();
    return ORDER[x] ? x : "NONE";
  }

  function getClearance() {
    return normalizeClearance(localStorage.getItem(CLEAR_KEY));
  }

  function setClearance(level) {
    const v = normalizeClearance(level);
    localStorage.setItem(CLEAR_KEY, v);
    return v;
  }

  function matchCode(code6) {
    const c = String(code6 || "").replace(/\D/g, "").slice(0, 6);
    if (c.length !== 6) return null;
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
  // 3) UI helpers
  // =========================
  function qs(sel) { return document.querySelector(sel); }

  function applyClearanceBadges() {
    const cur = getClearance();

    document.querySelectorAll('[data-hl="clearance"]').forEach((el) => {
      el.textContent = cur;
    });

    document.querySelectorAll('[data-hl="access-status"]').forEach((el) => {
      el.textContent = cur === "NONE" ? "Restricted" : "Active";
    });
  }

  // ==========================================================
  // 4) CONSENT overlay harmonized with index.html
  // ==========================================================
  function consentState() {
    const v = String(localStorage.getItem(CONSENT_KEY) || "").toLowerCase();
    return (v === "accepted" || v === "declined") ? v : "";
  }

  function setConsentState(v) {
    const x = (v === "accepted" || v === "declined") ? v : "";
    if (!x) return;
    localStorage.setItem(CONSENT_KEY, x);
  }

  function maybeLoadClarity() {
    if (!CLARITY_ID) return;
    if (window.__clarityLoaded) return;

    // Minimal loader. (No tracking before ACCEPT.)
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.clarity.ms/tag/" + encodeURIComponent(CLARITY_ID);
    document.head.appendChild(s);

    window.__clarityLoaded = true;
  }

  function wireConsentOverlayIfPresent() {
    const box = document.getElementById("hl-consent");
    const acceptBtn = document.getElementById("hl-accept");
    const declineBtn = document.getElementById("hl-decline");

    // If this page has no overlay markup — do nothing.
    if (!box || !acceptBtn || !declineBtn) {
      // Still load Clarity if accepted and ID exists.
      if (consentState() === "accepted") maybeLoadClarity();
      return;
    }

    function show() {
      document.body.classList.add("hl-locked");
      box.classList.remove("hidden");
      box.setAttribute("aria-hidden", "false");
    }

    function hide() {
      document.body.classList.remove("hl-locked");
      box.classList.add("hidden");
      box.setAttribute("aria-hidden", "true");
    }

    const st = consentState();
    if (st !== "accepted" && st !== "declined") {
      show();
    } else {
      hide();
      if (st === "accepted") maybeLoadClarity();
    }

    acceptBtn.addEventListener("click", () => {
      setConsentState("accepted");
      hide();
      maybeLoadClarity();
    });

    declineBtn.addEventListener("click", () => {
      setConsentState("declined");
      hide();
      // No tracking in this state.
    });
  }

  // ==========================================================
  // 5) PAGE GUARD — canonical redirect: ?requires=BLACK&next=...
  // ==========================================================
  function guardPage() {
    const meta = qs('meta[name="hl-requires"]');
    if (!meta) return;

    const required = normalizeClearance(meta.getAttribute("content"));
    if (required === "NONE") return;

    if (!has(required)) {
      const url = new URL("access.html", window.location.href);

      // Canonical params (access.html supports this).
      url.searchParams.set("requires", required);

      // IMPORTANT: do NOT encodeURIComponent here — URLSearchParams encodes automatically.
      // This prevents double-encoding and broken returns.
      url.searchParams.set("next", window.location.href);

      // Optional legacy hints (harmless; access.html ignores if requires/next exist)
      const from = (location.pathname.split("/").pop() || "page").toUpperCase();
      url.searchParams.set("from", from);
      url.searchParams.set("need", required);

      location.replace(url.toString());
    }
  }

  // ==========================================================
  // 6) Public API (used by access.html and others)
  // ==========================================================
  window.HL = {
    getClearance,
    setClearance,
    matchCode,
    has,
    applyClearanceBadges,
    guardPage
  };

  // ==========================================================
  // 7) Auto-run
  // ==========================================================
  document.addEventListener("DOMContentLoaded", () => {
    wireConsentOverlayIfPresent();
    applyClearanceBadges();
    guardPage();
  });

})();
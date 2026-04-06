/**
 * PRO MANAGER — AI Face Analyzer
 * v3 — Complete rewrite
 *
 * Fixes:
 *  1. Pro banner inside .main-header (no more white page bug)
 *  2. Credits → ∞ in header pill + credit panel (no deductions, no gates)
 *  3. All upgrade gate modals/bars/pills disabled for Pro users
 *  4. All blurred/locked features fully unlocked
 *  5. PDF export, leaderboard badge, history — all unlocked
 *
 * Include AFTER pro-upsell.js on every page
 */

(function () {
  'use strict';

  /* ─── PRO STATUS CHECK ─────────────────────────────── */
  var isPro = localStorage.getItem('pus_pro') === '1';

  /* If NOT Pro — do server check if email saved, then bail */
  if (!isPro) {
    var savedEmail = localStorage.getItem('pus_pro_email');
    if (savedEmail) {
      fetch('/api/check-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success && data.isPro) {
          localStorage.setItem('pus_pro', '1');
          location.reload();
        }
      })
      .catch(function () {});
    }
    return; /* Nothing more to do for free users */
  }

  /* ══════════════════════════════════════════════════════
     PRO USER — Apply everything below
  ══════════════════════════════════════════════════════ */

  /* ─── 1. INJECT GLOBAL CSS ─────────────────────────── */
  (function injectCSS() {
    if (document.getElementById('pm-pro-css')) return;
    var s = document.createElement('style');
    s.id = 'pm-pro-css';
    s.textContent = [
      'ins.adsbygoogle{display:none!important}',
      '.adsbygoogle-noablate{display:none!important}',
      '#pus-bar{display:none!important}',
      '#pus-sticky{display:none!important}',
      '#pus-float{display:none!important}',
      '#pus-credit-warn{display:none!important}',
      '#pus-ov{display:none!important}',
      '#ps-float-pill{display:none!important}',
      '#ps-timer-bar{display:none!important}',
      '.ps-pro-banner{display:none!important}',
      '.ps-lock-chip{display:none!important}',
      '.ps-ad-block{display:none!important}',
      '#ps-recurring-ad{display:none!important}',
      '.pus-blur-gate{display:none!important}',
      '.pus-banner{display:none!important}',
      '.pro-blur,.result-blur,.blur-overlay,[data-pro-blur]{filter:none!important;opacity:1!important;pointer-events:auto!important}',
      '#creditLoginPromo{display:none!important}',
      '#lowCreditModal{display:none!important}',
      '#pm-pro-top-note{background:linear-gradient(90deg,#5b21b6,#7c3aed);color:#fff;text-align:center;padding:6px 16px;font-size:12px;font-weight:700;letter-spacing:.4px;width:100%;box-sizing:border-box}',
      '.pm-ad-replaced{display:none!important}'
    ].join('\n');
    document.head.appendChild(s);
  })();

  /* ─── 2. OVERRIDE CREDIT FUNCTIONS ─────────────────── */
  function overrideCreditFunctions() {
    if (typeof window.getCredits === 'function') {
      window.getCredits = function () { return 9999999; };
    }

    if (typeof window.deductCredits === 'function') {
      window.deductCredits = function (cost, photoTime) {
        try {
          var HIST_KEY = 'afa_credit_history';
          var hist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
          hist.push({
            cost: cost,
            remaining: 9999999,
            time: photoTime || new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            label: 'Face Analysis (Pro)',
            icon: '⚡'
          });
          localStorage.setItem(HIST_KEY, JSON.stringify(hist.slice(-20)));
        } catch (e) {}
        setInfinityDisplay();
        if (typeof window.animateCreditDeduction === 'function') {
          window.animateCreditDeduction(0);
        }
        return 9999999;
      };
    }

    if (typeof window.updateCreditDisplay === 'function') {
      window.updateCreditDisplay = function () { setInfinityDisplay(); };
    }

    if (typeof window.openCreditPanel === 'function') {
      var _origOpen = window.openCreditPanel;
      window.openCreditPanel = function () {
        _origOpen();
        setTimeout(proifyCreditPanel, 50);
      };
    }

    if (typeof window.refreshCreditPanel === 'function') {
      window.refreshCreditPanel = function () { proifyCreditPanel(); };
    }

    window.showLowCreditNudge = function () {};
  }

  function setInfinityDisplay() {
    document.querySelectorAll('#creditCount,.credit-count,[data-credits],.credits-left,#hdrCreditVal').forEach(function (el) {
      el.textContent = '\u221e';
    });
    var pill = document.getElementById('creditDisplay');
    if (pill) {
      pill.classList.remove('credit-low', 'credit-critical');
      pill.classList.add('credit-rich');
    }
  }

  function proifyCreditPanel() {
    var map = {
      cbalAmount:        '\u221e',
      creditModalStatus: '\u26a1 Pro Member \u2014 Unlimited Access',
      ciStart:           '\u221e',
      ciUsed:            '0',
      donutPct:          '\u221e'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });

    var arc = document.getElementById('creditDonutArc');
    if (arc) arc.setAttribute('stroke-dasharray', '100 0');

    document.querySelectorAll('.ci-row .ci-val').forEach(function (el) {
      if (el.textContent.indexOf('credit') !== -1 || el.textContent.indexOf('1,000') !== -1 || el.textContent.indexOf('500') !== -1) {
        el.textContent = 'Unlimited (Pro)';
      }
    });

    var promo = document.getElementById('creditLoginPromo');
    if (promo) promo.style.display = 'none';

    var listEl = document.getElementById('creditHistoryList');
    if (listEl && !listEl.querySelector('.ch-item')) {
      listEl.innerHTML = '<div class="ch-empty" style="color:#7c3aed;font-weight:600">\u26a1 Pro Member \u2014 Unlimited analyses, no credit limits!</div>';
    }
  }

  /* ─── 3. KILL ALL UPGRADE GATES ─────────────────────── */
  function killGates() {
    var noop = function () {};
    window.showProGate      = noop;
    window.showUpgradeGate  = noop;
    window.pusOpen          = noop;
    window.pusOpenPay       = noop;
    window.proUpsellGate    = noop;
    window.__pusOpen        = noop;
    window.goPricing        = noop;

    if (window.psSystem) {
      window.psSystem.showUpgradeGate = noop;
      window.psSystem.openPlanModal   = noop;
    }

    ['ps-gate-overlay','pus-ov','ps-plan-modal-overlay','upgrade-gate','lowCreditModal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.classList.remove('show'); }
    });
  }

  /* ─── 4. UNLOCK DOM FEATURES ─────────────────────────── */
  function unlockDOM() {
    /* AdSense units — just hide them, never replaceWith (avoids nuking content wrappers) */
    document.querySelectorAll('ins.adsbygoogle').forEach(function (ad) {
      ad.style.display = 'none';
      /* Hide immediate parent ONLY if it is a clearly dedicated ad wrapper */
      var p = ad.parentElement;
      if (p && p !== document.body) {
        var pClass = (p.className || '').toLowerCase();
        var pId    = (p.id || '').toLowerCase();
        var adOnly = /^(ad[-_]|adsense|adslot|ad-unit|ad-box|ad-wrap|advert)/.test(pClass) ||
                     /^(ad[-_]|adsense|adslot|ad-unit|ad-box|ad-wrap|advert)/.test(pId);
        if (adOnly) p.style.display = 'none';
      }
    });

    /* Remove blur/watermarks */
    document.querySelectorAll('.pro-blur,.result-blur,.blur-overlay,[data-pro-blur]').forEach(function (el) {
      el.style.filter        = 'none';
      el.style.opacity       = '1';
      el.style.pointerEvents = 'auto';
    });

    /* Unlock pro-locked elements */
    document.querySelectorAll('[data-pro-locked],.pro-locked,.locked-feature').forEach(function (el) {
      el.classList.remove('pro-locked', 'locked-feature');
      el.removeAttribute('data-pro-locked');
      el.style.pointerEvents = 'auto';
      el.style.opacity       = '1';
    });

    /* Show pro-only elements */
    document.querySelectorAll('[data-pro-only],.pro-only').forEach(function (el) {
      el.style.display = '';
    });

    /* Hide free-only elements */
    document.querySelectorAll('[data-free-only],.free-only,.upgrade-gate-overlay').forEach(function (el) {
      el.style.display = 'none';
    });

    /* PDF / export buttons — remove lock chips, fix onclick */
    document.querySelectorAll('[data-pdf-export],.export-btn,#exportBtn,.pdf-btn,[onclick*="showProGate"]').forEach(function (btn) {
      var chip = btn.querySelector('.ps-lock-chip');
      if (chip) chip.remove();
      btn.style.opacity       = '1';
      btn.style.pointerEvents = 'auto';
      var oc = btn.getAttribute('onclick') || '';
      if (oc.indexOf('showProGate') !== -1 || oc.indexOf('goPricing') !== -1) {
        btn.setAttribute('onclick', '');
        btn.onclick = function (e) {
          e.stopPropagation();
          if (typeof window.exportResultPDF === 'function') {
            window.exportResultPDF();
          }
        };
      }
    });

    /* Remove pus-blur-wrap overlays from result cards */
    document.querySelectorAll('.pus-blur-wrap').forEach(function (wrap) {
      var parent = wrap.parentElement;
      var inner  = wrap.querySelector('.pus-blur-inner');
      if (inner && parent) {
        while (inner.firstChild) { parent.insertBefore(inner.firstChild, wrap); }
      }
      wrap.remove();
    });

    /* Remove stat blurs */
    document.querySelectorAll('.stat-item[style*="blur"],.face-stat[style*="blur"],[class*="stat-"][style*="blur"]').forEach(function (s) {
      s.style.filter = 'none';
      s.style.cursor = '';
      s.onclick      = null;
    });

    /* Hide in-result upsell banners */
    document.querySelectorAll('.pus-banner,.pus-blur-gate').forEach(function (el) {
      el.style.display = 'none';
    });

    /* Update credit pill in header */
    setInfinityDisplay();

    /* Update plan badge */
    var psb = document.getElementById('ps-plan-badge');
    if (psb) {
      psb.innerHTML =
        '<span style="width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);flex-shrink:0;display:inline-block"></span>' +
        '<span style="font-weight:800">Tripo 4.5</span>' +
        '<span style="background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:6px;margin-left:2px">PRO</span>';
    }

    /* Remove recurring ad */
    var recurAd = document.getElementById('ps-recurring-ad');
    if (recurAd) recurAd.remove();
  }

  /* ─── 5. PRO TOP BANNER — INSIDE HEADER ─────────────── */
  /*
   * Inserted INSIDE .main-header as first child.
   * Avoids the white-page layout bug that happened when
   * inserting at document.body.firstChild.
   */
  function injectProBanner() {
    if (document.getElementById('pm-pro-top-note')) return;
    var note = document.createElement('div');
    note.id  = 'pm-pro-top-note';
    note.innerHTML = '\u26a1 Pro Member \u2014 Unlimited Access \u00a0\u00b7\u00a0 Zero Ads \u00a0\u00b7\u00a0 All Features Unlocked';

    var header = document.querySelector('.main-header');
    if (header) {
      header.insertAdjacentElement('afterbegin', note);
    } else {
      var firstEl = document.body.querySelector('header,nav,.header,#header') || document.body.firstElementChild;
      if (firstEl) {
        document.body.insertBefore(note, firstEl);
      } else {
        document.body.insertAdjacentElement('afterbegin', note);
      }
    }
  }

  /* ─── 6. MUTATION OBSERVER — undo dynamic blurs ─────── */
  function watchAndUnblur() {
    var obs = new MutationObserver(function () {
      document.querySelectorAll('.pus-blur-wrap:not([data-pm-fixed])').forEach(function (wrap) {
        wrap.setAttribute('data-pm-fixed', '1');
        var parent = wrap.parentElement;
        var inner  = wrap.querySelector('.pus-blur-inner');
        if (inner && parent) {
          while (inner.firstChild) { parent.insertBefore(inner.firstChild, wrap); }
        }
        wrap.remove();
      });

      document.querySelectorAll('.stat-item[style*="blur"],.face-stat[style*="blur"]').forEach(function (s) {
        s.style.filter = 'none';
        s.style.cursor = '';
        s.onclick      = null;
      });

      document.querySelectorAll('.pus-banner,.pus-blur-gate').forEach(function (el) {
        el.style.display = 'none';
      });

      setInfinityDisplay();
    });

    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ─── 7. LEADERBOARD PRO BADGE ──────────────────────── */
  function applyLeaderboardPro() {
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page.indexOf('leaderboard') === -1) return;
    setTimeout(function () {
      document.querySelectorAll('.lb-name,.leaderboard-name,.lb-user-name,.entry-name').forEach(function (el) {
        if (!el.querySelector('.pm-lb-pro-badge')) {
          var badge = document.createElement('span');
          badge.className = 'pm-lb-pro-badge';
          badge.style.cssText = 'background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:7px;margin-left:5px;vertical-align:middle';
          badge.textContent = '\u2b50 PRO';
          el.appendChild(badge);
        }
      });
    }, 1500);
  }

  /* ─── MAIN APPLY ─────────────────────────────────────── */
  function applyPro() {
    killGates();
    unlockDOM();
    injectProBanner();
    proifyCreditPanel();
    applyLeaderboardPro();
  }

  /* ─── INIT ───────────────────────────────────────────── */
  function init() {
    overrideCreditFunctions();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        applyPro();
        watchAndUnblur();
        setTimeout(applyPro, 500);
        setTimeout(applyPro, 1500);
        setTimeout(applyPro, 3000);
      });
    } else {
      applyPro();
      watchAndUnblur();
      setTimeout(applyPro, 500);
      setTimeout(applyPro, 1500);
      setTimeout(applyPro, 3000);
    }

    /* Neutralise pro-upsell globals after they're set */
    setTimeout(killGates, 200);
    setTimeout(killGates, 600);
  }

  /* ─── EXPOSE GLOBALS ─────────────────────────────────── */
  window.applyProFeatures    = applyPro;
  window.refreshProUI        = applyPro;
  window.pmProifyCreditPanel = proifyCreditPanel;

  init();

})();

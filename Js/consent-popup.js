/**
 * consent-popup.js
 * Shows a one-time Privacy Policy + Disclaimer consent popup
 * before the user's first analysis action on any category page.
 * Once accepted, localStorage key 'fa_consent_v1' is set and
 * the popup never appears again.
 */

(function () {
  const CONSENT_KEY = 'fa_consent_v1';

  /* ── Inject CSS ── */
  const style = document.createElement('style');
  style.textContent = `
    #fa-consent-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.72);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      font-family: 'Poppins', sans-serif;
      animation: fa-fadeIn .25s ease;
    }
    @keyframes fa-fadeIn { from { opacity:0 } to { opacity:1 } }
    #fa-consent-box {
      background: #1a1a2e;
      border: 1.5px solid rgba(139,92,246,0.5);
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 28px 24px 22px;
      box-shadow: 0 8px 48px rgba(139,92,246,0.25);
      color: #e2e8f0;
    }
    #fa-consent-box h2 {
      font-size: 18px; font-weight: 800; margin: 0 0 6px;
      background: linear-gradient(135deg,#a78bfa,#ec4899);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    #fa-consent-box .fa-consent-sub {
      font-size: 12px; color: #9ca3af; margin-bottom: 16px;
    }
    #fa-consent-box .fa-consent-body {
      font-size: 13px; color: #cbd5e1; line-height: 1.6;
      background: rgba(255,255,255,0.04);
      border-radius: 12px; padding: 14px;
      margin-bottom: 16px;
      max-height: 220px; overflow-y: auto;
    }
    #fa-consent-box .fa-consent-body p { margin: 0 0 10px; }
    #fa-consent-box .fa-consent-body p:last-child { margin: 0; }
    #fa-consent-box .fa-consent-body strong { color: #a78bfa; }
    #fa-consent-box .fa-consent-links {
      font-size: 12px; color: #9ca3af; margin-bottom: 18px; line-height: 1.6;
    }
    #fa-consent-box .fa-consent-links a {
      color: #a78bfa; text-decoration: underline;
    }
    #fa-consent-check-row {
      display: flex; align-items: flex-start; gap: 10px;
      margin-bottom: 18px;
    }
    #fa-consent-check-row input[type=checkbox] {
      width: 18px; height: 18px; accent-color: #8b5cf6;
      margin-top: 2px; flex-shrink: 0; cursor: pointer;
    }
    #fa-consent-check-row label {
      font-size: 13px; color: #cbd5e1; cursor: pointer; line-height: 1.5;
    }
    #fa-consent-ok {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg,#7c3aed,#ec4899);
      color: #fff; border: none; border-radius: 50px;
      font-size: 15px; font-weight: 800; cursor: pointer;
      font-family: 'Poppins',sans-serif;
      opacity: 0.45; transition: opacity .2s;
    }
    #fa-consent-ok.ready { opacity: 1; }
    #fa-consent-ok:hover.ready { filter: brightness(1.1); }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ── */
  function buildPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'fa-consent-overlay';
    overlay.innerHTML = `
      <div id="fa-consent-box">
        <h2>🔐 Before You Analyze</h2>
        <div class="fa-consent-sub">One-time consent — takes 5 seconds</div>
        <div class="fa-consent-body">
          <p>To provide accurate AI analysis and improve your experience, <strong>Face Analyzer</strong> may temporarily store a compressed copy of your uploaded image and result data on secure servers.</p>
          <p>This helps us:<br>
            ✅ Improve AI accuracy over time<br>
            🏆 Enable leaderboard &amp; community features<br>
            🎁 Personalize your results &amp; credits
          </p>
          <p>All stored images are <strong>encrypted</strong>, never shared with third parties, and <strong>auto-deleted within 30 days</strong>. Analysis results are used only in anonymized form.</p>
          <p>Results are for <strong>entertainment purposes only</strong> and do not constitute professional, medical, or scientific advice.</p>
        </div>
        <div class="fa-consent-links">
          By continuing you agree to our
          <a href="privacy.html" target="_blank">Privacy Policy</a> and
          <a href="disclaimer.html" target="_blank">Disclaimer</a>.
        </div>
        <div id="fa-consent-check-row">
          <input type="checkbox" id="fa-consent-chk">
          <label for="fa-consent-chk">I have read and agree to the Privacy Policy &amp; Disclaimer</label>
        </div>
        <button id="fa-consent-ok" disabled>✅ I Agree — Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const chk = overlay.querySelector('#fa-consent-chk');
    const btn = overlay.querySelector('#fa-consent-ok');

    chk.addEventListener('change', function () {
      btn.disabled = !this.checked;
      btn.classList.toggle('ready', this.checked);
    });

    btn.addEventListener('click', function () {
      if (!chk.checked) return;
      localStorage.setItem(CONSENT_KEY, '1');
      overlay.style.animation = 'none';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity .2s';
      setTimeout(function () { overlay.remove(); }, 200);
      // Fire any pending analyze action
      if (typeof window._faConsentCallback === 'function') {
        window._faConsentCallback();
        window._faConsentCallback = null;
      }
    });
  }

  /**
   * Call this instead of directly calling your analyze function.
   * If consent is already given → runs fn() immediately.
   * If not → shows popup, then runs fn() after acceptance.
   */
  window.faRequireConsent = function (fn) {
    if (localStorage.getItem(CONSENT_KEY) === '1') {
      fn();
    } else {
      window._faConsentCallback = fn;
      if (!document.getElementById('fa-consent-overlay')) {
        buildPopup();
      }
    }
  };

})();

/**
 * PRO SYSTEM v2 — AI Face Analyzer
 * - Plan: Free = Tripo 2.9 | Pro = Tripo 4.5
 * - Aggressive Pro upsell on ALL pages
 * - Countdown timer bar
 * - Upgrade gate modals per feature
 * - Floating pill
 * - Pro buyers tracked in Firebase (Firestore)
 */
(function () {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────────
  const FREE_PLAN   = 'Tripo 2.9';
  const PRO_PLAN    = 'Tripo 4.5';
  const PRICING_URL = '/pricing.html';

  const PRICES = {
    IN:  { symbol:'₹',   original:'999', sale:'1',    currency:'INR', label:'India Special — ₹1 Only!' },
    US:  { symbol:'$',   original:'99',  sale:'12',   currency:'USD', label:'Limited Offer — $12 Only!' },
    GB:  { symbol:'£',   original:'79',  sale:'9.5',  currency:'GBP', label:'Limited Offer — £9.5 Only!' },
    EU:  { symbol:'€',   original:'89',  sale:'11',   currency:'EUR', label:'Limited Offer — €11 Only!' },
    AU:  { symbol:'A$',  original:'149', sale:'19',   currency:'AUD', label:'Limited Offer — A$19 Only!' },
    CA:  { symbol:'C$',  original:'129', sale:'16',   currency:'CAD', label:'Limited Offer — C$16 Only!' },
    SG:  { symbol:'S$',  original:'129', sale:'16',   currency:'SGD', label:'Limited Offer — S$16 Only!' },
    AE:  { symbol:'AED ',original:'365', sale:'44',   currency:'AED', label:'Limited Offer — AED 44 Only!' },
    DEFAULT: { symbol:'$', original:'99', sale:'12',  currency:'USD', label:'Limited Offer — $12 Only!' }
  };

  // ── STATE ─────────────────────────────────────────────────────────
  let userCountry = localStorage.getItem('ps_country') || 'DEFAULT';
  let isPro       = localStorage.getItem('pus_pro') === '1' || localStorage.getItem('ps_is_pro') === 'true';

  function getPrice() { return PRICES[userCountry] || PRICES.DEFAULT; }

  // ── EMAIL PRO CHECK — on page load, verify Pro from server if email saved ──
  function checkProByEmail() {
    if (isPro) return; // already Pro locally
    var savedEmail = localStorage.getItem('pus_pro_email');
    if (!savedEmail) return;
    fetch('/api/check-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: savedEmail })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.success && data.isPro) {
        localStorage.setItem('pus_pro', '1');
        isPro = true;
        // Refresh page UI if not already Pro
        if (typeof window.refreshProUI === 'function') window.refreshProUI();
      }
    })
    .catch(function(){}); // silent fail
  }

  // ── GEO ───────────────────────────────────────────────────────────
  function detectGeo() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) {
        userCountry = 'IN'; localStorage.setItem('ps_country', 'IN');
        updatePriceUI(); return;
      }
    } catch (e) {}
    if (localStorage.getItem('ps_country_fetched')) return;
    fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then(d => {
        userCountry = d.country_code === 'IN' ? 'IN' : 'DEFAULT';
        localStorage.setItem('ps_country', userCountry);
        localStorage.setItem('ps_country_fetched', '1');
        updatePriceUI();
      }).catch(() => {});
  }

  function updatePriceUI() {
    const p = getPrice();
    document.querySelectorAll('[data-ps-price]').forEach(el   => el.textContent = p.symbol + p.sale);
    document.querySelectorAll('[data-ps-original]').forEach(el => el.textContent = p.symbol + p.original);
    document.querySelectorAll('[data-ps-label]').forEach(el   => el.textContent = p.label);
  }

  // ── CSS ───────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('pro-system-css')) return;
    const s = document.createElement('style');
    s.id = 'pro-system-css';
    s.textContent = `
/* ── PLAN BADGE ── */
.ps-plan-badge{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#ede9fe,#fce7f3);border:1.5px solid #c4b5fd;border-radius:20px;padding:4px 10px 4px 8px;font-size:12px;font-weight:700;color:#5b21b6;cursor:pointer;transition:all .2s;white-space:nowrap;user-select:none}
.ps-plan-badge:hover{background:linear-gradient(135deg,#ddd6fe,#fbcfe8);transform:scale(1.03);box-shadow:0 2px 8px rgba(124,58,237,.18)}
.ps-badge-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0}
.ps-badge-dot.pro{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.ps-badge-chevron{font-size:10px;color:#7c3aed;margin-left:1px;transition:transform .2s}
.ps-plan-badge.open .ps-badge-chevron{transform:rotate(180deg)}
/* ── TIMER BAR ── */
.ps-timer-bar{background:linear-gradient(90deg,#5b21b6 0%,#7c3aed 50%,#a855f7 100%);color:#fff;font-size:12px;font-weight:700;text-align:center;padding:6px 12px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;position:relative;overflow:hidden}
.ps-timer-bar::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:psShine 3s ease-in-out infinite}
@keyframes psShine{0%{left:-100%}60%,100%{left:130%}}
.ps-timer-count{font-size:13px;background:rgba(255,255,255,.2);padding:1px 8px;border-radius:8px;letter-spacing:1px;font-weight:800}
.ps-timer-close{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.2);border:none;color:#fff;font-size:14px;width:20px;height:20px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
/* ── PLAN MODAL ── */
.ps-modal-overlay{position:fixed;inset:0;background:rgba(10,5,30,.55);backdrop-filter:blur(6px);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding-top:70px}
.ps-modal-overlay.show{display:flex}
.ps-plan-modal{background:#fff;border-radius:20px;width:90%;max-width:380px;box-shadow:0 20px 60px rgba(91,33,182,.18);overflow:hidden;animation:psModalIn .25s cubic-bezier(.34,1.56,.64,1)}
@keyframes psModalIn{from{transform:translateY(-20px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.ps-plan-modal-head{padding:16px 18px 12px;border-bottom:1px solid #f3f0ff;display:flex;align-items:center;justify-content:space-between}
.ps-plan-modal-title{font-size:13px;font-weight:700;color:#0f0f13}
.ps-plan-modal-close{background:#f3f4f6;border:none;width:28px;height:28px;border-radius:50%;font-size:16px;cursor:pointer;color:#6b7280;display:flex;align-items:center;justify-content:center}
.ps-plan-item{padding:14px 18px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:background .15s;border-bottom:1px solid #f9f9ff}
.ps-plan-item:hover{background:#faf5ff}
.ps-plan-item.active{background:#f5f3ff}
.ps-plan-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.ps-plan-icon.free{background:linear-gradient(135deg,#ede9fe,#ddd6fe)}
.ps-plan-icon.pro{background:linear-gradient(135deg,#fef3c7,#fde68a)}
.ps-plan-info{flex:1}
.ps-plan-name{font-size:14px;font-weight:700;color:#0f0f13;display:flex;align-items:center;gap:6px}
.ps-plan-desc{font-size:11px;color:#6b7280;margin-top:2px}
.ps-active-check{width:22px;height:22px;background:linear-gradient(135deg,#5b21b6,#ec4899);border-radius:50%;color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ps-upgrade-arrow{background:linear-gradient(135deg,#5b21b6,#ec4899);color:#fff;border:none;border-radius:12px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0}
.ps-plan-pro-badge{background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:6px;letter-spacing:.5px}
.ps-modal-footer{padding:12px 18px;background:linear-gradient(135deg,#faf5ff,#fce7f3);text-align:center}
.ps-modal-footer-btn{width:100%;background:linear-gradient(135deg,#5b21b6,#ec4899);color:#fff;border:none;border-radius:14px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
.ps-modal-footer-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(91,33,182,.35)}
/* ── GATE MODAL ── */
.ps-gate-overlay{position:fixed;inset:0;background:rgba(10,5,30,.6);backdrop-filter:blur(8px);z-index:99998;display:none;align-items:center;justify-content:center;padding:20px}
.ps-gate-overlay.show{display:flex}
.ps-gate-modal{background:#fff;border-radius:24px;width:100%;max-width:360px;box-shadow:0 24px 80px rgba(91,33,182,.22);overflow:hidden;animation:psModalIn .25s cubic-bezier(.34,1.56,.64,1)}
.ps-gate-top{background:linear-gradient(135deg,#5b21b6,#7c3aed,#f59e0b);padding:28px 20px 20px;text-align:center;color:#fff;position:relative}
.ps-gate-emoji{font-size:44px;display:block;margin-bottom:8px}
.ps-gate-title{font-size:20px;font-weight:800;margin:0 0 6px}
.ps-gate-subtitle{font-size:13px;opacity:.9;margin:0}
.ps-gate-close{position:absolute;top:12px;right:14px;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:18px;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ps-gate-features{padding:16px 20px;display:flex;flex-direction:column;gap:10px}
.ps-gate-feat{display:flex;align-items:center;gap:10px;font-size:13px;color:#0f0f13;font-weight:500}
.ps-gate-feat-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#ede9fe,#fce7f3);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.ps-gate-bottom{padding:0 20px 20px;display:flex;flex-direction:column;gap:10px}
.ps-gate-cta{width:100%;background:linear-gradient(135deg,#5b21b6,#ec4899);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.ps-gate-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(91,33,182,.35)}
.ps-gate-skip{background:none;border:none;color:#9ca3af;font-size:12px;cursor:pointer;text-align:center;padding:4px}
.ps-gate-price-line{text-align:center;font-size:13px;color:#6b7280;margin:0}
.ps-gate-price-line strong{color:#5b21b6;font-size:18px}
/* ── PRO BANNER (inline) ── */
.ps-pro-banner{background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4c1d95 100%);border-radius:16px;padding:16px 18px;margin:16px 0;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;color:#fff}
.ps-pro-banner::before{content:'';position:absolute;top:-50%;right:-30%;width:140px;height:140px;background:radial-gradient(circle,rgba(236,72,153,.3) 0%,transparent 70%);pointer-events:none}
.ps-pro-banner:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(91,33,182,.3)}
.ps-pro-banner-icon{font-size:32px;flex-shrink:0}
.ps-pro-banner-info{flex:1}
.ps-pro-banner-title{font-size:14px;font-weight:800;margin:0 0 3px}
.ps-pro-banner-desc{font-size:11px;opacity:.8;margin:0}
.ps-pro-banner-btn{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0}
/* ── LOCK CHIP ── */
.ps-lock-chip{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1.5px solid #f59e0b;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;color:#92400e;cursor:pointer;margin-left:6px;vertical-align:middle;transition:all .2s}
.ps-lock-chip:hover{background:linear-gradient(135deg,#fde68a,#fbbf24);transform:scale(1.05)}
/* ── WATERMARK OVERLAY ── */
.ps-watermark-overlay{pointer-events:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10}
.ps-watermark-text{font-size:32px;font-weight:900;color:rgba(91,33,182,.15);transform:rotate(-25deg);letter-spacing:4px;white-space:nowrap;user-select:none}
/* ── LEADERBOARD PRO BADGE ── */
.ps-lb-pro-badge{background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:8px;letter-spacing:.5px;text-transform:uppercase;vertical-align:middle;margin-left:4px}
/* ── FLOATING PILL ── */
.ps-float-pill{position:fixed;bottom:100px;right:16px;background:linear-gradient(135deg,#5b21b6,#ec4899);color:#fff;border:none;border-radius:28px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer;z-index:9000;box-shadow:0 6px 24px rgba(91,33,182,.45);display:flex;align-items:center;gap:6px;animation:psFloatBounce 2.5s ease-in-out infinite;transition:all .2s}
.ps-float-pill:hover{transform:scale(1.06)}
@keyframes psFloatBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.ps-float-pill.hidden{display:none}
/* ── AD BLOCK (shows banner ad UX on non-pro) ── */
.ps-ad-block{background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1.5px solid #fcd34d;border-radius:14px;padding:12px 16px;margin:12px 0;display:flex;align-items:center;gap:12px;cursor:pointer}
.ps-ad-block-icon{font-size:22px;flex-shrink:0}
.ps-ad-block-text{flex:1}
.ps-ad-block-title{font-size:13px;font-weight:700;color:#78350f;margin-bottom:2px}
.ps-ad-block-sub{font-size:11px;color:#92400e}
.ps-ad-block-close{font-size:18px;color:#d97706;flex-shrink:0}
    `;
    document.head.appendChild(s);
  }

  // ── PLAN BADGE ────────────────────────────────────────────────────
  function injectPlanBadge() {
    const left = document.querySelector('.hdr-brand-left');
    if (!left || document.getElementById('ps-plan-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'ps-plan-badge';
    badge.className = 'ps-plan-badge';
    badge.innerHTML = `<span class="ps-badge-dot${isPro ? ' pro' : ''}"></span><span class="ps-badge-name">${isPro ? PRO_PLAN : FREE_PLAN}</span><span class="ps-badge-chevron">▾</span>`;
    badge.addEventListener('click', openPlanModal);
    left.appendChild(badge);
  }

  // ── TIMER BAR ─────────────────────────────────────────────────────
  function injectTimer() {
    if (document.getElementById('ps-timer-bar') || isPro) return;
    const header = document.querySelector('.main-header');
    if (!header) return;
    const bar = document.createElement('div');
    bar.id = 'ps-timer-bar';
    bar.className = 'ps-timer-bar';
    bar.innerHTML = `<span>🔥</span><span>Pro ${PRO_PLAN} offer expires in</span><span class="ps-timer-count" id="ps-timer-count">--:--:--</span><span>— Price goes up after!</span><button class="ps-timer-close" onclick="event.stopPropagation();this.parentElement.style.display='none'">×</button>`;
    bar.addEventListener('click', () => location.href = PRICING_URL);
    header.insertAdjacentElement('afterend', bar);
    startTimer();
  }

  function startTimer() {
    function tick() {
      const el = document.getElementById('ps-timer-count'); if (!el) return;
      const now = new Date(), mid = new Date(now); mid.setHours(23,59,59,999);
      const diff = mid - now; if (diff <= 0) { el.textContent = '00:00:00'; return; }
      const h = String(Math.floor(diff/3600000)).padStart(2,'0');
      const m = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
      const s = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
      el.textContent = h+':'+m+':'+s;
    }
    tick(); setInterval(tick, 1000);
  }

  // ── PLAN MODAL ────────────────────────────────────────────────────
  function buildPlanModal() {
    if (document.getElementById('ps-plan-modal-overlay')) return;
    const p = getPrice();
    const overlay = document.createElement('div');
    overlay.id = 'ps-plan-modal-overlay';
    overlay.className = 'ps-modal-overlay';
    overlay.innerHTML = `
      <div class="ps-plan-modal">
        <div class="ps-plan-modal-head">
          <span class="ps-plan-modal-title">Select your plan</span>
          <button class="ps-plan-modal-close" onclick="window.psSystem.closePlanModal()">×</button>
        </div>
        <div class="ps-plan-item ${!isPro ? 'active' : ''}" onclick="window.psSystem.selectFree()">
          <div class="ps-plan-icon free">🆓</div>
          <div class="ps-plan-info">
            <div class="ps-plan-name">${FREE_PLAN} <span style="font-size:10px;color:#9ca3af;font-weight:500">Free</span></div>
            <div class="ps-plan-desc">Basic analysis · Ads · 10k credits/day</div>
          </div>
          ${!isPro ? '<div class="ps-active-check">✓</div>' : ''}
        </div>
        <div class="ps-plan-item ${isPro ? 'active' : ''}" onclick="window.psSystem.selectPro()">
          <div class="ps-plan-icon pro">⚡</div>
          <div class="ps-plan-info">
            <div class="ps-plan-name">${PRO_PLAN} <span class="ps-plan-pro-badge">PRO</span></div>
            <div class="ps-plan-desc">Unlimited · No ads · PDF · 99.9% accuracy</div>
          </div>
          ${isPro ? '<div class="ps-active-check">✓</div>' : `<button class="ps-upgrade-arrow" onclick="event.stopPropagation();location.href='${PRICING_URL}'">Upgrade ↗</button>`}
        </div>
        <div class="ps-modal-footer">
          <button class="ps-modal-footer-btn" onclick="location.href='${PRICING_URL}'">
            ⚡ Upgrade to ${PRO_PLAN} — <span style="text-decoration:line-through;opacity:.6;font-weight:400;font-size:12px" data-ps-original></span> <strong data-ps-price></strong> <span style="font-size:11px;opacity:.8">today only</span>
          </button>
        </div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closePlanModal(); });
    document.body.appendChild(overlay);
    updatePriceUI();
  }

  function openPlanModal() { buildPlanModal(); document.getElementById('ps-plan-badge')?.classList.add('open'); document.getElementById('ps-plan-modal-overlay')?.classList.add('show'); }
  function closePlanModal() { document.getElementById('ps-plan-badge')?.classList.remove('open'); document.getElementById('ps-plan-modal-overlay')?.classList.remove('show'); }
  function selectFree() { closePlanModal(); }
  function selectPro() { closePlanModal(); location.href = PRICING_URL; }

  // ── GATE CONFIGS ──────────────────────────────────────────────────
  const GATES = {
    pdf:         { emoji:'📄', title:'PDF Export is Pro Only',        subtitle:'Download your full analysis as a beautiful PDF',       features:[{icon:'📄',text:'Export any result to PDF instantly'},{icon:'🚫',text:'Zero ads, clean reading experience'},{icon:'💧',text:'No watermarks on your results'},{icon:'⚡',text:'Unlimited analyses, 99.9% accuracy'}] },
    ads:         { emoji:'🚫', title:'Remove All Ads with Pro',        subtitle:'Enjoy a clean, distraction-free experience',            features:[{icon:'🚫',text:'All ads permanently removed'},{icon:'⚡',text:'Faster page loads'},{icon:'📄',text:'PDF export unlocked'},{icon:'♾️',text:'Unlimited credits every day'}] },
    watermark:   { emoji:'💧', title:'Remove Watermarks from Results', subtitle:'Get clean, professional results with Pro',             features:[{icon:'💧',text:'No watermarks on any result'},{icon:'📄',text:'PDF export with your branding'},{icon:'🚫',text:'Ad-free experience'},{icon:'♾️',text:'Unlimited analyses'}] },
    accuracy:    { emoji:'🎯', title:'Boost Accuracy to 99.9%',        subtitle:`${PRO_PLAN} gives deeply precise analysis`,             features:[{icon:'🎯',text:`99.9% accurate — ${PRO_PLAN} engine`},{icon:'⚡',text:'3× faster results'},{icon:'📊',text:'Detailed metrics & breakdown'},{icon:'📄',text:'Export as PDF anytime'}] },
    leaderboard: { emoji:'🏆', title:'Get Your Premium Badge',          subtitle:'Stand out on the leaderboard with Pro status',         features:[{icon:'🏆',text:'Gold ⭐ Premium badge on leaderboard'},{icon:'🥇',text:'Priority ranking visibility'},{icon:'📊',text:'Detailed score breakdown'},{icon:'♾️',text:'Unlimited analyses to climb higher'}] },
    credits:     { emoji:'♾️', title:'Unlimited Credits with Pro',      subtitle:'Never run out — analyze as much as you want',         features:[{icon:'♾️',text:'Truly unlimited credits, forever'},{icon:'🔥',text:'No daily resets or limits'},{icon:'⚡',text:'Instant analysis, no waiting'},{icon:'📄',text:'Download results as PDF'}] },
    history:     { emoji:'📊', title:'Credit History is Pro Only',      subtitle:'See your full analysis log with all details',          features:[{icon:'📊',text:'Complete analysis log forever'},{icon:'📅',text:'Date, type, score & credits used'},{icon:'🔒',text:'Private & secure'},{icon:'💾',text:'Save & revisit any analysis'}] },
    private:     { emoji:'🔒', title:'Private Results is Pro Only',     subtitle:'Keep your face scan results private',                  features:[{icon:'🔒',text:'Results visible only to you'},{icon:'🛡️',text:'Secure, encrypted storage'},{icon:'🗑️',text:'Delete any analysis anytime'},{icon:'👥',text:'Multi-device access'}] },
    celebrity:   { emoji:'🌟', title:'Celebrity HD Compare is Pro',    subtitle:'High-definition celebrity face matching',               features:[{icon:'🌟',text:'HD celebrity comparison'},{icon:'📸',text:'Full face grid comparison'},{icon:'🎯',text:'99.9% match accuracy'},{icon:'📄',text:'Export as PDF'}] },
    default:     { emoji:'⚡', title:'This is a Pro Feature',          subtitle:`Upgrade to ${PRO_PLAN} to unlock this`,                features:[{icon:'♾️',text:'Unlimited credits & analyses'},{icon:'🚫',text:'No ads, no watermarks'},{icon:'📄',text:'Export results as PDF'},{icon:'🎯',text:'99.9% accurate analysis'}] }
  };

  function showUpgradeGate(type) {
    if (isPro) return;
    const cfg = GATES[type] || GATES.default;
    const p = getPrice();
    let overlay = document.getElementById('ps-gate-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ps-gate-overlay'; overlay.className = 'ps-gate-overlay';
      overlay.innerHTML = `<div class="ps-gate-modal"><div class="ps-gate-top"><button class="ps-gate-close" id="ps-gate-close">×</button><span class="ps-gate-emoji" id="ps-gate-emoji"></span><h2 class="ps-gate-title" id="ps-gate-title"></h2><p class="ps-gate-subtitle" id="ps-gate-subtitle"></p></div><div class="ps-gate-features" id="ps-gate-features"></div><div class="ps-gate-bottom"><p class="ps-gate-price-line">Today: <span style="text-decoration:line-through;color:#9ca3af" data-ps-original></span> → <strong data-ps-price></strong></p><button class="ps-gate-cta" onclick="location.href='${PRICING_URL}'">⚡ Upgrade to ${PRO_PLAN} Now</button><button class="ps-gate-skip" onclick="window.psSystem.closeGate()">Maybe later</button></div></div>`;
      overlay.addEventListener('click', e => { if (e.target === overlay) closeGate(); });
      document.body.appendChild(overlay);
      document.getElementById('ps-gate-close').onclick = closeGate;
    }
    document.getElementById('ps-gate-emoji').textContent = cfg.emoji;
    document.getElementById('ps-gate-title').textContent = cfg.title;
    document.getElementById('ps-gate-subtitle').textContent = cfg.subtitle;
    document.getElementById('ps-gate-features').innerHTML = cfg.features.map(f => `<div class="ps-gate-feat"><div class="ps-gate-feat-icon">${f.icon}</div><span>${f.text}</span></div>`).join('');
    updatePriceUI();
    overlay.classList.add('show');
  }

  function closeGate() { document.getElementById('ps-gate-overlay')?.classList.remove('show'); }

  // ── FLOATING PILL ─────────────────────────────────────────────────
  function injectFloatPill() {
    if (document.getElementById('ps-float-pill') || isPro) return;
    const pill = document.createElement('button');
    pill.id = 'ps-float-pill'; pill.className = 'ps-float-pill';
    pill.innerHTML = `⚡ ${PRO_PLAN} Pro`;
    pill.addEventListener('click', () => location.href = PRICING_URL);
    document.body.appendChild(pill);
    setTimeout(() => pill.classList.add('hidden'), 30000);
  }

  // ── PRO BANNER UTILITY ────────────────────────────────────────────
  function createProBanner(title, desc) {
    if (isPro) return null;
    const div = document.createElement('div');
    div.className = 'ps-pro-banner';
    div.innerHTML = `<div class="ps-pro-banner-icon">⚡</div><div class="ps-pro-banner-info"><p class="ps-pro-banner-title">${title}</p><p class="ps-pro-banner-desc">${desc}</p></div><button class="ps-pro-banner-btn">Upgrade</button>`;
    div.addEventListener('click', () => location.href = PRICING_URL);
    return div;
  }

  // ── AD BLOCK UTILITY (simulates ad but offers Pro to remove) ──────
  function createAdBlock(reason) {
    if (isPro) return null;
    const div = document.createElement('div');
    div.className = 'ps-ad-block';
    div.innerHTML = `<div class="ps-ad-block-icon">📢</div><div class="ps-ad-block-text"><div class="ps-ad-block-title">Ad — Go Pro to remove all ads forever</div><div class="ps-ad-block-sub">${reason || 'Upgrade to ' + PRO_PLAN + ' for a clean, ad-free experience'}</div></div><div class="ps-ad-block-close">›</div>`;
    div.addEventListener('click', () => location.href = PRICING_URL);
    return div;
  }

  // ── PAGE-SPECIFIC INJECTIONS ──────────────────────────────────────
  function injectPageProAds() {
    if (isPro) return;
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    // ── index.html ──
    if (page === 'index.html' || page === '') {
      const hero = document.querySelector('.hero-section, .main-card, #mainCard, .upload-section');
      if (hero) {
        const b = createProBanner(`⚡ ${PRO_PLAN} — 99.9% Accuracy, Zero Ads`, 'Unlimited analyses · PDF export · No watermarks · Tripo 4.5 engine');
        if (b) hero.insertAdjacentElement('afterend', b);
      }
      // Ad block after features section
      setTimeout(() => {
        const feat = document.querySelector('.features-section, .how-it-works, .steps-section');
        if (feat) {
          const ad = createAdBlock('Upgrade to ' + PRO_PLAN + ' to browse this page ad-free');
          if (ad) feat.insertAdjacentElement('afterend', ad);
        }
      }, 2000);
    }

    // ── faceanalyze.html ──
    if (page === 'faceanalyze.html') {
      setTimeout(() => {
        // After result
        const result = document.querySelector('#resultScreen, #dynamicResultCard, .result-section');
        if (result) {
          const b = createProBanner('🔓 Remove Watermark + Export PDF', 'Your result has a watermark. Upgrade to get clean, watermark-free PDFs!');
          if (b) result.insertAdjacentElement('afterend', b);
        }
        // Ad before upload
        const upload = document.querySelector('#uploadScreen, .upload-card, .upload-area');
        if (upload) {
          const ad = createAdBlock('Go Pro to analyze without any ads or interruptions');
          if (ad) upload.insertAdjacentElement('beforebegin', ad);
        }
        // Lock chip on export button
        document.querySelectorAll('[data-pdf-export], .export-btn, #exportBtn').forEach(btn => {
          if (!btn.querySelector('.ps-lock-chip')) {
            const chip = document.createElement('span');
            chip.className = 'ps-lock-chip';
            chip.innerHTML = '🔒 Pro'; chip.title = 'PDF export is Pro only';
            chip.addEventListener('click', e => { e.stopPropagation(); showUpgradeGate('pdf'); });
            btn.appendChild(chip);
          }
        });
      }, 1500);
    }

    // ── agedetector.html / compareface.html / symettery.html ──
    if (['agedetector.html','compareface.html','symettery.html'].includes(page)) {
      setTimeout(() => {
        const form = document.querySelector('form, .upload-area, .btn-analyze, .analyze-btn, .main-card');
        if (form) {
          const b = createProBanner(`⚡ Get ${PRO_PLAN} — 99.9% Accuracy`, 'Pro users get faster, more accurate results. No ads, no watermarks.');
          if (b) form.insertAdjacentElement('beforebegin', b);
        }
        // Ad block mid-page
        const mid = document.querySelector('.result-section, #resultCard, .info-section');
        if (mid) {
          const ad = createAdBlock('Remove all ads with ' + PRO_PLAN + ' Pro');
          if (ad) mid.insertAdjacentElement('afterend', ad);
        }
      }, 1500);
    }

    // ── leaderboard.html ──
    if (page === 'leaderboard.html') {
      setTimeout(() => {
        const lb = document.querySelector('.leaderboard-list, .lb-list, #leaderboardList, .lb-container');
        if (lb) {
          const b = createProBanner('🏆 Get Your Gold Pro Badge', `${PRO_PLAN} Pro users get a gold ⭐ badge & priority leaderboard visibility`);
          if (b) lb.insertAdjacentElement('beforebegin', b);
          const ad = createAdBlock('Go ad-free on the leaderboard with ' + PRO_PLAN + ' Pro');
          if (ad) lb.insertAdjacentElement('afterend', ad);
        }
      }, 1000);
    }

    // ── mission.html / about.html / future.html ──
    if (['mission.html','about.html','future.html','settings.html'].includes(page)) {
      setTimeout(() => {
        const body = document.querySelector('.page-content, main, .content-section, .settings-list');
        if (body) {
          const b = createProBanner(`⚡ Try ${PRO_PLAN} Pro Today`, 'Unlimited analyses · Zero ads · PDF export · 99.9% accuracy · One-time payment');
          if (b) body.insertAdjacentElement('afterend', b);
        }
      }, 1000);
    }

    // ── ALL PAGES: repeat ad block every 4 minutes ──
    setInterval(() => {
      if (isPro) return;
      const existing = document.getElementById('ps-recurring-ad');
      if (existing) existing.remove();
      const ad = createAdBlock(`Tired of ads? Upgrade to ${PRO_PLAN} Pro for ad-free browsing`);
      if (!ad) return;
      ad.id = 'ps-recurring-ad';
      const target = document.querySelector('.bottom-nav');
      if (target) target.insertAdjacentElement('beforebegin', ad);
    }, 4 * 60 * 1000);
  }

  // ── INIT ──────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    detectGeo();
    function run() {
      injectPlanBadge();
      injectTimer();
      if (!isPro) injectFloatPill();
      injectPageProAds();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run(); setTimeout(run, 600);
    }
  }

  // ── PUBLIC API ────────────────────────────────────────────────────
  window.psSystem = { openPlanModal, closePlanModal, selectFree, selectPro, showUpgradeGate, closeGate, isPro: () => isPro, getPrice };
  window.showProGate = showUpgradeGate;

  init();
})();

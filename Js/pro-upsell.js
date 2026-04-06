/**
 * PRO UPSELL SYSTEM v7 — AI Face Analyzer
 * Dynamic Slot Pricing: ₹1 (5min) → ₹9 → ₹29 → ₹49
 * Razorpay Key: YOUR_RAZORPAY_LIVE_KEY
 */
(function () {
  'use strict';

  var RZP_KEY  = 'YOUR_RAZORPAY_LIVE_KEY';

  /* ══════════════════════════════════════
     DYNAMIC SLOT PRICING SYSTEM
     First visit: 5 min @ ₹1 (slot 0)
     After 5min: 10min @ ₹9 (slot 1)
     After 15min: 20min @ ₹29 (slot 2)
     After 35min+: final ₹49 (slot 3)
  ══════════════════════════════════════ */
  var IN_SLOTS = [
    { price:'1',  dur:300,  label:'🔥 5-min Flash Deal!',  badge:'🇮🇳 India Special — ₹1 Only!' },
    { price:'9',  dur:600,  label:'⚡ Limited Slots Left!', badge:'🇮🇳 Slot Price — ₹9 Only!' },
    { price:'29', dur:1200, label:'⏳ Offer Ending Soon!',  badge:'🇮🇳 Almost Gone — ₹29!' },
    { price:'49', dur:null, label:'💎 Final Price',          badge:'🇮🇳 Best Deal — ₹49' }
  ];

  // Get/init slot state (persisted in localStorage)
  function initSlot() {
    var firstSeen = localStorage.getItem('pus_first_seen');
    if (!firstSeen) {
      firstSeen = Date.now().toString();
      localStorage.setItem('pus_first_seen', firstSeen);
      localStorage.setItem('pus_slot', '0');
    }
    var elapsed = (Date.now() - parseInt(firstSeen)) / 1000; // seconds
    var slot = 0;
    var cumTime = 0;
    for (var i = 0; i < IN_SLOTS.length - 1; i++) {
      cumTime += IN_SLOTS[i].dur;
      if (elapsed >= cumTime) slot = i + 1;
      else break;
    }
    localStorage.setItem('pus_slot', slot);
    return slot;
  }

  function getCurrentSlot() {
    return Math.min(parseInt(localStorage.getItem('pus_slot') || '0'), IN_SLOTS.length - 1);
  }

  function getSlotRemainingSeconds() {
    var slot = getCurrentSlot();
    if (slot >= IN_SLOTS.length - 1) return 0; // final slot, no timer
    var firstSeen = parseInt(localStorage.getItem('pus_first_seen') || Date.now());
    var elapsed = (Date.now() - firstSeen) / 1000;
    var cumTime = 0;
    for (var i = 0; i <= slot; i++) cumTime += IN_SLOTS[i].dur;
    return Math.max(0, Math.round(cumTime - elapsed));
  }

  function updateSlotIfNeeded() {
    var firstSeen = parseInt(localStorage.getItem('pus_first_seen') || Date.now());
    var elapsed = (Date.now() - firstSeen) / 1000;
    var slot = 0, cumTime = 0;
    for (var i = 0; i < IN_SLOTS.length - 1; i++) {
      cumTime += IN_SLOTS[i].dur;
      if (elapsed >= cumTime) slot = i + 1;
      else break;
    }
    var prev = parseInt(localStorage.getItem('pus_slot') || '0');
    if (slot !== prev) {
      localStorage.setItem('pus_slot', slot);
      return true; // slot changed
    }
    return false;
  }

  var PRICE = {
    IN:  { sym:'₹',   sale: IN_SLOTS[initSlot()].price, orig:'999', cur:'INR', off:'99% OFF', badge: IN_SLOTS[getCurrentSlot()].badge },
    US:  { sym:'$',   sale:'12',   orig:'99',  cur:'USD', off:'88% OFF', badge:'🌎 Limited Offer — $12 Only!' },
    GB:  { sym:'£',   sale:'9.5',  orig:'79',  cur:'GBP', off:'88% OFF', badge:'🇬🇧 Limited Offer — £9.5 Only!' },
    EU:  { sym:'€',   sale:'11',   orig:'89',  cur:'EUR', off:'88% OFF', badge:'🇪🇺 Limited Offer — €11 Only!' },
    AU:  { sym:'A$',  sale:'19',   orig:'149', cur:'AUD', off:'87% OFF', badge:'🇦🇺 Limited Offer — A$19 Only!' },
    CA:  { sym:'C$',  sale:'16',   orig:'129', cur:'CAD', off:'88% OFF', badge:'🇨🇦 Limited Offer — C$16 Only!' },
    SG:  { sym:'S$',  sale:'16',   orig:'129', cur:'SGD', off:'88% OFF', badge:'🇸🇬 Limited Offer — S$16 Only!' },
    AE:  { sym:'AED ',sale:'44',   orig:'365', cur:'AED', off:'88% OFF', badge:'🇦🇪 Limited Offer — AED 44 Only!' },
    DEF: { sym:'$',   sale:'12',   orig:'99',  cur:'USD', off:'88% OFF', badge:'🌍 Limited Offer — $12 Only!' }
  };

  // Refresh IN price - use PSGetPrice (plan-system.js) if available, else local slots
  function refreshINPrice() {
    if (window.PSGetPrice && window.PSDetectCtry) {
      try {
        var ctry = window.PSDetectCtry();
        var pp = window.PSGetPrice('pro', ctry);
        if (pp && pp.sale) {
          PRICE[ctry] = { sym: pp.sym, sale: pp.sale, orig: pp.orig, off: pp.off, cur: pp.cur };
          if (ctry === 'IN') {
            PRICE.IN.sale  = pp.sale;
            PRICE.IN.badge = '\uD83C\uDDEE\uD83C\uDDF3 Best Deal \u2014 ' + pp.sym + pp.sale + ' Only!';
          }
          return;
        }
      } catch(e) {}
    }
    // Fallback: use local IN_SLOTS timer-based price
    var slot = getCurrentSlot();
    PRICE.IN.sale  = IN_SLOTS[slot].price;
    PRICE.IN.badge = IN_SLOTS[slot].badge;
  }

  var page    = location.pathname.split('/').pop() || 'index.html';
  var isPro   = localStorage.getItem('pus_pro') === '1';
  var country = localStorage.getItem('pus_ctry') || 'DEF';
  var timerSec= getSlotRemainingSeconds();
  var timerID = null;

  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var tzMap = {
      'Kolkata':'IN','Calcutta':'IN',
      'New_York':'US','Chicago':'US','Los_Angeles':'US','Denver':'US','Phoenix':'US',
      'London':'GB',
      'Paris':'EU','Berlin':'EU','Rome':'EU','Madrid':'EU','Amsterdam':'EU','Brussels':'EU',
      'Sydney':'AU','Melbourne':'AU','Brisbane':'AU','Adelaide':'AU','Perth':'AU',
      'Toronto':'CA','Vancouver':'CA','Edmonton':'CA',
      'Singapore':'SG',
      'Dubai':'AE','Abu_Dhabi':'AE'
    };
    for (var k in tzMap) {
      if (tz.indexOf(k) > -1) {
        country = tzMap[k]; localStorage.setItem('pus_ctry', country); break;
      }
    }
  } catch(e){}

  function P() {
    // Use plan-system.js PSGetPrice if available (keeps pricing.html prices in sync)
    if (window.PSGetPrice && window.PSDetectCtry) {
      try {
        var ctry = window.PSDetectCtry();
        var pp = window.PSGetPrice('pro', ctry);
        if (pp && pp.sale) return { sym: pp.sym, sale: pp.sale, orig: pp.orig, off: pp.off, cur: pp.cur };
      } catch(e) {}
    }
    // Fallback to local PRICE object
    refreshINPrice();
    return PRICE[country] || PRICE.DEF;
  }
  function T()   { if(getCurrentSlot()>=IN_SLOTS.length-1) return P().sym+P().sale; var m=Math.floor(timerSec/60),s=timerSec%60; return pad(m)+':'+pad(s); }
  function pad(n){ return n<10?'0'+n:''+n; }
  function $()   { return document.querySelector.apply(document, arguments); }
  function $$()  { return document.querySelectorAll.apply(document, arguments); }

  // Go to pricing page (main CTA everywhere)
  function goPricing(src) {
    if (isPro) return;
    window.location.href = 'pricing.html?src=' + (src||'upsell');
  }

  /* ══════════════════════════════════════
     CSS
  ══════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('pus-css')) return;
    var s = document.createElement('style');
    s.id = 'pus-css';
    s.textContent = `
/* TIMER BAR */
#pus-bar{position:relative;top:auto;left:auto;right:auto;z-index:auto;width:100%;box-sizing:border-box;background:linear-gradient(90deg,#4c1d95,#7c3aed,#9333ea,#db2777);color:#fff;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 44px 8px 14px;cursor:pointer;overflow:hidden;box-shadow:none}
#pus-bar::before{content:"";position:absolute;top:0;left:-100%;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:pus-sh 2.5s ease-in-out infinite}
@keyframes pus-sh{0%{left:-100%}70%,100%{left:140%}}
#pus-bar-cnt{background:rgba(255,255,255,.22);padding:2px 10px;border-radius:8px;font-size:14px;font-weight:900;letter-spacing:.5px;min-width:44px;text-align:center}
#pus-bar-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.2);border:none;color:#fff;width:26px;height:26px;border-radius:50%;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1}

/* STICKY BOTTOM */
#pus-sticky{position:fixed;bottom:0;left:0;right:0;z-index:9980;background:linear-gradient(90deg,#1e0a3c,#3b0764,#4c1d95);color:#fff;padding:11px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 -5px 24px rgba(91,33,182,.5);transform:translateY(120%);transition:transform .45s cubic-bezier(.34,1.4,.64,1)}
#pus-sticky.show{transform:translateY(0)}
#pus-sticky-txt{flex:1;font-size:12px;line-height:1.4}
#pus-sticky-txt b{color:#fbbf24;display:block;font-size:13px;font-weight:800}
#pus-sticky-btn{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border:none;border-radius:12px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;flex-shrink:0;animation:pus-pulse 1.8s ease infinite}
@keyframes pus-pulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}60%{box-shadow:0 0 0 10px rgba(245,158,11,0)}}
#pus-sticky-x{background:none;border:none;color:rgba(255,255,255,.4);font-size:22px;cursor:pointer;flex-shrink:0;padding:0;line-height:1}

/* FLOAT BTN */
#pus-float{position:fixed;bottom:82px;right:14px;z-index:9979;background:linear-gradient(135deg,#4c1d95,#9333ea,#db2777);color:#fff;border:none;border-radius:50px;padding:11px 17px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 6px 26px rgba(91,33,182,.55);display:flex;align-items:center;gap:6px;animation:pus-bob 2.6s ease-in-out infinite}
@keyframes pus-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
#pus-float:hover{animation:none;transform:scale(1.08)}

/* MODAL */
#pus-ov{position:fixed;inset:0;z-index:99998;background:rgba(5,0,20,.75);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:14px}
#pus-ov.show{display:flex}
#pus-modal{background:#fff;border-radius:26px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 32px 100px rgba(91,33,182,.35);animation:pus-in .32s cubic-bezier(.34,1.5,.64,1);max-height:92vh;overflow-y:auto}
@keyframes pus-in{from{transform:scale(.82) translateY(28px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.pus-mh{background:linear-gradient(135deg,#4c1d95,#6d28d9 45%,#db2777);padding:26px 22px 20px;text-align:center;color:#fff;position:relative}
.pus-mh-x{position:absolute;top:13px;right:15px;background:rgba(255,255,255,.22);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pus-mh-icon{font-size:44px;margin-bottom:8px;display:block}
.pus-mh-title{font-size:22px;font-weight:900;margin:0 0 6px;line-height:1.25}
.pus-mh-sub{font-size:13px;opacity:.88;margin:0 0 16px;line-height:1.5}
.pus-price-row{display:flex;align-items:center;justify-content:center;gap:11px}
.pus-price-num{font-size:44px;font-weight:900;font-family:Georgia,serif;line-height:1}
.pus-price-side{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.pus-price-orig{font-size:16px;text-decoration:line-through;opacity:.6}
.pus-price-off{background:rgba(255,255,255,.25);border-radius:8px;padding:3px 11px;font-size:11.5px;font-weight:800}
.pus-mb{padding:18px 20px 22px}
.pus-urgency{background:#fef2f2;border:1.5px solid #fecaca;border-radius:11px;padding:9px 14px;text-align:center;font-size:12.5px;color:#b91c1c;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:7px}
.pus-urgency-t{font-weight:900;font-size:14px;color:#dc2626}
.pus-feats{list-style:none;padding:0;margin:0 0 14px;display:flex;flex-direction:column;gap:8px}
.pus-feats li{display:flex;align-items:flex-start;gap:11px;font-size:13px;color:#1f2937;line-height:1.45}
.pus-chk{width:22px;min-width:22px;height:22px;background:linear-gradient(135deg,#5b21b6,#db2777);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;margin-top:1px;flex-shrink:0}
.pus-lock-note{background:linear-gradient(135deg,#fdf4ff,#fce7f3);border:1.5px dashed #c4b5fd;border-radius:12px;padding:13px 15px;margin-bottom:14px;text-align:center;font-size:12.5px;color:#6d28d9;font-weight:600;line-height:1.4}
.pus-go{width:100%;background:linear-gradient(135deg,#4c1d95,#7c3aed,#db2777);color:#fff;border:none;border-radius:17px;padding:18px;font-size:16.5px;font-weight:900;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(91,33,182,.45);transition:all .2s;letter-spacing:.3px;margin-bottom:12px}
.pus-go::after{content:"";position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:pus-sh 2.5s ease infinite}
.pus-go:hover{transform:translateY(-2px);box-shadow:0 13px 40px rgba(91,33,182,.55)}
.pus-proof{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;font-size:11.5px;color:#6b7280}
.pus-avs{display:flex}
.pus-av{width:27px;height:27px;border-radius:50%;background:linear-gradient(135deg,#6d28d9,#db2777);border:2.5px solid #fff;margin-left:-8px;font-size:12px;display:flex;align-items:center;justify-content:center;color:#fff}
.pus-av:first-child{margin-left:0}
.pus-skip{width:100%;background:#f9fafb;border:1.5px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:600;cursor:pointer;padding:11px;border-radius:12px;transition:all .18s;font-family:inherit}
.pus-skip:hover{background:#f3f4f6;border-color:#d1d5db;color:#374151}

/* INLINE BANNER */
.pus-banner{background:linear-gradient(135deg,#faf5ff,#fce7f3);border:1.5px solid #ddd6fe;border-radius:18px;padding:14px 16px;margin:12px 0;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .22s;text-decoration:none}
.pus-banner:hover{border-color:#a78bfa;box-shadow:0 5px 22px rgba(91,33,182,.14);transform:translateY(-2px)}
.pus-banner-ic{font-size:30px;flex-shrink:0;line-height:1}
.pus-banner-t{flex:1}
.pus-banner-title{font-size:13px;font-weight:800;color:#5b21b6;margin-bottom:2px}
.pus-banner-sub{font-size:11.5px;color:#7c3aed}
.pus-banner-arr{color:#7c3aed;font-size:24px;flex-shrink:0}

/* BLUR LOCK */
.pus-blur-wrap{position:relative;border-radius:17px;overflow:hidden;margin:10px 0}
.pus-blur-inner{filter:blur(7px);user-select:none;pointer-events:none}
.pus-blur-gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.65);backdrop-filter:blur(3px);gap:9px;padding:22px;text-align:center;cursor:pointer}
.pus-blur-ic{font-size:38px}
.pus-blur-title{font-size:15.5px;font-weight:900;color:#1f2937;margin:0}
.pus-blur-sub{font-size:12px;color:#6b7280;margin:0}
.pus-blur-btn{background:linear-gradient(135deg,#5b21b6,#db2777);color:#fff;border:none;border-radius:15px;padding:12px 26px;font-size:13.5px;font-weight:800;cursor:pointer;box-shadow:0 5px 18px rgba(91,33,182,.42);transition:all .2s}
.pus-blur-btn:hover{transform:scale(1.04)}

/* MODEL BADGE */
.pus-model{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#ede9fe,#fce7f3);border:1.5px solid #c4b5fd;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700;color:#5b21b6;cursor:pointer;transition:all .2s;white-space:nowrap;vertical-align:middle;margin-left:6px}
.pus-model:hover{background:linear-gradient(135deg,#ddd6fe,#fbcfe8);transform:scale(1.04)}
.pus-model-dot{width:7px;height:7px;background:#22c55e;border-radius:50%;display:inline-block;flex-shrink:0}
.pus-model-up{font-size:10px;color:#a21caf;margin-left:2px}

/* CREDIT WARNING STRIP */
#pus-credit-warn{background:linear-gradient(90deg,#7f1d1d,#991b1b,#b91c1c);color:#fff;padding:9px 14px;font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:8px;cursor:pointer;display:none}
#pus-credit-warn.show{display:flex}

/* SUCCESS */
#pus-success{position:fixed;inset:0;z-index:1000000;background:linear-gradient(135deg,#4c1d95,#7c3aed,#db2777);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:30px}
#pus-success.show{display:flex}

/* PRO FEATURE TEASER CARD */
.pus-teaser{background:linear-gradient(135deg,#1e0a3c,#2d1260,#4c1d95);border-radius:18px;padding:18px;margin:12px 0;color:#fff;cursor:pointer;position:relative;overflow:hidden;transition:all .22s}
.pus-teaser::before{content:"";position:absolute;top:-30%;right:-20%;width:120px;height:120px;background:radial-gradient(circle,rgba(219,39,119,.4),transparent 70%)}
.pus-teaser:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(91,33,182,.4)}
.pus-teaser-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:3px 10px;font-size:10.5px;font-weight:700;margin-bottom:10px}
.pus-teaser-title{font-size:16px;font-weight:900;margin-bottom:5px}
.pus-teaser-sub{font-size:12px;opacity:.82;line-height:1.5;margin-bottom:12px}
.pus-teaser-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border:none;border-radius:12px;padding:9px 18px;font-size:12.5px;font-weight:800;cursor:pointer}

/* PRO COMPARISON MINI */
.pus-mini-cmp{background:linear-gradient(135deg,#faf5ff,#ede9fe);border:1.5px solid #c4b5fd;border-radius:18px;padding:16px;margin:12px 0;overflow:hidden;box-shadow:0 4px 16px rgba(124,58,237,.10)}
.pus-mini-cmp-head{display:grid;grid-template-columns:1fr 52px 52px;gap:6px;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#fff;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;font-weight:800;text-align:center}
.pus-mini-cmp-row{display:grid;grid-template-columns:1fr 52px 52px;gap:6px;padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:12px;align-items:center;min-height:36px}
.pus-mini-cmp-row:last-child{border-bottom:none}
.pus-mini-cmp-feat{color:#374151;font-weight:600;font-size:12px;line-height:1.3}
.pus-mini-cmp-val{text-align:center;width:52px;display:flex;align-items:center;justify-content:center}
.tick{color:#16a34a;font-size:16px;font-weight:900}
.cross{color:#dc2626;font-size:14px}
.blur-ic{font-size:14px}
`;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════
     TIMER BAR
  ══════════════════════════════════════ */
  function buildTimerBar() {
    if (isPro || document.getElementById('pus-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'pus-bar';
    // Use slot info for label
    var slot = getCurrentSlot();
    var slotInfo = IN_SLOTS[slot];
    var isFinalSlot = (slot >= IN_SLOTS.length - 1);
    var cntHtml = isFinalSlot
      ? '<span id="pus-bar-cnt" style="background:rgba(255,255,255,.22);padding:2px 10px;border-radius:8px;font-size:14px;font-weight:900;">'+P().sym+P().sale+'</span>'
      : '<span id="pus-bar-cnt" style="background:rgba(255,255,255,.22);padding:2px 10px;border-radius:8px;font-size:14px;font-weight:900;min-width:44px;text-align:center">'+T()+'</span>';
    bar.innerHTML = '<span>\uD83D\uDD25</span><span id="pus-bar-lbl" style="opacity:.9">'+slotInfo.label+'</span>'+cntHtml+'<span style="opacity:.82;font-size:11.5px">'+P().badge+'</span>'
      + '<button id="pus-bar-x" onclick="event.stopPropagation();(function(){var b=document.getElementById(\'pus-bar\');if(b){b.style.display=\'none\';}})()">\u00D7</button>';
    bar.onclick = function(){ goPricing('timer_bar'); };

    // Insert INSIDE header so it pushes header down (no gap, no white)
    var hdr = document.querySelector('header, .main-header, .pg-hdr');
    if (hdr) {
      hdr.insertBefore(bar, hdr.firstChild);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    // DO NOT add marginTop - inserting inside header handles spacing

    timerID = setInterval(function(){
      // Check if slot should advance
      if (updateSlotIfNeeded()) {
        refreshINPrice();
        var newSlot = getCurrentSlot();
        var lbl = document.getElementById('pus-bar-lbl');
        if (lbl) lbl.textContent = IN_SLOTS[newSlot].label;
        // Update all visible prices
        document.querySelectorAll('.pus-price-live').forEach(function(el){ el.textContent = P().sale; });
        var sBtn = document.getElementById('pus-sticky-btn');
        if(sBtn) sBtn.innerHTML = 'Get Pro ' + P().sym + '<span class="pus-price-live">' + P().sale + '</span>';
        var fBtn = document.getElementById('pus-float');
        if(fBtn) fBtn.innerHTML = '\uD83D\uDC51 Pro ' + P().sym + '<span class="pus-price-live">' + P().sale + '</span>';
        var psEl = document.getElementById('pus-ps');
        if(psEl) psEl.textContent = P().sale;
        var barLbl = document.getElementById('pus-bar-lbl');
        if(barLbl) barLbl.textContent = IN_SLOTS[getCurrentSlot()].badge;
        // Flash red briefly to show price changed
        bar.style.background = 'linear-gradient(90deg,#991b1b,#dc2626,#991b1b)';
        setTimeout(function(){ bar.style.background = ''; }, 1500);
        timerSec = getSlotRemainingSeconds();
        if (newSlot >= IN_SLOTS.length - 1) { clearInterval(timerID); }
        return;
      }
      timerSec = Math.max(0, timerSec - 1);
      var el = document.getElementById('pus-bar-cnt');
      if (el) el.textContent = T();
      var ml = document.getElementById('pus-modal-t');
      if (ml) ml.textContent = T();
      if (timerSec === 0) clearInterval(timerID);
    }, 1000);
  }

  /* ══════════════════════════════════════
     STICKY BOTTOM
  ══════════════════════════════════════ */
  function buildSticky() {
    if (isPro || document.getElementById('pus-sticky')) return;
    var bar = document.createElement('div');
    bar.id = 'pus-sticky';
    bar.innerHTML = '<div id="pus-sticky-txt"><b>🔥 Go Pro — Unlock EVERYTHING!</b>Unlimited · No ads · Tripo 4.5 AI · Full results</div>'
      +'<button id="pus-sticky-btn" onclick="goPricing(\'sticky\')">Get Pro '+P().sym+'<span class="pus-price-live">'+P().sale+'</span></button>'
      +'<button id="pus-sticky-x" onclick="document.getElementById(\'pus-sticky\').remove()">×</button>';
    document.body.appendChild(bar);
    setTimeout(function(){ bar.classList.add('show'); }, 4000);
    window.addEventListener('scroll', function(){
      bar.classList.add('show');
    }, { passive:true, once:true });
  }

  /* ══════════════════════════════════════
     FLOAT BTN
  ══════════════════════════════════════ */
  function buildFloat() {
    if (isPro || document.getElementById('pus-float')) return;
    var btn = document.createElement('button');
    btn.id = 'pus-float';
    btn.innerHTML = '👑 Pro '+P().sym+'<span class="pus-price-live">'+P().sale+'</span>';
    btn.onclick = function(){ goPricing('float'); };
    document.body.appendChild(btn);
  }

  /* ══════════════════════════════════════
     MODAL (for low-credit & special cases)
  ══════════════════════════════════════ */
  function buildModal() {
    if (document.getElementById('pus-ov')) return;
    var ov = document.createElement('div');
    ov.id = 'pus-ov';
    ov.onclick = function(e){ if(e.target===ov) closeModal(); };
    ov.innerHTML = '<div id="pus-modal" role="dialog">'
      +'<div class="pus-mh">'
        +'<button class="pus-mh-x" onclick="window.pusClose()">×</button>'
        +'<span class="pus-mh-icon" id="pus-mi">👑</span>'
        +'<h2 class="pus-mh-title" id="pus-mt">Unlock Face AI Pro</h2>'
        +'<p class="pus-mh-sub" id="pus-ms">Get Tripo 4.5 + unlimited everything</p>'
        +'<div class="pus-price-row">'
          +'<div class="pus-price-num">'+P().sym+'<span id="pus-ps" class="pus-price-live">'+P().sale+'</span></div>'
          +'<div class="pus-price-side">'
            +'<span class="pus-price-orig">'+P().sym+P().orig+'</span>'
            +'<span class="pus-price-off">'+P().off+'</span>'
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div class="pus-mb">'
        +'<div class="pus-urgency">⏰ Offer ends in <span class="pus-urgency-t" id="pus-modal-t">'+T()+'</span> · Price goes up!</div>'
        +'<ul class="pus-feats">'
          +'<li><div class="pus-chk">✓</div><div><strong>Tripo 4.5</strong> — 3× more accurate AI</div></li>'
          +'<li><div class="pus-chk">✓</div><div><strong>Unlimited analyses</strong> — no limits ever</div></li>'
          +'<li><div class="pus-chk">✓</div><div><strong>Zero blur</strong> — 100% results visible</div></li>'
          +'<li><div class="pus-chk">✓</div><div><strong>Celebrity match + dark traits</strong> unlocked</div></li>'
          +'<li><div class="pus-chk">✓</div><div><strong>PDF download + zero ads</strong></div></li>'
          +'<li><div class="pus-chk">✓</div><div><strong>3× leaderboard XP</strong> boost</div></li>'
        +'</ul>'
        +'<div class="pus-lock-note">🔒 <strong>50% of results blurred right now.</strong><br>Pro removes every lock instantly after payment.</div>'
        +'<button class="pus-go pus-price-live-btn" onclick="goPricing(\'modal_cta\')">⚡ See Full Pricing — '+P().sym+'<span class="pus-price-live">'+P().sale+'</span> Only</button>'
        +'<div class="pus-proof"><div class="pus-avs"><div class="pus-av">😊</div><div class="pus-av">🎨</div><div class="pus-av">👑</div><div class="pus-av">🔮</div><div class="pus-av">⚡</div></div><span>4,218 people upgraded this week</span></div>'
        +'<button class="pus-skip" onclick="window.pusClose()">Check Later</button>'
      +'</div>'
    +'</div>';
    document.body.appendChild(ov);
  }

  /* ══════════════════════════════════════
     OPEN/CLOSE
  ══════════════════════════════════════ */
  window.pusOpen = openModal;
  window.pusClose = closeModal;
  window.pusOpenPay = function(){ goPricing('pay_btn'); };
  window.pusClosePay = closeModal;
  window.proUpsellGate = function(){ goPricing('gate'); };
  window.__pusOpen = function(){ goPricing('legacy'); };
  window.__pusClose = closeModal;
  window.goPricing = goPricing;

  function openModal(src, title, body, icon) {
    if (isPro) return;
    var ov = document.getElementById('pus-ov');
    if (!ov) return;
    if (title) { var el=document.getElementById('pus-mt'); if(el) el.textContent=title; }
    if (body)  { var el2=document.getElementById('pus-ms'); if(el2) el2.textContent=body; }
    if (icon)  { var el3=document.getElementById('pus-mi'); if(el3) el3.textContent=icon; }
    ov.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeModal() {
    var ov=document.getElementById('pus-ov');
    if(ov){ ov.classList.remove('show'); document.body.style.overflow=''; }
  }

  /* ══════════════════════════════════════
     RAZORPAY (called from pricing.html)
     Also expose globally for pricing.html
  ══════════════════════════════════════ */
  window.pusFireRazorpay = function() {
    if(!window.Razorpay){
      var s=document.createElement('script');
      s.src='https://checkout.razorpay.com/v1/checkout.js';
      s.onload=doRzp;
      s.onerror=function(){ alert('Could not load Razorpay. Check internet connection.'); };
      document.head.appendChild(s);
    } else { doRzp(); }
  };

  function doRzp() {
    var p = P();
    try {
      new window.Razorpay({
        key: RZP_KEY,
        amount: parseInt(p.sale,10)*100,
        currency: p.cur,
        name: 'Face AI Pro',
        description: 'Pro Lifetime · Tripo 4.5',
        image: '/favicon.ico',
        theme: { color:'#7c3aed' },
        handler: function(res){
          localStorage.setItem('pus_pro','1');
          localStorage.setItem('pus_pay_id', res.razorpay_payment_id||'done');
          isPro=true; closeModal();
          var ss=document.getElementById('pus-success');
          if(ss) ss.classList.add('show');
        },
        modal:{ ondismiss:function(){} }
      }).open();
    } catch(e){ alert('Payment error: '+e.message); }
  }

  /* ══════════════════════════════════════
     MODEL BADGE
  ══════════════════════════════════════ */
  function injectModelBadge() {
    var left=$('.hdr-brand-left, .hdr-brand-info, .pg-hdr-left');
    if(!left || $('.pus-model')) return;
    var b=document.createElement('span');
    b.className='pus-model';
    b.title=isPro?'Using Tripo 4.5 Pro':'Click to upgrade to Tripo 4.5';
    b.onclick=function(){ if(!isPro) goPricing('model_badge'); };
    b.innerHTML='<span class="pus-model-dot"></span>🤖 '+(isPro?'Tripo 4.5 Pro':'Tripo 2.9')+(!isPro?' <span class="pus-model-up">▲ Upgrade</span>':'');
    left.appendChild(b);
  }

  /* ══════════════════════════════════════
     HELPER: make a banner div
  ══════════════════════════════════════ */
  function mkBanner(icon, title, sub, src) {
    var d=document.createElement('div');
    d.className='pus-banner';
    d.onclick=function(){ goPricing(src); };
    d.innerHTML='<div class="pus-banner-ic">'+icon+'</div>'
      +'<div class="pus-banner-t"><div class="pus-banner-title">'+title+'</div>'
      +'<div class="pus-banner-sub">'+sub+'</div></div>'
      +'<div class="pus-banner-arr">›</div>';
    return d;
  }

  /* ══════════════════════════════════════
     HELPER: teaser dark card
  ══════════════════════════════════════ */
  function mkTeaser(icon, title, sub, btnText, src) {
    var d=document.createElement('div');
    d.className='pus-teaser';
    d.onclick=function(){ goPricing(src); };
    d.innerHTML='<div class="pus-teaser-badge">🔒 PRO ONLY</div>'
      +'<div class="pus-teaser-title">'+icon+' '+title+'</div>'
      +'<div class="pus-teaser-sub">'+sub+'</div>'
      +'<button class="pus-teaser-btn">'+btnText+' '+P().sym+P().sale+' →</button>';
    return d;
  }

  /* ══════════════════════════════════════
     HELPER: mini comparison table
  ══════════════════════════════════════ */
  function mkMiniCmp(rows) {
    var d=document.createElement('div');
    d.className='pus-mini-cmp';
    d.onclick=function(){ goPricing('mini_cmp'); };
    d.style.cursor='pointer';
    var html='<div class="pus-mini-cmp-head"><div>Feature</div><div>Free</div><div style="color:#fbbf24">Pro ⚡</div></div>';
    rows.forEach(function(r){
      html+='<div class="pus-mini-cmp-row">'
        +'<div class="pus-mini-cmp-feat">'+r[0]+'</div>'
        +'<div class="pus-mini-cmp-val">'+(r[1]==='❌'?'<span style="color:#ef4444;font-size:18px">✗</span>':r[1]==='✓'?'<span style="color:#10b981;font-size:18px">✓</span>':r[1])+'</div>'
        +'<div class="pus-mini-cmp-val">'+(r[2]==='✓'?'<span style="color:#7c3aed;font-size:18px;font-weight:900">✓</span>':r[2]==='❌'?'<span style="color:#ef4444;font-size:18px">✗</span>':r[2])+'</div>'
        +'</div>';
    });
    html+='<div style="text-align:center;padding:12px 0 4px"><button style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;border-radius:14px;padding:12px 28px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.35);width:100%">👑 See Full Plans →</button></div>';
    d.innerHTML=html;
    return d;
  }

  /* ══════════════════════════════════════
     BLUR LOCK (result cards)
  ══════════════════════════════════════ */
  function setupResultBlur() {
    if(isPro || !page.includes('faceanalyze')) return;
    var obs=new MutationObserver(function(){
      var card=document.getElementById('dynamicResultCard');
      if(!card||card.style.display==='none'||card.dataset.pusBlurred) return;
      card.dataset.pusBlurred='1';
      // Blur crazy-cards section
      var cw=card.querySelector('.crazy-cards-wrap');
      if(cw && !cw.querySelector('.pus-blur-wrap')){
        var ch=Array.from(cw.children);
        if(ch.length>1){
          var wrap=document.createElement('div'); wrap.className='pus-blur-wrap';
          var inner=document.createElement('div'); inner.className='pus-blur-inner';
          ch.slice(1).forEach(function(c){ inner.appendChild(c); });
          var gate=document.createElement('div'); gate.className='pus-blur-gate';
          gate.onclick=function(){ goPricing('result_blur'); };
          gate.innerHTML='<div class="pus-blur-ic">🔒</div>'
            +'<p class="pus-blur-title">Celebrity Match & Dark Traits Locked</p>'
            +'<p class="pus-blur-sub">Past life reading also hidden on free plan</p>'
            +'<button class="pus-blur-btn" onclick="goPricing(\'blur_btn\')">👑 Unlock Pro — '+P().sym+P().sale+'</button>';
          wrap.appendChild(inner); wrap.appendChild(gate); cw.appendChild(wrap);
        }
      }
      // Blur extra stats
      var stats=card.querySelectorAll('.stat-item,.face-stat,[class*="stat-"]');
      if(stats.length>3){
        Array.from(stats).slice(3).forEach(function(s){
          s.style.filter='blur(5px)'; s.style.cursor='pointer';
          s.onclick=function(){ goPricing('stat_blur'); };
        });
      }
      // Banner inside result
      if(!card.querySelector('.pus-banner')){
        var b=mkBanner('🔓','Unlock your FULL personality report','Celebrity, dark traits & past life revealed — Pro '+P().sym+P().sale,'result_inline');
        b.style.margin='14px 0';
        var actions=card.querySelector('.dynamic-actions');
        var inner2=card.querySelector('.dynamic-result-inner');
        if(inner2&&actions) inner2.insertBefore(b,actions);
      }
    });
    obs.observe(document.body,{childList:true,subtree:true});
  }

  /* ══════════════════════════════════════
     PAGE-SPECIFIC 8+ PROMOTIONS INJECTED
  ══════════════════════════════════════ */
  function injectPagePromos() {
    if(isPro) return;
    setTimeout(function(){

      // ═══ HOME PAGE ═══
      if(page==='index.html'||page===''){
        // 1. After hero tagline block
        var hero=$('.hero-tagline-block,.hero-tagline-inner');
        if(hero) hero.insertAdjacentElement('afterend',
          mkBanner('⚡','Free plan = 2 analyses/day only','1,000 credits, 500 per analysis. Go Pro for unlimited → '+P().sym+P().sale,'home_1'));
        // 2. After welcome screen
        var ws=document.getElementById('welcomeScreen');
        if(ws) ws.insertAdjacentElement('afterend',
          mkTeaser('🔮','Celebrity Match + Dark Traits Locked','Your face detected 3 celebrity lookalikes & hidden personality traits — all blurred on free plan.','Unlock All Results','home_2'));
        // 3. Comparison mini table
        var btn=$('.fun-card-btn');
        if(btn) btn.parentElement.insertAdjacentElement('afterend',
          mkMiniCmp([
            ['Daily analyses','2 only','Unlimited ♾️'],
            ['Celebrity match','🌫️ Blurred','✓ Visible'],
            ['Dark traits','🌫️ Blurred','✓ Visible'],
            ['Ads shown','Every page','Zero ads'],
            ['AI Model','Tripo 2.9','Tripo 4.5'],
          ]));
        // 4. After compare card
        var cmpCard=$('.fun-card--compare');
        if(cmpCard) cmpCard.insertAdjacentElement('afterend',
          mkBanner('📊','Comparison report = Pro only','Full compatibility % & detailed match → '+P().sym+P().sale,'home_4'));
        // 5. Before leaderboard section
        var lbsec=$('[class*="leaderboard"],[class*="global"],[class*="country"]');
        if(lbsec) lbsec.insertAdjacentElement('beforebegin',
          mkBanner('🏆','Leaderboard 3× XP = Pro only','Free users earn 1× points. Pro users earn 3× and always rank higher → '+P().sym+P().sale,'home_5'));
        // 6. Teaser before how-it-works
        var hiw=$('.how-works,.step-wrap,[class*="how"]');
        if(hiw) hiw.insertAdjacentElement('beforebegin',
          mkTeaser('🎂','Skin Age & Eye Age Analysis Locked','AI detected your exact skin age and eye age. Free plan only shows basic detected age.','Unlock Deep Analysis','home_6'));
        // 7. Before reviews
        var revs=$('[class*="review"],[class*="testimonial"],.reviews-section');
        if(revs) revs.insertAdjacentElement('beforebegin',
          mkMiniCmp([
            ['Past life reading','❌ Locked','✓ Revealed'],
            ['Golden ratio score','❌ Locked','✓ Full score'],
            ['PDF download','❌ Locked','✓ Download'],
            ['Leaderboard XP','1×','3× Boost'],
          ]));
        // 8. Before FAQ section
        var faq=$('[class*="faq"],[class*="question"]');
        if(faq) faq.insertAdjacentElement('beforebegin',
          mkBanner('👑','4,218 people upgraded this week','Join them → Tripo 4.5 + unlimited + zero blur → '+P().sym+P().sale,'home_8'));
        // 9. Ad placeholder strip
        var adBlock=$('.pg-ad, .adsbygoogle');
        if(adBlock) adBlock.insertAdjacentElement('beforebegin',
          mkBanner('📢','Tired of ads? Go Pro for zero ads','Pro removes every ad on every page → '+P().sym+P().sale,'home_9'));
      }

      // ═══ FACEANALYZE ═══
      if(page.includes('faceanalyze')){
        // 1. In info screen
        var infoScr=document.getElementById('infoScreen');
        if(infoScr) infoScr.insertAdjacentElement('afterbegin',
          mkBanner('🔮','Free plan = 2 analyses/day (500 credits each)','Go Pro for unlimited analyses → '+P().sym+P().sale,'fa_1'));
        // 2. After upload cards
        var uploadCards=$('.upload-options');
        if(uploadCards) uploadCards.insertAdjacentElement('afterend',
          mkBanner('🤖','Tripo 2.9 AI active (free). Upgrade to Tripo 4.5','3× more accurate results with Pro AI model → '+P().sym+P().sale,'fa_2'));
        // 3. Feature list area
        var featList=$('.fa-feat,.fa-features');
        if(featList) featList.insertAdjacentElement('afterend',
          mkTeaser('⭐','Celebrity Match Will Be Blurred','After analysis, your celebrity lookalike results will be hidden. Pro users see full matches.','Unlock Before Analysis','fa_3'));
        // 4. After result hero (set by observer too)
        var resultHero=$('.result-hero');
        if(resultHero) resultHero.insertAdjacentElement('afterend',
          mkBanner('🔒','50% of your result is blurred!','Celebrity match, dark traits & past life = Pro only → '+P().sym+P().sale,'fa_4'));
        // 5. Mini comparison
        var faFooter=$('.fa-footer-badges,.fa-footer');
        if(faFooter) faFooter.insertAdjacentElement('beforebegin',
          mkMiniCmp([
            ['Daily analyses','2 only','Unlimited'],
            ['Celebrity match','🌫️ Blurred','✓ Full list'],
            ['Dark traits','🌫️ Blurred','✓ Revealed'],
            ['Past life','🌫️ Blurred','✓ Full story'],
          ]));
        // 6. Banner near share buttons
        var shareBtns=$('[class*="share"],[onclick*="share"]');
        if(shareBtns) shareBtns.insertAdjacentElement('afterend',
          mkBanner('📄','PDF download = Pro only','Save & share your full report as PDF → '+P().sym+P().sale,'fa_6'));
        // 7-8: Teasers near feature cards
        var feats=$$('.fa-feat');
        if(feats.length>3){
          feats[2].insertAdjacentElement('afterend',mkTeaser('🪞','Golden Ratio Score = Pro Only','Your φ score & 6-organ symmetry breakdown locked on free plan.','Unlock Score','fa_7'));
        }
      }

      // ═══ LEADERBOARD ═══
      if(page.includes('leaderboard')){
        // 1. After my-rank card
        var myCard=$('.lb-my-card');
        if(myCard) myCard.insertAdjacentElement('afterend',
          mkBanner('🏆','You earn 1× XP. Pro users earn 3×!','They rank higher faster. Go Pro and dominate → '+P().sym+P().sale,'lb_1'));
        // 2. Before rewards table
        var rewTable=$('.lb-cr-table,.pg-sec');
        if(rewTable) rewTable.insertAdjacentElement('beforebegin',
          mkTeaser('🥇','Pro Users Dominate Top 10','Pro members earn 3× points. The leaderboard top 10 is almost always Pro users.','Get 3× XP Boost','lb_2'));
        // 3. After global list
        var lbList=document.getElementById('lbList');
        if(lbList) lbList.insertAdjacentElement('afterend',
          mkMiniCmp([
            ['Leaderboard XP','1× only','3× Boost 🚀'],
            ['Daily analyses','2 only','Unlimited'],
            ['Result unlock','Partial 🌫️','100% visible'],
          ]));
        // 4. Before country section
        var countrySec=document.getElementById('lbTab-country');
        if(countrySec) countrySec.insertAdjacentElement('afterbegin',
          mkBanner('🌍','Country ranking = Pro users lead','Help your country rank #1 with Pro 3× XP → '+P().sym+P().sale,'lb_4'));
        // 5. Streak section
        var streakSec=document.getElementById('lbTab-streak');
        if(streakSec) streakSec.insertAdjacentElement('afterbegin',
          mkBanner('🔥','Streak XP also 3× with Pro','Every streak day earns triple points for Pro users → '+P().sym+P().sale,'lb_5'));
        // 6-8. Teasers in FAQ
        var faqSec=$('section');
        if(faqSec) faqSec.insertAdjacentElement('afterbegin',
          mkTeaser('📊','Pro Members See Full Analytics','Advanced leaderboard stats, country breakdown & streak analytics = Pro only features.','Unlock Analytics','lb_6'));
      }

      // ═══ SYMMETRY ═══
      if(page.includes('symettery')){
        // 1. Hero
        var symHero=$('.sym-hero,.s1-note');
        if(symHero) symHero.insertAdjacentElement('beforebegin',
          mkBanner('🪞','Full symmetry report = Pro only','Golden ratio + 6 organ scores + beauty grade → '+P().sym+P().sale,'sym_1'));
        // 2. After result header
        var resHdr=$('.res-hdr');
        if(resHdr) resHdr.insertAdjacentElement('afterend',
          mkTeaser('⚖️','Detailed Symmetry Breakdown Locked','Golden ratio φ score, eye symmetry %, nose %, lip %, jaw %, cheek % — all blurred on free.','Unlock Full Report','sym_2'));
        // 3. Mini compare
        var resSec=$('#sc4,.res-ring-wrap');
        if(resSec) resSec.insertAdjacentElement('afterend',
          mkMiniCmp([
            ['Basic symmetry %','✓','✓'],
            ['Golden ratio score','❌','✓'],
            ['6 organ scores','❌','✓'],
            ['Beauty grade','❌','✓'],
          ]));
        // 4-8 More banners
        var ringWrap=$('.res-ring-wrap');
        if(ringWrap) ringWrap.insertAdjacentElement('afterend',
          mkBanner('💎','Beauty grade & golden ratio = Pro only','Free shows % only. Pro shows full φ breakdown → '+P().sym+P().sale,'sym_4'));
        var habSec=$('.habits-section,.habit-tips');
        if(habSec) habSec.insertAdjacentElement('beforebegin',
          mkBanner('✨','Improvement tips = Pro feature','Personalized face symmetry improvement guide → '+P().sym+P().sale,'sym_5'));
      }

      // ═══ AGE DETECTOR ═══
      if(page.includes('agedetector')){
        var ageHero=$('.ad-hero,.age-hero,h1');
        if(ageHero) ageHero.insertAdjacentElement('afterend',
          mkBanner('🎂','Skin age + eye age = Pro only','Free shows detected age only. Pro gives full breakdown → '+P().sym+P().sale,'age_1'));
        var ageRes=$('[id*="result"],[class*="result"]');
        if(ageRes) ageRes.insertAdjacentElement('afterbegin',
          mkTeaser('🔭','Future Face Prediction = Pro Only','See how you\'ll look in 10 years + skin age + eye age + detailed age breakdown.','Unlock Deep Analysis','age_2'));
        var ageCmp=$('[class*="age-modal"],[class*="face-modal"]');
        if(ageCmp) ageCmp.insertAdjacentElement('afterend',
          mkMiniCmp([
            ['Detected age','✓','✓'],
            ['Skin age','❌','✓'],
            ['Eye age','❌','✓'],
            ['Future face','❌','✓'],
          ]));
      }

      // ═══ COMPARE ═══
      if(page.includes('compareface')){
        // Banner after hero tagline block
        var cmpHero=$('.hero-tagline-block,h2,h1');
        if(cmpHero) cmpHero.insertAdjacentElement('afterend',
          mkBanner('📊','Compatibility % = Pro only','Free shows basic match. Pro gives full score + report → '+P().sym+P().sale,'cmp_1'));
        // Teaser inside result card
        var cmpResult=$('[class*="result"],[id*="result"]');
        if(cmpResult) cmpResult.insertAdjacentElement('afterbegin',
          mkTeaser('💞','Personality Compatibility Score Locked','Your exact % compatibility, strength/weakness breakdown & PDF = Pro only features.','Unlock Full Report','cmp_2'));
        // Mini comparison: inject INSIDE screen 0 (welcome card) NOT after header button
        var cmpTarget=$('#cfScreen0 .amc-s');
        if(!cmpTarget) cmpTarget=$('#cfScreen0');
        if(cmpTarget){
          var miniCmpWrap=document.createElement('div');
          miniCmpWrap.style.cssText='padding:0 0 12px;';
          miniCmpWrap.appendChild(mkMiniCmp([
            ['Basic comparison','✓','✓'],
            ['Compatibility %','❌','✓'],
            ['PDF report','❌','✓'],
            ['Detailed traits','❌','✓'],
          ]));
          cmpTarget.appendChild(miniCmpWrap);
        }
      }

      // ═══ FUTURE ═══
      if(page.includes('future')){
        var futMain=$('main,body');
        if(futMain) futMain.insertAdjacentElement('afterbegin',
          mkBanner('🔮','Deep destiny reading = Pro only','Wealth signals, career path & love forecast locked → '+P().sym+P().sale,'fut_1'));
        var futCards=$('[class*="future"],[class*="card"]');
        if(futCards) futCards.insertAdjacentElement('afterend',
          mkTeaser('💰','Wealth & Love Forecast = Pro Only','Detailed wealth signals, relationship compatibility & life path analysis = Pro features.','Unlock Destiny','fut_2'));
      }

      // ═══ MISSION ═══
      if(page.includes('mission')){
        var misMission=$('[class*="mission"],[class*="xp"]');
        if(misMission) misMission.insertAdjacentElement('afterbegin',
          mkBanner('🎯','2× XP on all missions = Pro only','Complete missions faster with Pro double XP → '+P().sym+P().sale,'mis_1'));
        var misCards=$$('[class*="mission-card"],[class*="task"]');
        if(misCards.length>0) misCards[0].insertAdjacentElement('afterend',
          mkTeaser('⚡','Pro Missions Unlocked','Exclusive Pro-only missions with higher XP rewards. Only visible to Pro members.','Unlock Missions','mis_2'));
      }

      // ═══ SETTINGS ═══
      if(page.includes('settings')){
        var setMain=$('main,[class*="settings"]');
        if(setMain) setMain.insertAdjacentElement('afterbegin',
          mkBanner('⚙️','Advanced settings = Pro only','Custom themes, AI model switch & priority speed → '+P().sym+P().sale,'set_1'));
        var setItems=$$('[class*="setting-item"],[class*="option"]');
        if(setItems.length>2) setItems[1].insertAdjacentElement('afterend',
          mkTeaser('🎨','Custom Themes = Pro Only','Personalize the entire app with Pro-only color themes and dark mode variants.','Unlock Themes','set_2'));
      }

    }, 1000);
  }

  /* ══════════════════════════════════════
     CREDIT WARNING
  ══════════════════════════════════════ */
  function setupCreditWarning() {
    if(isPro) return;
    setInterval(function(){
      var credits = parseInt(localStorage.getItem('afa_credits')||'1000',10);
      var warn = document.getElementById('pus-credit-warn');
      if(!warn) return;
      if(credits<=500 && credits>0){
        warn.classList.add('show');
        warn.innerHTML='⚡ Only '+credits+' credits left! ('+Math.floor(credits/500)+' analysis remaining) <strong style="margin-left:auto">→ Get Unlimited</strong>';
      } else if(credits<=0){
        warn.classList.add('show');
        warn.innerHTML='❌ Credits exhausted! Come back tomorrow for 1,000 free credits OR go Pro for unlimited. <strong style="margin-left:auto">→ Go Pro</strong>';
      } else {
        warn.classList.remove('show');
      }
    }, 3000);
  }

  /* ══════════════════════════════════════
     LOW CREDIT MODAL FIX
  ══════════════════════════════════════ */
  function fixLowCreditModal() {
    // Override the existing lowCreditModal to redirect to pricing
    var lcm=document.getElementById('lowCreditModal');
    if(lcm){
      lcm.innerHTML='<div class="modal-compact" style="text-align:center">'
        +'<div style="font-size:48px;margin-bottom:12px">⚡</div>'
        +'<h3 style="font-size:18px;font-weight:900;margin-bottom:8px;color:#1f2937">Credits Exhausted!</h3>'
        +'<p style="color:#6b7280;font-size:13px;margin-bottom:6px">Free plan: <strong>1,000 credits/day</strong></p>'
        +'<p style="color:#6b7280;font-size:13px;margin-bottom:16px">Each analysis costs <strong>500 credits</strong> (2 analyses/day)</p>'
        +'<div style="background:#faf5ff;border-radius:12px;padding:12px;margin-bottom:16px;font-size:12.5px;color:#5b21b6;font-weight:600">'
          +'👑 Pro = Unlimited analyses · No credit limits · Ever'
        +'</div>'
        +'<button onclick="goPricing(\'low_credit_modal\')" style="width:100%;background:linear-gradient(135deg,#5b21b6,#db2777);color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:10px">⚡ Get Pro — '+P().sym+P().sale+' Only</button>'
        +'<button onclick="document.getElementById(\'lowCreditModal\').classList.remove(\'show\')" style="background:none;border:none;color:#9ca3af;font-size:12px;cursor:pointer;display:block;width:100%">Wait for daily reset (24h)</button>'
        +'</div>';
    }
  }

  /* ══════════════════════════════════════
     PAGE POPUP (auto, once per session)
  ══════════════════════════════════════ */
  function pageAutoPopup() {
    if(isPro) return;
    var msgs = {
      'faceanalyze.html':{ t:'⚡ Only 2 Free Analyses/Day', b:'Free plan gives 1,000 credits (500 per analysis = 2 analyses). Go Pro for unlimited!', i:'⚡', d:12000 },
      'leaderboard.html':{ t:'🏆 Pro Users Always Lead Here', b:'Pro members earn 3× leaderboard points on every analysis.', i:'🏆', d:6000 },
      'index.html':      { t:'🔒 Free = 30% of Results', b:'Celebrity match, dark traits, past life all blurred on free plan. Pro reveals everything.', i:'🔒', d:10000 },
    };
    var cfg=msgs[page]; if(!cfg) return;
    var key='pus_popup_'+page;
    if(sessionStorage.getItem(key)) return;
    setTimeout(function(){
      sessionStorage.setItem(key,'1');
      openModal('auto', cfg.t, cfg.b, cfg.i);
    }, cfg.d);
  }

  /* ══════════════════════════════════════
     EXIT INTENT
  ══════════════════════════════════════ */
  function exitIntent() {
    if(isPro||sessionStorage.getItem('pus_exit')) return;
    document.addEventListener('mouseleave',function h(e){
      if(e.clientY<5){
        document.removeEventListener('mouseleave',h);
        sessionStorage.setItem('pus_exit','1');
        openModal('exit','⚠️ Going Back for Free?','Grab Pro at '+P().sym+P().sale+' before this expires. Price goes up at midnight!','⚠️');
      }
    });
    history.pushState(null,'',location.href);
    window.addEventListener('popstate',function h(){
      window.removeEventListener('popstate',h);
      if(!sessionStorage.getItem('pus_mob_exit')&&!isPro){
        sessionStorage.setItem('pus_mob_exit','1');
        history.pushState(null,'',location.href);
        goPricing('back_button');
      }
    });
  }

  /* ══════════════════════════════════════
     SUCCESS OVERLAY
  ══════════════════════════════════════ */
  function buildSuccess() {
    if(document.getElementById('pus-success')) return;
    var d=document.createElement('div');
    d.id='pus-success';
    d.innerHTML='<div style="font-size:72px;margin-bottom:16px">🎉</div>'
      +'<h2 style="font-size:28px;font-weight:900;margin:0 0 8px">Welcome to Pro!</h2>'
      +'<p style="font-size:15px;opacity:.88;margin:0 0 12px;max-width:280px">Tripo 4.5 + unlimited + zero blur activated!</p>'
      +'<div style="background:rgba(255,255,255,.15);border-radius:14px;padding:13px 20px;margin:0 0 24px;font-size:13px;line-height:1.7">✅ Unlimited · ✅ No ads · ✅ Full results · ✅ Tripo 4.5</div>'
      +'<button onclick="location.reload()" style="background:#fff;color:#5b21b6;border:none;border-radius:18px;padding:15px 40px;font-size:16px;font-weight:900;cursor:pointer">🚀 Start Using Pro!</button>';
    document.body.appendChild(d);
  }

  /* ══════════════════════════════════════
     CREDIT WARNING BAR (below header)
  ══════════════════════════════════════ */
  function buildCreditWarnBar() {
    if(isPro||document.getElementById('pus-credit-warn')) return;
    var bar=document.createElement('div');
    bar.id='pus-credit-warn';
    bar.onclick=function(){ goPricing('credit_warn'); };
    var hdr=$('header,.main-header,.pg-hdr');
    if(hdr) hdr.insertAdjacentElement('afterend',bar);
    else document.body.insertAdjacentElement('afterbegin',bar);
  }

  /* ══════════════════════════════════════
     INIT
  ══════════════════════════════════════ */
  function init() {
    injectCSS();
    if(!isPro){
      buildTimerBar();
      buildSticky();
      buildFloat();
      buildCreditWarnBar();
    }
    buildModal();
    buildSuccess();
    setTimeout(function(){
      injectModelBadge();
      injectPagePromos();
      setupResultBlur();
      fixLowCreditModal();
      setupCreditWarning();
      pageAutoPopup();
      setTimeout(exitIntent,7000);
    },400);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else { init(); }

})();

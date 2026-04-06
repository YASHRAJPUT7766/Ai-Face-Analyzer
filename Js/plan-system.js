/**
 * plan-system.js — AI Face Analyzer v4
 * ─────────────────────────────────────────────────────────────
 * Plans: Free | Basic (3 days) | Pro (30 days)
 * ✅ Dynamic slot-based pricing (price badhta ghata rahega)
 * ✅ India: Basic ₹20–₹70, Pro ₹249–₹400
 * ✅ International: Basic $0.50–$1.50, Pro $5–$10 range
 * ✅ 99% OFF shown everywhere (Basic plan)
 * ✅ Email + Secret Code → Firestore
 * ✅ URL ?uid=TOKEN cross-device sync
 * ✅ Restore: email + secret code
 */

(function () {
  'use strict';

  /* ── Firebase ──────────────────────────────────────────────── */
  var FB_KEY  = 'YOUR_FIREBASE_API_KEY';
  var FB_PROJ = 'yash-software';
  var FB_BASE = 'https://firestore.googleapis.com/v1/projects/' + FB_PROJ
              + '/databases/(default)/documents/';

  /* ── Razorpay ──────────────────────────────────────────────── */
  var RZP_KEY = 'YOUR_RAZORPAY_LIVE_KEY';

  /* ── Plans config ──────────────────────────────────────────── */
  var PLAN_CONFIG = {
    basic: { days: 3,  credits: 5000, name: 'Basic' },
    pro:   { days: 30, credits: -1,   name: 'Pro'   }
  };

  /* ── SLOT SYSTEM ────────────────────────────────────────────
     Slots stored in localStorage with daily reset.
     Price increases as slots reduce.
     India Basic: ₹20 (>15 slots) → ₹35 (10-15) → ₹49 (5-10) → ₹70 (<5)
     India Pro:   ₹249 → ₹299 → ₹349 → ₹400
  ────────────────────────────────────────────────────────────── */
  var SLOT_KEY     = 'ps_slots_v1';
  var SLOT_DATE_KEY = 'ps_slots_date';
  var TOTAL_SLOTS  = 20; // shown max

  function getSlots() {
    var today = new Date().toDateString();
    var savedDate = localStorage.getItem(SLOT_DATE_KEY);
    if (savedDate !== today) {
      // Daily reset with random between 7-18
      var fresh = 7 + Math.floor(Math.random() * 12);
      localStorage.setItem(SLOT_KEY, String(fresh));
      localStorage.setItem(SLOT_DATE_KEY, today);
      return fresh;
    }
    var s = parseInt(localStorage.getItem(SLOT_KEY) || '12');
    return isNaN(s) ? 12 : Math.max(1, s);
  }

  function decrementSlot() {
    var s = getSlots();
    if (s > 1) {
      localStorage.setItem(SLOT_KEY, String(s - 1));
    }
  }

  // Call this to expose slot count globally
  window.PSGetSlots = getSlots;

  /* ── Dynamic price tiers based on slots ────────────────────── */
  // Returns { sale, orig, off, unit } adjusted for slots
  function dynPrice(base, ctry, planType) {
    var slots = getSlots();
    var multiplier;
    if (slots > 15)      multiplier = 1.0;   // cheapest
    else if (slots > 10) multiplier = 1.2;
    else if (slots > 5)  multiplier = 1.4;
    else if (slots > 3)  multiplier = 1.7;
    else                 multiplier = 2.0;   // most expensive

    // India has special fixed tiers
    if (ctry === 'IN') {
      if (planType === 'basic') {
        var basicTiers = [20, 35, 49, 59, 70];
        var bIdx = slots > 15 ? 0 : slots > 10 ? 1 : slots > 5 ? 2 : slots > 3 ? 3 : 4;
        return {
          sale: String(basicTiers[bIdx]),
          orig: '2999',
          off: '99% OFF',
          unit: basicTiers[bIdx] * 100,
          sym: '₹',
          cur: 'INR'
        };
      } else {
        var proTiers = [249, 299, 349, 379, 400];
        var pIdx = slots > 15 ? 0 : slots > 10 ? 1 : slots > 5 ? 2 : slots > 3 ? 3 : 4;
        return {
          sale: String(proTiers[pIdx]),
          orig: '29999',
          off: '99% OFF',
          unit: proTiers[pIdx] * 100,
          sym: '₹',
          cur: 'INR'
        };
      }
    }

    // International: apply multiplier to base
    var saleNum = parseFloat(base.sale) * multiplier;
    saleNum = parseFloat(saleNum.toFixed(2));
    return {
      sale: String(saleNum),
      orig: base.orig,
      off:  '99% OFF',
      unit: Math.round(saleNum * 100),
      sym:  base.sym,
      cur:  base.cur
    };
  }

  /* ── Base Prices (international, before slot adjustment) ────── */
  var BASE_PRICES = {
    basic: {
      IN:  { sym:'₹',   sale:'49',    orig:'2999',   cur:'INR' },
      US:  { sym:'$',   sale:'0.49',  orig:'49.99',  cur:'USD' },
      GB:  { sym:'£',   sale:'0.39',  orig:'39.99',  cur:'GBP' },
      CA:  { sym:'C$',  sale:'0.65',  orig:'64.99',  cur:'CAD' },
      AU:  { sym:'A$',  sale:'0.75',  orig:'74.99',  cur:'AUD' },
      AE:  { sym:'AED', sale:'1.8',   orig:'179.99', cur:'AED' },
      SA:  { sym:'SAR', sale:'1.8',   orig:'179.99', cur:'SAR' },
      EU:  { sym:'€',   sale:'0.45',  orig:'44.99',  cur:'EUR' },
      SG:  { sym:'S$',  sale:'0.65',  orig:'64.99',  cur:'SGD' },
      PK:  { sym:'Rs',  sale:'140',   orig:'13999',  cur:'PKR' },
      BD:  { sym:'৳',   sale:'54',    orig:'5399',   cur:'BDT' },
      NG:  { sym:'₦',   sale:'400',   orig:'39999',  cur:'NGN' },
      PH:  { sym:'₱',   sale:'28',    orig:'2799',   cur:'PHP' },
      BR:  { sym:'R$',  sale:'2.5',   orig:'249.99', cur:'BRL' },
      MX:  { sym:'$',   sale:'8.5',   orig:'849.99', cur:'MXN' },
      MY:  { sym:'RM',  sale:'2.3',   orig:'229.99', cur:'MYR' },
      JP:  { sym:'¥',   sale:'75',    orig:'7499',   cur:'JPY' },
      KR:  { sym:'₩',   sale:'675',   orig:'67500',  cur:'KRW' },
      TR:  { sym:'₺',   sale:'13.5',  orig:'1349',   cur:'TRY' },
      ZA:  { sym:'R',   sale:'9',     orig:'899',    cur:'ZAR' },
      DEF: { sym:'$',   sale:'0.49',  orig:'49.99',  cur:'USD' }
    },
    pro: {
      IN:  { sym:'₹',   sale:'299',   orig:'29999',  cur:'INR' },
      US:  { sym:'$',   sale:'4.99',  orig:'499.99', cur:'USD' },
      GB:  { sym:'£',   sale:'3.99',  orig:'399.99', cur:'GBP' },
      CA:  { sym:'C$',  sale:'6.99',  orig:'699.99', cur:'CAD' },
      AU:  { sym:'A$',  sale:'7.99',  orig:'799.99', cur:'AUD' },
      AE:  { sym:'AED', sale:'18.99', orig:'1899',   cur:'AED' },
      SA:  { sym:'SAR', sale:'19.99', orig:'1999',   cur:'SAR' },
      EU:  { sym:'€',   sale:'4.49',  orig:'449.99', cur:'EUR' },
      SG:  { sym:'S$',  sale:'6.99',  orig:'699.99', cur:'SGD' },
      PK:  { sym:'Rs',  sale:'1399',  orig:'139999', cur:'PKR' },
      BD:  { sym:'৳',   sale:'549',   orig:'54999',  cur:'BDT' },
      NG:  { sym:'₦',   sale:'3999',  orig:'399999', cur:'NGN' },
      PH:  { sym:'₱',   sale:'279',   orig:'27999',  cur:'PHP' },
      BR:  { sym:'R$',  sale:'24.99', orig:'2499',   cur:'BRL' },
      MX:  { sym:'$',   sale:'84.99', orig:'8499',   cur:'MXN' },
      MY:  { sym:'RM',  sale:'22.99', orig:'2299',   cur:'MYR' },
      JP:  { sym:'¥',   sale:'749',   orig:'74999',  cur:'JPY' },
      KR:  { sym:'₩',   sale:'6750',  orig:'675000', cur:'KRW' },
      TR:  { sym:'₺',   sale:'134.99',orig:'13499',  cur:'TRY' },
      ZA:  { sym:'R',   sale:'89.99', orig:'8999',   cur:'ZAR' },
      DEF: { sym:'$',   sale:'4.99',  orig:'499.99', cur:'USD' }
    }
  };

  function getPrice(planType, ctry) {
    var map  = BASE_PRICES[planType] || BASE_PRICES.pro;
    var base = map[ctry] || map['DEF'];
    return dynPrice(base, ctry, planType);
  }

  /* ── localStorage keys ─────────────────────────────────────── */
  var LS = {
    TOKEN:'ps_token', TYPE:'ps_type', EXPIRES:'ps_expires',
    EMAIL:'ps_email', SECRET:'ps_secret', COUNTRY:'ps_country',
    CREDITS:'ps_credits', CR_EXP:'ps_credits_exp'
  };

  /* ── Helpers ───────────────────────────────────────────────── */
  function randStr(len) {
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var s = '';
    for (var i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function emailToDocId(email) {
    return (email || '').toLowerCase().trim()
      .replace(/@/g, '_AT_').replace(/\./g, '_DOT_')
      .replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 100);
  }

  function addDays(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function isExpired(isoStr) {
    if (!isoStr) return true;
    return new Date() > new Date(isoStr);
  }

  function detectCountry() {
    var saved = localStorage.getItem('ps_country') || localStorage.getItem('pus_ctry') || localStorage.getItem('afa_geo_v3') || '';
    if (saved && saved.length === 2) return saved.toUpperCase();
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      var tzMap = {
        'Kolkata':'IN','Calcutta':'IN','Chennai':'IN','Mumbai':'IN','Delhi':'IN',
        'New_York':'US','Chicago':'US','Los_Angeles':'US','Denver':'US',
        'London':'GB',
        'Paris':'EU','Berlin':'EU','Rome':'EU','Madrid':'EU','Amsterdam':'EU',
        'Sydney':'AU','Melbourne':'AU','Brisbane':'AU',
        'Toronto':'CA','Vancouver':'CA',
        'Singapore':'SG','Dubai':'AE','Abu_Dhabi':'AE',
        'Karachi':'PK','Lahore':'PK','Dhaka':'BD','Lagos':'NG',
        'Manila':'PH','Sao_Paulo':'BR','Brasilia':'BR',
        'Mexico_City':'MX','Kuala_Lumpur':'MY',
        'Tokyo':'JP','Seoul':'KR','Istanbul':'TR','Johannesburg':'ZA'
      };
      for (var key in tzMap) {
        if (tz.indexOf(key) > -1) return tzMap[key];
      }
    } catch(e) {}
    return 'DEF';
  }

  /* ── Firestore helpers ─────────────────────────────────────── */
  function fsGet(collection, docId) {
    var url = FB_BASE + collection + '/' + encodeURIComponent(docId) + '?key=' + FB_KEY;
    return fetch(url).then(function(r) {
      if (!r.ok) return null;
      return r.json().then(function(d) { return d.fields ? d : null; });
    }).catch(function() { return null; });
  }

  function fsPatch(collection, docId, fields) {
    var url = FB_BASE + collection + '/' + encodeURIComponent(docId) + '?key=' + FB_KEY;
    var body = { fields: {} };
    Object.keys(fields).forEach(function(k) {
      var v = fields[k];
      if (v === null || v === undefined) return;
      if (typeof v === 'boolean')      body.fields[k] = { booleanValue: v };
      else if (typeof v === 'number')  body.fields[k] = { doubleValue: v };
      else                             body.fields[k] = { stringValue: String(v) };
    });
    return fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(function(e) { console.warn('[PlanSystem] Firestore error:', e); });
  }

  function fsRead(doc) {
    if (!doc || !doc.fields) return {};
    var out = {};
    Object.keys(doc.fields).forEach(function(k) {
      var f = doc.fields[k];
      out[k] = f.stringValue !== undefined ? f.stringValue
             : f.booleanValue !== undefined ? f.booleanValue
             : f.doubleValue !== undefined ? f.doubleValue
             : f.integerValue !== undefined ? parseInt(f.integerValue)
             : null;
    });
    return out;
  }

  /* ── localStorage plan helpers ─────────────────────────────── */
  function saveLocal(data) {
    localStorage.setItem(LS.TOKEN,   data.urlToken   || '');
    localStorage.setItem(LS.TYPE,    data.plan       || 'free');
    localStorage.setItem(LS.EXPIRES, data.expiresAt  || '');
    localStorage.setItem(LS.EMAIL,   data.email      || '');
    localStorage.setItem(LS.SECRET,  data.secretCode || '');
    if (data.country) localStorage.setItem(LS.COUNTRY, data.country);
    if (data.plan === 'basic') {
      localStorage.setItem(LS.CREDITS, '5000');
      localStorage.setItem(LS.CR_EXP,  data.expiresAt || '');
      localStorage.setItem('afa_credits', '5000');
    } else if (data.plan === 'pro') {
      localStorage.setItem('pus_pro', '1');
      localStorage.setItem('afa_credits', '99999');
    }
  }

  function clearLocal() {
    [LS.TOKEN,LS.TYPE,LS.EXPIRES,LS.EMAIL,LS.SECRET,LS.CREDITS,LS.CR_EXP].forEach(function(k){
      localStorage.removeItem(k);
    });
    localStorage.removeItem('pus_pro');
  }

  function getPlanStatus() {
    var type    = localStorage.getItem(LS.TYPE) || 'free';
    var expires = localStorage.getItem(LS.EXPIRES) || '';
    var token   = localStorage.getItem(LS.TOKEN) || '';
    if (type === 'free' || !expires || !token) return { active: false, plan: 'free' };
    if (isExpired(expires)) { clearLocal(); return { active: false, plan: 'free', expired: true }; }
    return {
      active: true, plan: type, expiresAt: expires, token: token,
      email:  localStorage.getItem(LS.EMAIL) || '',
      secretCode: localStorage.getItem(LS.SECRET) || ''
    };
  }

  /* ── Apply plan UI ─────────────────────────────────────────── */
  function applyPlanUI(planType) {
    document.body.classList.remove('plan-free','plan-basic','plan-pro');
    document.body.classList.add('plan-' + planType);
    if (planType === 'pro') {
      localStorage.setItem('pus_pro', '1');
      var style = document.getElementById('ps-pro-css');
      if (!style) {
        style = document.createElement('style');
        style.id = 'ps-pro-css';
        style.textContent = [
          'ins.adsbygoogle{display:none!important}',
          '.adsbygoogle-noablate{display:none!important}',
          '#pus-bar{display:none!important}',
          '#pus-sticky{display:none!important}',
          '#pus-float{display:none!important}',
          '#pus-credit-warn{display:none!important}',
          '.pus-blur-wrap img,.pus-blur-wrap video{filter:none!important}',
          '.pus-blur-overlay{display:none!important}',
          '[data-pro-locked]{filter:none!important;pointer-events:auto!important}',
        ].join('');
        document.head.appendChild(style);
      }
      var creditEl = document.getElementById('creditCount');
      if (creditEl) creditEl.textContent = '∞';
      updatePlanBadge('pro');
    } else if (planType === 'basic') {
      var cr = localStorage.getItem(LS.CREDITS) || '5000';
      var creditEl2 = document.getElementById('creditCount');
      if (creditEl2) creditEl2.textContent = cr;
      localStorage.setItem('afa_credits', cr);
      updatePlanBadge('basic');
    }
  }

  function updatePlanBadge(planType) {
    var existing = document.getElementById('ps-plan-badge');
    if (existing) existing.remove();
    var hdr = document.querySelector('.hdr-pills');
    if (!hdr) return;
    var badge = document.createElement('div');
    badge.id = 'ps-plan-badge';
    badge.style.cssText = [
      'display:inline-flex;align-items:center;gap:4px;',
      planType === 'pro'
        ? 'background:linear-gradient(135deg,#fef3c7,#fde68a);border:1.5px solid #fbbf24;color:#92400e;'
        : 'background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:1.5px solid #c4b5fd;color:#5b21b6;',
      'border-radius:50px;padding:4px 10px;font-size:11px;font-weight:800;',
      'font-family:-apple-system,sans-serif;cursor:pointer;'
    ].join('');
    badge.innerHTML = planType === 'pro' ? '👑 Pro' : '⚡ Basic';
    badge.onclick = function() { window.location.href = 'pricing.html'; };
    hdr.appendChild(badge);
  }

  function persistUrlToken(token) {
    if (!token) return;
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get('uid') !== token) {
        url.searchParams.set('uid', token);
        window.history.replaceState({}, '', url.toString());
      }
    } catch(e) {}
  }

  /* ── Purchase flow ─────────────────────────────────────────── */
  window.PSBuyPlan = function(planType, countryCode, email) {
    var ctry = countryCode || detectCountry();
    var p    = getPrice(planType, ctry);

    if (!window.Razorpay) {
      var s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = function() { window.PSBuyPlan(planType, ctry, email); };
      s.onerror = function() { alert('Payment gateway unavailable. Check internet connection.'); };
      document.head.appendChild(s);
      return;
    }

    var cfg = PLAN_CONFIG[planType] || PLAN_CONFIG.pro;
    var isIndia = (ctry === 'IN');

    var opts = {
      key:         RZP_KEY,
      amount:      p.unit,
      currency:    p.cur,
      name:        'Face AI — ' + cfg.name + ' Plan',
      description: cfg.name + ' · ' + cfg.days + ' days · ' + p.sym + p.sale,
      image:       '/favicon.ico',
      theme:       { color: '#7c3aed' },
      prefill:     { email: email || '', name: '', contact: '' },
      notes:       { plan: planType, days: cfg.days, email: email || '' },
      modal:       { ondismiss: function() {} },
      handler: function(res) {
        decrementSlot();
        window.PSActivatePlan(planType, email, ctry, parseFloat(p.sale), p.cur, res.razorpay_payment_id);
      }
    };

    if (isIndia) {
      opts.config = {
        display: {
          blocks: {
            upi:  { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
            card: { name: 'Cards',       instruments: [{ method: 'card' }] },
            nb:   { name: 'Net Banking', instruments: [{ method: 'netbanking' }] },
            wlt:  { name: 'Wallets',     instruments: [{ method: 'wallet' }] }
          },
          sequence: ['block.upi','block.card','block.nb','block.wlt'],
          preferences: { show_default_blocks: false }
        }
      };
    }

    try { new window.Razorpay(opts).open(); }
    catch(e) { alert('Payment error: ' + e.message); }
  };

  /* ── Activate after payment ────────────────────────────────── */
  window.PSActivatePlan = function(planType, email, countryCode, amount, currency, paymentId) {
    var cfg        = PLAN_CONFIG[planType] || PLAN_CONFIG.pro;
    var urlToken   = randStr(12);
    var secretCode = randStr(8).toUpperCase();
    var expiresAt  = addDays(cfg.days);
    var now        = new Date().toISOString();

    var data = {
      urlToken: urlToken, secretCode: secretCode,
      email: email || '', plan: planType,
      expiresAt: expiresAt, purchasedAt: now,
      country: countryCode || 'XX', amount: amount || 0,
      currency: currency || 'USD', paymentId: paymentId || '',
      days: cfg.days
    };

    saveLocal(data);
    applyPlanUI(planType);
    persistUrlToken(urlToken);

    // Save to Firestore
    fsPatch('userPlans', urlToken, {
      urlToken: urlToken, secretCode: secretCode,
      email: email || '', plan: planType,
      expiresAt: expiresAt, purchasedAt: now,
      country: countryCode || 'XX', amount: amount || 0,
      currency: currency || 'USD', paymentId: paymentId || '',
      days: cfg.days, active: true
    }).catch(function() {});

    // Email index
    if (email) {
      fsPatch('emailIndex', emailToDocId(email), {
        urlToken: urlToken, email: email,
        latestPlan: planType, updatedAt: now
      }).catch(function() {});
    }

    if (typeof window.PSShowSuccess === 'function') {
      window.PSShowSuccess(data);
    }
    return data;
  };

  /* ── Restore plan ──────────────────────────────────────────── */
  window.PSRestorePlan = async function(email, secretCode) {
    if (!email || email.indexOf('@') === -1)
      return { ok: false, msg: 'Please enter a valid email address.' };
    if (!secretCode || secretCode.length < 4)
      return { ok: false, msg: 'Please enter your secret code.' };

    var indexDoc = await fsGet('emailIndex', emailToDocId(email));
    if (!indexDoc) return { ok: false, msg: 'Email not found. Please check your email or purchase a plan.' };

    var indexData = fsRead(indexDoc);
    var token = indexData.urlToken;
    if (!token) return { ok: false, msg: 'No plan found for this email.' };

    var planDoc = await fsGet('userPlans', token);
    if (!planDoc) return { ok: false, msg: 'Plan record not found. Contact support.' };

    var plan = fsRead(planDoc);
    if ((plan.secretCode || '').toUpperCase() !== secretCode.toUpperCase().trim())
      return { ok: false, msg: 'Invalid secret code. Check the code you saved after purchase.' };
    if (isExpired(plan.expiresAt))
      return { ok: false, msg: 'Your plan expired on ' + new Date(plan.expiresAt).toLocaleDateString() + '. Please purchase again.' };

    saveLocal(plan);
    applyPlanUI(plan.plan);
    persistUrlToken(token);
    return { ok: true, plan: plan.plan, expiresAt: plan.expiresAt, token: token,
             msg: '✅ ' + (plan.plan === 'pro' ? 'Pro' : 'Basic') + ' plan restored!' };
  };

  /* ── Init ──────────────────────────────────────────────────── */
  async function init() {
    var urlToken = null;
    try { urlToken = new URLSearchParams(window.location.search).get('uid'); } catch(e) {}

    if (urlToken && urlToken !== localStorage.getItem(LS.TOKEN)) {
      var doc = await fsGet('userPlans', urlToken);
      if (doc) {
        var plan = fsRead(doc);
        if (plan.urlToken && !isExpired(plan.expiresAt)) saveLocal(plan);
        else if (isExpired(plan.expiresAt)) clearLocal();
      }
    }

    var status = getPlanStatus();
    if (status.active) {
      applyPlanUI(status.plan);
      persistUrlToken(status.token);
    } else if (status.expired) {
      try {
        var url2 = new URL(window.location.href);
        url2.searchParams.delete('uid');
        window.history.replaceState({}, '', url2.toString());
      } catch(e) {}
    }
  }

  /* ── Expose globals ────────────────────────────────────────── */
  window.PSGetStatus  = getPlanStatus;
  window.PSGetPrice   = getPrice;
  window.PSDetectCtry = detectCountry;
  window.PLAN_PRICES  = BASE_PRICES;
  window.PLAN_CONFIG  = PLAN_CONFIG;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

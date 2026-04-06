// ============================================================
//  🌍 GEO WELCOME POPUP v3
//  ✅ Profile ke BAAD aayega (event + fallback dono)
//  ✅ Credits NAHI — PREMIUM DISCOUNT dikhega
//  ✅ Har country ka apna price (₹1, $10, etc.)
//  ✅ Zero lag — CSS-only smooth animations
// ============================================================

// ── Country → price mapping (pro-upsell.js se sync) ─────────
const GEO_PRICES = {
  IN:  { sym:'₹',    sale:'1',    orig:'999',  cur:'INR', off:'99% OFF' },
  US:  { sym:'$',    sale:'10',   orig:'99',   cur:'USD', off:'90% OFF' },
  GB:  { sym:'£',    sale:'9',    orig:'79',   cur:'GBP', off:'89% OFF' },
  CA:  { sym:'C$',   sale:'13',   orig:'129',  cur:'CAD', off:'90% OFF' },
  AU:  { sym:'A$',   sale:'15',   orig:'149',  cur:'AUD', off:'90% OFF' },
  AE:  { sym:'AED ', sale:'37',   orig:'365',  cur:'AED', off:'90% OFF' },
  SA:  { sym:'SAR ', sale:'38',   orig:'375',  cur:'SAR', off:'90% OFF' },
  PK:  { sym:'₨',   sale:'2800', orig:'27999',cur:'PKR', off:'90% OFF' },
  BD:  { sym:'৳',   sale:'1100', orig:'10999',cur:'BDT', off:'90% OFF' },
  NG:  { sym:'₦',   sale:'8000', orig:'79999',cur:'NGN', off:'90% OFF' },
  PH:  { sym:'₱',   sale:'560',  orig:'5500', cur:'PHP', off:'90% OFF' },
  BR:  { sym:'R$',  sale:'50',   orig:'499',  cur:'BRL', off:'90% OFF' },
  MX:  { sym:'$',   sale:'170',  orig:'1699', cur:'MXN', off:'90% OFF' },
  ID:  { sym:'Rp',  sale:'155000',orig:'1550000',cur:'IDR',off:'90% OFF' },
  MY:  { sym:'RM',  sale:'47',   orig:'469',  cur:'MYR', off:'90% OFF' },
  JP:  { sym:'¥',   sale:'1500', orig:'14999',cur:'JPY', off:'90% OFF' },
  KR:  { sym:'₩',   sale:'13500',orig:'135000',cur:'KRW',off:'90% OFF' },
  DE:  { sym:'€',   sale:'9',    orig:'89',   cur:'EUR', off:'90% OFF' },
  FR:  { sym:'€',   sale:'9',    orig:'89',   cur:'EUR', off:'90% OFF' },
  TR:  { sym:'₺',   sale:'270',  orig:'2699', cur:'TRY', off:'90% OFF' },
  EG:  { sym:'E£',  sale:'490',  orig:'4900', cur:'EGP', off:'90% OFF' },
  ZA:  { sym:'R',   sale:'185',  orig:'1850', cur:'ZAR', off:'90% OFF' },
  RU:  { sym:'₽',   sale:'900',  orig:'8999', cur:'RUB', off:'90% OFF' },
  IT:  { sym:'€',   sale:'9',    orig:'89',   cur:'EUR', off:'90% OFF' },
  ES:  { sym:'€',   sale:'9',    orig:'89',   cur:'EUR', off:'90% OFF' },
  NL:  { sym:'€',   sale:'9',    orig:'89',   cur:'EUR', off:'90% OFF' },
  SE:  { sym:'kr',  sale:'105',  orig:'1050', cur:'SEK', off:'90% OFF' },
  SG:  { sym:'S$',  sale:'14',   orig:'139',  cur:'SGD', off:'90% OFF' },
  GH:  { sym:'₵',   sale:'125',  orig:'1250', cur:'GHS', off:'90% OFF' },
  KE:  { sym:'KSh', sale:'1300', orig:'12999',cur:'KES', off:'90% OFF' },
  NP:  { sym:'रू',  sale:'1350', orig:'13499',cur:'NPR', off:'90% OFF' },
  LK:  { sym:'Rs',  sale:'3000', orig:'29999',cur:'LKR', off:'90% OFF' },
  AR:  { sym:'$',   sale:'8500', orig:'84999',cur:'ARS', off:'90% OFF' },
  CO:  { sym:'$',   sale:'40000',orig:'399999',cur:'COP',off:'90% OFF' },
  TH:  { sym:'฿',   sale:'360',  orig:'3599', cur:'THB', off:'90% OFF' },
  VN:  { sym:'₫',   sale:'250000',orig:'2499999',cur:'VND',off:'90% OFF' },
  MA:  { sym:'MAD ',sale:'100',  orig:'999',  cur:'MAD', off:'90% OFF' },
  PL:  { sym:'zł',  sale:'40',   orig:'399',  cur:'PLN', off:'90% OFF' },
  UA:  { sym:'₴',   sale:'400',  orig:'3999', cur:'UAH', off:'90% OFF' },
  IR:  { sym:'﷼',   sale:'420000',orig:'4200000',cur:'IRR',off:'90% OFF' },
  DEF: { sym:'$',   sale:'10',   orig:'99',   cur:'USD', off:'90% OFF' },
};

// ── Country display data ─────────────────────────────────────
const GEO_COUNTRY_DATA = {
  IN: { flag:'🇮🇳', color:'#FF9933', color2:'#138808', greeting:'Namaste! 🙏',    name:'India' },
  US: { flag:'🇺🇸', color:'#3C3B6E', color2:'#B22234', greeting:'Hey there! 👋',  name:'USA' },
  GB: { flag:'🇬🇧', color:'#00247D', color2:'#CF142B', greeting:'Hello! 👋',      name:'UK' },
  CA: { flag:'🇨🇦', color:'#CC0000', color2:'#CC0000', greeting:'Hey! 👋',        name:'Canada' },
  AU: { flag:'🇦🇺', color:'#00008B', color2:'#CC0000', greeting:"G'day! 👋",     name:'Australia' },
  AE: { flag:'🇦🇪', color:'#009000', color2:'#CC0000', greeting:'Marhaba! 👋',    name:'UAE' },
  SA: { flag:'🇸🇦', color:'#006C35', color2:'#006C35', greeting:'Ahlan! 👋',      name:'Saudi Arabia' },
  PK: { flag:'🇵🇰', color:'#01411C', color2:'#2E7D32', greeting:'Assalam! 👋',    name:'Pakistan' },
  BD: { flag:'🇧🇩', color:'#006A4E', color2:'#F42A41', greeting:'Namaskar! 👋',   name:'Bangladesh' },
  NG: { flag:'🇳🇬', color:'#008751', color2:'#008751', greeting:'Welcome! 👋',     name:'Nigeria' },
  PH: { flag:'🇵🇭', color:'#0038A8', color2:'#CE1126', greeting:'Mabuhay! 👋',    name:'Philippines' },
  BR: { flag:'🇧🇷', color:'#009C3B', color2:'#FFDF00', greeting:'Olá! 👋',        name:'Brazil' },
  MX: { flag:'🇲🇽', color:'#006847', color2:'#CE1126', greeting:'Hola! 👋',       name:'Mexico' },
  ID: { flag:'🇮🇩', color:'#CE1126', color2:'#CE1126', greeting:'Halo! 👋',       name:'Indonesia' },
  MY: { flag:'🇲🇾', color:'#CC0001', color2:'#010066', greeting:'Selamat! 👋',    name:'Malaysia' },
  JP: { flag:'🇯🇵', color:'#BC002D', color2:'#BC002D', greeting:'Konnichiwa! 👋', name:'Japan' },
  KR: { flag:'🇰🇷', color:'#003478', color2:'#CD2E3A', greeting:'Annyeong! 👋',   name:'South Korea' },
  DE: { flag:'🇩🇪', color:'#333333', color2:'#DD0000', greeting:'Hallo! 👋',      name:'Germany' },
  FR: { flag:'🇫🇷', color:'#002395', color2:'#ED2939', greeting:'Bonjour! 👋',    name:'France' },
  TR: { flag:'🇹🇷', color:'#E30A17', color2:'#E30A17', greeting:'Merhaba! 👋',    name:'Turkey' },
  EG: { flag:'🇪🇬', color:'#CE1126', color2:'#333333', greeting:'Ahlan! 👋',      name:'Egypt' },
  ZA: { flag:'🇿🇦', color:'#007A4D', color2:'#FFB81C', greeting:'Sawubona! 👋',   name:'South Africa' },
  RU: { flag:'🇷🇺', color:'#003087', color2:'#CC0000', greeting:'Privet! 👋',     name:'Russia' },
  IT: { flag:'🇮🇹', color:'#009246', color2:'#CE2B37', greeting:'Ciao! 👋',       name:'Italy' },
  ES: { flag:'🇪🇸', color:'#AA151B', color2:'#F1BF00', greeting:'Hola! 👋',       name:'Spain' },
  NL: { flag:'🇳🇱', color:'#AE1C28', color2:'#21468B', greeting:'Hoi! 👋',        name:'Netherlands' },
  SE: { flag:'🇸🇪', color:'#006AA7', color2:'#FECC02', greeting:'Hej! 👋',        name:'Sweden' },
  SG: { flag:'🇸🇬', color:'#EF3340', color2:'#EF3340', greeting:'Hello! 👋',      name:'Singapore' },
  GH: { flag:'🇬🇭', color:'#006B3F', color2:'#FCD116', greeting:'Akwaaba! 👋',    name:'Ghana' },
  KE: { flag:'🇰🇪', color:'#006600', color2:'#BB0000', greeting:'Jambo! 👋',      name:'Kenya' },
  NP: { flag:'🇳🇵', color:'#003893', color2:'#DC143C', greeting:'Namaste! 🙏',    name:'Nepal' },
  LK: { flag:'🇱🇰', color:'#8D153A', color2:'#EB7400', greeting:'Ayubowan! 👋',   name:'Sri Lanka' },
  AR: { flag:'🇦🇷', color:'#74ACDF', color2:'#74ACDF', greeting:'Hola! 👋',       name:'Argentina' },
  CO: { flag:'🇨🇴', color:'#FCD116', color2:'#003087', greeting:'Hola! 👋',       name:'Colombia' },
  TH: { flag:'🇹🇭', color:'#A51931', color2:'#2D2A4A', greeting:'Sawasdee! 👋',   name:'Thailand' },
  VN: { flag:'🇻🇳', color:'#DA251D', color2:'#DA251D', greeting:'Xin chao! 👋',   name:'Vietnam' },
  MA: { flag:'🇲🇦', color:'#C1272D', color2:'#006233', greeting:'Ahlan! 👋',      name:'Morocco' },
  PL: { flag:'🇵🇱', color:'#DC143C', color2:'#DC143C', greeting:'Czesc! 👋',      name:'Poland' },
  UA: { flag:'🇺🇦', color:'#005BBB', color2:'#FFD500', greeting:'Pryvit! 👋',     name:'Ukraine' },
  IR: { flag:'🇮🇷', color:'#239F40', color2:'#DA0000', greeting:'Salam! 👋',      name:'Iran' },
};

const GEO_DEFAULT = {
  flag:'🌍', color:'#7c3aed', color2:'#ec4899',
  greeting:'Welcome! 👋', name:'World'
};

const GEO_STORAGE_KEY = 'afa_geo_v3';

function getEmojiFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  try {
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E0 + c.charCodeAt(0) - 65));
  } catch(e) { return '🌍'; }
}

// ── INJECT CSS ───────────────────────────────────────────────
function injectGeoStyles() {
  if (document.getElementById('geo-v3-styles')) return;
  const s = document.createElement('style');
  s.id = 'geo-v3-styles';
  s.textContent = `
    #geoOverlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 999998;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: geoFadeIn 0.25s ease both;
    }
    @keyframes geoFadeIn { from{opacity:0} to{opacity:1} }

    #geoCard {
      background: #fff;
      border-radius: 22px;
      width: 100%; max-width: 340px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: geoCardIn 0.35s cubic-bezier(0.34,1.3,0.64,1) both;
      text-align: center;
      position: relative;
    }
    @keyframes geoCardIn {
      from { opacity:0; transform: scale(0.88) translateY(20px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }

    /* ── Top banner ── */
    .geo-banner {
      padding: 22px 20px 18px;
      background: var(--geo-grad);
      position: relative;
    }
    .geo-close {
      position: absolute; top: 10px; right: 10px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.25); border: none;
      color: #fff; font-size: 15px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.18s; line-height: 1;
    }
    .geo-close:hover { background: rgba(255,255,255,0.4); }

    .geo-flag {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
      font-size: 42px; line-height: 1;
      margin: 0 auto 10px;
      border: 2.5px solid rgba(255,255,255,0.4);
      animation: geoFlagPop 0.4s cubic-bezier(0.34,1.5,0.64,1) 0.1s both;
    }
    @keyframes geoFlagPop {
      from { opacity:0; transform:scale(0.5); }
      to   { opacity:1; transform:scale(1); }
    }
    .geo-greeting {
      font-size: 12px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: rgba(255,255,255,0.85);
      font-family: -apple-system, 'Segoe UI', sans-serif;
      margin-bottom: 3px;
      animation: geoFadeUp 0.35s ease 0.15s both;
    }
    .geo-headline {
      font-size: 18px; font-weight: 900; color: #fff;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      line-height: 1.3;
      animation: geoFadeUp 0.35s ease 0.2s both;
    }
    @keyframes geoFadeUp {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Price box ── */
    .geo-price-box {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: rgba(255,255,255,0.18);
      border: 2px solid rgba(255,255,255,0.45);
      border-radius: 14px; padding: 10px 18px;
      margin-top: 12px;
      animation: geoFadeUp 0.35s ease 0.28s both;
    }
    .geo-price-sale {
      font-size: 32px; font-weight: 900; color: #fff;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      line-height: 1;
    }
    .geo-price-right {
      display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    }
    .geo-price-orig {
      font-size: 14px; color: rgba(255,255,255,0.7);
      text-decoration: line-through;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      font-weight: 600;
    }
    .geo-price-off {
      font-size: 11px; font-weight: 800; color: #fff;
      background: rgba(0,0,0,0.22); border-radius: 6px;
      padding: 2px 8px; letter-spacing: 0.5px;
    }

    /* ── Body ── */
    .geo-body { padding: 16px 20px 20px; background: #fff; }

    .geo-offer-label {
      display: inline-flex; align-items: center; gap: 5px;
      background: #fef3c7; border: 1.5px solid #fbbf24;
      border-radius: 50px; padding: 4px 12px;
      font-size: 11px; font-weight: 800; color: #92400e;
      margin-bottom: 10px;
      animation: geoFadeUp 0.35s ease 0.32s both;
    }
    .geo-msg {
      font-size: 14px; font-weight: 700; color: #1e1b4b;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      line-height: 1.45; margin-bottom: 5px;
      animation: geoFadeUp 0.35s ease 0.36s both;
    }
    .geo-sub {
      font-size: 12px; color: #6b7280; line-height: 1.5;
      margin-bottom: 14px;
      animation: geoFadeUp 0.35s ease 0.4s both;
    }

    /* ── Features list ── */
    .geo-feats {
      display: flex; flex-direction: column; gap: 7px;
      margin-bottom: 16px; text-align: left;
      animation: geoFadeUp 0.35s ease 0.44s both;
    }
    .geo-feat {
      display: flex; align-items: center; gap: 9px;
      font-size: 12.5px; color: #374151;
      font-family: -apple-system, 'Segoe UI', sans-serif;
    }
    .geo-feat-check {
      width: 20px; min-width: 20px; height: 20px;
      background: #7c3aed; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 10px; flex-shrink: 0;
    }

    /* ── CTA Button ── */
    .geo-btn {
      width: 100%; padding: 14px;
      background: var(--geo-grad);
      color: #fff; border: none; border-radius: 14px;
      font-size: 15px; font-weight: 800; cursor: pointer;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 18px rgba(0,0,0,0.2);
      transition: opacity 0.18s, transform 0.18s;
      animation: geoFadeUp 0.35s ease 0.5s both;
      margin-bottom: 10px;
    }
    .geo-btn:hover { opacity: 0.92; transform: translateY(-1px); }
    .geo-btn:active { transform: translateY(0); }

    .geo-later {
      width: 100%; padding: 10px;
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      color: #6b7280; font-size: 13px; font-weight: 600;
      border-radius: 12px; cursor: pointer;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      transition: all 0.15s;
      animation: geoFadeUp 0.35s ease 0.54s both;
    }
    .geo-later:hover { background: #f3f4f6; border-color: #d1d5db; color: #374151; }

    /* ── Timer badge ── */
    .geo-timer {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      font-size: 11px; color: #ef4444; font-weight: 700;
      margin-bottom: 10px;
      animation: geoFadeUp 0.35s ease 0.46s both;
    }
    .geo-timer-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
      animation: geoTimerPulse 1.2s ease-in-out infinite;
    }
    @keyframes geoTimerPulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:0.4; transform:scale(0.7); }
    }
  `;
  document.head.appendChild(s);
}

// ── BUILD POPUP ──────────────────────────────────────────────
function showGeoPopup(countryCode) {
  if (document.getElementById('geoOverlay')) return;

  injectGeoStyles();

  const cd = GEO_COUNTRY_DATA[countryCode] || GEO_DEFAULT;
  const pr = GEO_PRICES[countryCode] || GEO_PRICES.DEF;
  const flag = cd.flag || getEmojiFlag(countryCode);

  // Timer — countdown 10 mins (just display, no logic)
  let timerSec = 599;
  function fmt(s) { const m=Math.floor(s/60),sec=s%60; return `${m}:${sec<10?'0':''}${sec}`; }

  const overlay = document.createElement('div');
  overlay.id = 'geoOverlay';
  overlay.innerHTML = `
    <div id="geoCard" style="--geo-grad:linear-gradient(135deg,${cd.color},${cd.color2})">
      <div class="geo-banner">
        <button class="geo-close" id="geoCloseBtn">✕</button>
        <div class="geo-flag">${flag}</div>
        <div class="geo-greeting">🎉 Special Offer for ${cd.name}!</div>
        <div class="geo-headline">Pro Access — Today Only</div>
        <div class="geo-price-box">
          <div class="geo-price-sale">${pr.sym}${pr.sale}</div>
          <div class="geo-price-right">
            <div class="geo-price-orig">${pr.sym}${pr.orig}</div>
            <div class="geo-price-off">${pr.off}</div>
          </div>
        </div>
      </div>

      <div class="geo-body">
        <div class="geo-offer-label">🔥 Limited Time Offer</div>
        <div class="geo-msg">Unlock everything — just ${pr.sym}${pr.sale} today!</div>
        <div class="geo-sub">Regular price ${pr.sym}${pr.orig}. This discount expires soon.</div>

        <div class="geo-timer">
          <div class="geo-timer-dot"></div>
          <span>Offer expires in <strong id="geoTimerTxt">${fmt(timerSec)}</strong></span>
        </div>

        <div class="geo-feats">
          <div class="geo-feat"><div class="geo-feat-check">✓</div><span><strong>Unlimited analyses</strong> — no daily limits</span></div>
          <div class="geo-feat"><div class="geo-feat-check">✓</div><span><strong>Full results</strong> — zero blur, 100% visible</span></div>
          <div class="geo-feat"><div class="geo-feat-check">✓</div><span><strong>Celebrity match + dark traits</strong> unlocked</span></div>
          <div class="geo-feat"><div class="geo-feat-check">✓</div><span><strong>PDF download + zero ads</strong></span></div>
        </div>

        <button class="geo-btn" id="geoClaimBtn">
          🚀 Get Pro — ${pr.sym}${pr.sale} Only
        </button>
        <button class="geo-later" id="geoLaterBtn">Check Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Timer countdown
  const timerEl = document.getElementById('geoTimerTxt');
  const timerInterval = setInterval(() => {
    timerSec--;
    if (timerSec <= 0) { clearInterval(timerInterval); timerSec = 0; }
    if (timerEl) timerEl.textContent = fmt(timerSec);
  }, 1000);

  // Close handlers
  function closeGeo() {
    clearInterval(timerInterval);
    const o = document.getElementById('geoOverlay');
    if (!o) return;
    o.style.transition = 'opacity 0.22s ease';
    o.style.opacity = '0';
    setTimeout(() => o && o.remove(), 230);
  }

  document.getElementById('geoCloseBtn').addEventListener('click', closeGeo);
  document.getElementById('geoLaterBtn').addEventListener('click', closeGeo);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGeo(); });

  // CTA — go to pricing
  document.getElementById('geoClaimBtn').addEventListener('click', () => {
    closeGeo();
    setTimeout(() => { window.location.href = 'pricing.html?src=geo_popup'; }, 200);
  });
}

// ── MAIN INIT ─────────────────────────────────────────────────
(function initGeo() {

  // Already shown this session → skip
  if (sessionStorage.getItem('geo_shown')) return;
  // Already seen before (localStorage) → skip
  if (localStorage.getItem(GEO_STORAGE_KEY)) return;

  async function detectAndShow() {
    if (sessionStorage.getItem('geo_shown')) return;
    sessionStorage.setItem('geo_shown', '1');

    let code = 'DEF';
    try {
      const res  = await fetch('https://ipapi.co/json/');
      const json = await res.json();
      code = json.country_code || 'DEF';
    } catch(e) {
      try {
        const lang = navigator.language || 'en-US';
        code = (lang.split('-')[1] || 'DEF').toUpperCase();
      } catch(e2) {}
    }

    localStorage.setItem(GEO_STORAGE_KEY, code);
    showGeoPopup(code);
  }

  // ── Wait for profile popup to finish first ──────────────────
  const profileDone = localStorage.getItem('raf_profile_v1') === '1';

  if (profileDone) {
    // Profile already done — show after page loads + 800ms delay
    if (document.readyState === 'complete') {
      setTimeout(detectAndShow, 800);
    } else {
      window.addEventListener('load', () => setTimeout(detectAndShow, 800));
    }
  } else {
    // Profile not done — wait for profile-done event
    document.addEventListener('raf-profile-done', () => {
      setTimeout(detectAndShow, 500);
    });
    // Fallback: if profile event never fires (script order issue), show after 5s
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (!sessionStorage.getItem('geo_shown')) {
          detectAndShow();
        }
      }, 5000);
    });
  }

})();

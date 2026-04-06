// ============================================================
//  AI FACE ANALYZER — COMPLETE SCRIPT
//  Includes: Credit System, Auth, Analysis, Sharing
// ============================================================


let stream;
let currentPhoto = '';

// ============================================================
//  CREDIT SYSTEM
// ============================================================

const CREDIT_KEY       = 'afa_credits';
const CREDIT_USED_KEY  = 'afa_credits_used';
const CREDIT_HIST_KEY  = 'afa_credit_history';
const CREDIT_TS_KEY    = 'afa_credit_timestamp';
const CREDIT_LOGGED_KEY= 'afa_is_logged_in_credits';

const GUEST_START   = 1000;  // 1000 credits per day
const LOGIN_START   = 1000;  // same for logged in on free plan
const COST_MIN      = 500;  // 500 credits per analysis
const COST_MAX      = 500;  // fixed 500 per analysis
const RESET_HOURS   = 24;

// Live counter: simulate other users using the app
let liveAnalysisCount = 248319 + Math.floor(Math.random() * 50);
setInterval(() => {
  liveAnalysisCount += Math.floor(Math.random() * 3);
  const el = document.querySelector('[data-target="248319"]');
  if (el && el.dataset.animated) {
    const v = liveAnalysisCount;
    el.textContent = v >= 1000 ? Math.floor(v/1000) + 'K+' : v + '+';
  }
}, 8000);

function getCredits() {
  const ts = localStorage.getItem(CREDIT_TS_KEY);
  const isLoggedIn = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
  if (!isLoggedIn && ts) {
    const hoursElapsed = (Date.now() - parseInt(ts)) / 3600000;
    if (hoursElapsed >= RESET_HOURS) {
      localStorage.setItem(CREDIT_KEY, GUEST_START);
      localStorage.setItem(CREDIT_USED_KEY, 0);
      localStorage.setItem(CREDIT_TS_KEY, Date.now());
      localStorage.removeItem(CREDIT_HIST_KEY);
    }
  }
  const stored = localStorage.getItem(CREDIT_KEY);
  if (stored === null) {
    localStorage.setItem(CREDIT_KEY, GUEST_START);
    localStorage.setItem(CREDIT_USED_KEY, 0);
    localStorage.setItem(CREDIT_TS_KEY, Date.now());
    return GUEST_START;
  }
  return parseInt(stored);
}

function getCreditsUsed() {
  return parseInt(localStorage.getItem(CREDIT_USED_KEY) || '0');
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(CREDIT_HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveHistory(arr) {
  localStorage.setItem(CREDIT_HIST_KEY, JSON.stringify(arr.slice(-20)));
}

function updateCreditDisplay(credits) {
  const el = document.getElementById('creditCount');
  if (!el) return;
  const formatted = credits >= 1000 ? (credits/1000).toFixed(credits >= 100000 ? 0 : 1) + 'K' : credits.toString();
  el.textContent = formatted;
  const display = document.getElementById('creditDisplay');
  if (!display) return;
  display.classList.remove('credit-low', 'credit-critical', 'credit-rich');
  if (credits <= 0)          display.classList.add('credit-critical');
  else if (credits < 2000)   display.classList.add('credit-low');
  else if (credits > 50000)  display.classList.add('credit-rich');
}

function deductCredits(cost, photoTime) {
  let credits = getCredits();
  credits = Math.max(0, credits - cost);
  localStorage.setItem(CREDIT_KEY, credits);
  const used = getCreditsUsed() + cost;
  localStorage.setItem(CREDIT_USED_KEY, used);
  const hist = getHistory();
  hist.push({
    cost,
    remaining: credits,
    time: photoTime || new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    label: 'Face Analysis',
    icon: '⚡'
  });
  saveHistory(hist);
  updateCreditDisplay(credits);
  animateCreditDeduction(cost);
  return credits;
}

function animateCreditDeduction(cost) {
  const display = document.getElementById('creditDisplay');
  if (!display) return;
  const pop = document.createElement('div');
  pop.className = 'credit-pop';
  pop.textContent = '-' + cost.toLocaleString();
  display.appendChild(pop);
  setTimeout(() => pop.remove(), 1200);
  display.classList.add('credit-shake');
  setTimeout(() => display.classList.remove('credit-shake'), 500);
}

function openCreditPanel() {
  const panel = document.getElementById('creditPanel');
  if (!panel) return;
  panel.style.display = '';
  panel.classList.add('show');
  refreshCreditPanel();
  const isLoggedIn = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
  const promo = document.getElementById('creditLoginPromo');
  if (promo) promo.style.display = isLoggedIn ? 'none' : 'flex';
}

function closeCreditPanel() {
  const panel = document.getElementById('creditPanel');
  if (!panel) return;
  panel.classList.remove('show');
}

function refreshCreditPanel() {
  const credits    = getCredits();
  const used       = getCreditsUsed();
  const isLoggedIn = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
  const startAmt   = isLoggedIn ? LOGIN_START : GUEST_START;
  const pct        = Math.max(0, Math.min(100, (credits / startAmt) * 100));
  const analysesDone = getHistory().length;

  const cbalAmount = document.getElementById('cbalAmount');
  if (cbalAmount) cbalAmount.textContent = credits.toLocaleString();

  const creditModalStatus = document.getElementById('creditModalStatus');
  if (creditModalStatus) creditModalStatus.textContent = isLoggedIn ? '✅ Logged In — Premium Plan' : '👤 Guest Plan — Login for 200K Credits!';

  const ciStart = document.getElementById('ciStart');
  if (ciStart) ciStart.textContent = startAmt.toLocaleString();

  const ciCount = document.getElementById('ciCount');
  if (ciCount) ciCount.textContent = analysesDone;

  const ciUsed = document.getElementById('ciUsed');
  if (ciUsed) ciUsed.textContent = used.toLocaleString();

  const donutPct = document.getElementById('donutPct');
  if (donutPct) donutPct.textContent = Math.round(pct) + '%';

  const arc = document.getElementById('creditDonutArc');
  if (arc) arc.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);

  renderCreditHistory();
}

function renderCreditHistory() {
  const listEl = document.getElementById('creditHistoryList');
  if (!listEl) return;
  const hist = getHistory();
  if (!hist.length) {
    listEl.innerHTML = '<div class="ch-empty">No analyses yet. Try analyzing your face!</div>';
    return;
  }
  listEl.innerHTML = [...hist].reverse().map((h, i) => `
    <div class="ch-item">
      <span class="ch-num">#${hist.length - i}</span>
      <div class="ch-info">
        <span class="ch-date">${h.date} ${h.time}</span>
        <span class="ch-cost">-${h.cost.toLocaleString()} credits</span>
      </div>
      <span class="ch-remaining">${h.remaining.toLocaleString()} left</span>
    </div>
  `).join('');
}

function maybeShowOfferToast() {
  const isLoggedIn = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
  if (isLoggedIn) return;
  const lastShown = localStorage.getItem('afa_toast_ts');
  const minutesSince = lastShown ? (Date.now() - parseInt(lastShown)) / 60000 : 999;
  if (minutesSince < 3) return;
  const delay = 15000 + Math.random() * 30000;
  setTimeout(() => {
    const toast = document.getElementById('offerToast');
    if (toast) {
      toast.style.display = "flex";
      localStorage.setItem('afa_toast_ts', Date.now());
      setTimeout(() => toast.style.display = 'none', 8000);
    }
  }, delay);
}

// ============================================================
//  SCREEN NAVIGATION
// ============================================================

function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden', 'true');
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.setAttribute('aria-hidden', 'false');
  }
}

function goToHome() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  CAMERA FUNCTIONS
// ============================================================

function openCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(s => {
      stream = s;
      document.getElementById('cameraContainer').style.display = 'block';
      document.getElementById('cameraFeed').srcObject = stream;
    })
    .catch(() => alert("Camera access denied or not available"));
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  document.getElementById('cameraContainer').style.display = 'none';
}

function capturePhoto() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  showPreview(dataUrl);
  stopCamera();
}

function showPreview(src) {
  currentPhoto = src;
  document.getElementById('previewContainer').innerHTML =
    `<img src="${src}" style="max-width:100%; border-radius:15px; display:block; margin:20px auto;">`;
}

// ============================================================
//  ANALYZE — WITH CREDIT CHECK
// ============================================================

function analyzePhoto() {
  // Track analyze via collect.js
  if (currentPhoto) { try { if (typeof window._clAnalyze === 'function') window._clAnalyze(currentPhoto, '🔍 Face Analyzer'); } catch(e) {} }
  if (!currentPhoto) {
    goToScreen('resultScreen');
    document.getElementById('resultNormalMsg').style.display = 'none';
    const warnings = [
      "No clear face detected! Please try a front-facing selfie 🙂",
      "Face not visible clearly. Use better lighting! 📸",
      "Couldn't detect a face. Make sure it's a clear photo! 😊",
      "Please upload a photo with a visible face for best results! ✨"
    ];
    document.getElementById('resultWarning').textContent = warnings[Math.floor(Math.random() * warnings.length)];
    document.getElementById('resultWarning').style.display = 'block';
    return;
  }

  const credits = getCredits();
  const cost    = COST_MIN + Math.floor(Math.random() * (COST_MAX - COST_MIN + 1));
  if (credits < cost) {
    // Credits exhausted → show pro modal then redirect to pricing
    if (window.pusOpen) {
      window.pusOpen('no_credits', '⚡ Credits Exhausted!', 'You need 500 credits per analysis. Free plan gives 1,000 credits/day (2 analyses). Go Pro for unlimited!');
    } else {
      window.location.href = 'pricing.html';
    }
    return;
  }

  showFaceScanOverlay(1800, () => {
    deductCredits(cost, new Date().toLocaleTimeString());
    SoundEngine.scan();

    const newStreak = recordStreakDay();
    setTimeout(() => showStreakRewardPopup(newStreak), 3500);
    const today = getTodayStr();
    const doneDays = JSON.parse(localStorage.getItem('afa_done_days') || '[]');
    if (!doneDays.includes(today)) {
      doneDays.push(today);
      localStorage.setItem('afa_done_days', JSON.stringify(doneDays));
    }
    localStorage.setItem('afa_total_days', parseInt(localStorage.getItem('afa_total_days') || '0') + 1);

    // ── Country extra increment: user ke analysis se India ya user country badhe ──
    try {
      const countryExtra = JSON.parse(localStorage.getItem('afa_country_extra') || '{}');
      const userCountry = localStorage.getItem('afa_user_country') || 'India';
      countryExtra[userCountry] = (countryExtra[userCountry] || 0) + 1;
      localStorage.setItem('afa_country_extra', JSON.stringify(countryExtra));
    } catch(e) {}

    goToScreen('loadingScreen');
    animateLoadingSteps();

    setTimeout(() => {
      goToScreen('resultScreen');
      document.getElementById('resultNormalMsg').style.display = 'block';
      document.getElementById('resultWarning').style.display  = 'none';

      // Confetti — only if animations enabled
      if (isAnimEnabled()) setTimeout(launchConfetti, 600);

      const remaining = getCredits();
      if (remaining < 3000 && localStorage.getItem(CREDIT_LOGGED_KEY) !== 'true') {
        showLowCreditNudge(remaining);
      }
      setTimeout(createResultCard, 800);
    }, 2800);
  });
}

function animateLoadingSteps() {
  const steps = ['ls1','ls2','ls3'];
  const bar   = document.getElementById('loadingBar');
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active','done'); }
  });
  if (bar) bar.style.width = '0%';

  let i = 0;
  const next = () => {
    if (i > 0) {
      const prev = document.getElementById(steps[i-1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    if (i < steps.length) {
      const cur = document.getElementById(steps[i]);
      if (cur) cur.classList.add('active');
      if (bar) bar.style.width = ((i+1)/steps.length * 100) + '%';
      i++;
      setTimeout(next, 900);
    }
  };
  next();
}

function showLowCreditNudge(remaining) {
  setTimeout(() => {
    const toast = document.getElementById('offerToast');
    if (!toast) return;
    const strong = toast.querySelector('strong');
    const span   = toast.querySelector('span');
    if (strong) strong.textContent = '⚡ Low Credits: ' + remaining.toLocaleString() + ' left!';
    if (span)   span.textContent   = 'Login now & get 200,000 FREE credits instantly!';
    toast.style.display = "flex";
    localStorage.setItem('afa_toast_ts', Date.now());
    setTimeout(() => toast.style.display = 'none', 9000);
  }, 3000);
}

// ============================================================
//  RESULT CARD GENERATION
// ============================================================

const PAST_LIFE_POOL = [
  {role:"Egyptian Pharaoh 👑",desc:"You ruled with iron will and mysterious wisdom. People feared and adored you.",aura:"Gold"},
  {role:"Viking Warrior ⚔️",desc:"You sailed uncharted seas and fought with fearless rage. Born to conquer.",aura:"Red"},
  {role:"Renaissance Artist 🎨",desc:"Your hands created beauty the world had never seen. A true visionary genius.",aura:"Purple"},
  {role:"Samurai Warrior 🗡️",desc:"Discipline, honor, and silence were your weapons. You bowed to no one.",aura:"Black"},
  {role:"Greek Oracle 🔮",desc:"You saw what others couldn't. Kings and generals sought your prophecies.",aura:"Blue"},
  {role:"Pirate Captain 🏴‍☠️",desc:"Freedom was your only law. You lived for the thrill, the sea, the gold.",aura:"Green"},
  {role:"Royal Spy 🕵️",desc:"You lived in shadows, knew every secret, trusted no one. Lethal elegance.",aura:"Silver"},
  {role:"Shaolin Monk 🧘",desc:"Master of body and mind. Your inner peace was more powerful than any weapon.",aura:"White"},
  {role:"Mayan Astronomer 🌌",desc:"You mapped the stars and unlocked cosmic secrets centuries ahead of your time.",aura:"Indigo"},
  {role:"Medieval Witch 🧙‍♀️",desc:"Nature spoke to you. You healed the sick and hexed the wicked. Wildly powerful.",aura:"Orange"},
  {role:"Roman General ⚔️",desc:"Thousands followed you into battle. Strategy was your art, victory your habit.",aura:"Crimson"},
  {role:"Tibetan Mystic 🏔️",desc:"You lived on mountain peaks, spoke to spirits, and held ancient cosmic knowledge.",aura:"Teal"},
];

const DARK_SIDE_POOL = [
  {trait:"Chaotic Mastermind 🌀",meter:87,desc:"You pretend to be calm but inside you're planning 12 things at once. Dangerous."},
  {trait:"Secretly Dramatic 🎭",meter:94,desc:"You act unbothered but you rehearse arguments in the shower. Every. Single. Time."},
  {trait:"Villain Origin Story 😈",meter:78,desc:"Be honest — you've imagined your villain monologue at least once. It was legendary."},
  {trait:"Emotionally Feral 🦁",meter:91,desc:"You give great advice but cannot follow a single piece of it yourself. Classic."},
  {trait:"Main Character Syndrome 🎬",meter:96,desc:"You narrate your own life like a Netflix documentary. The playlist? Immaculate."},
  {trait:"Chaos Agent 💥",meter:83,desc:"When things get too calm, something in you just... needs to shake the table."},
  {trait:"Overthinking Champion 🧠",meter:99,desc:"You've already imagined this exact scenario 47 times before it happened."},
  {trait:"Soft Manipulator 🎯",desc:"You never ask directly. You just create situations until people do what you wanted.",meter:88},
  {trait:"Secretly Unhinged 🔪",meter:76,desc:"On the outside: totally normal. On the inside: a full cinematic universe of chaos."},
  {trait:"Villain With Good Intentions 🦹",meter:85,desc:"You do bad things for good reasons and somehow sleep perfectly at night."},
  {trait:"Emotional Hacker 💻",meter:90,desc:"You can read a room in 3 seconds and adjust your entire personality. Terrifying."},
  {trait:"CEO of Pettiness 👸",meter:82,desc:"You don't forget. You don't forgive. You just wait. Patiently. Forever."},
];

const CELEB_MATCHES = [
  {name:"Elon Musk",emoji:"🚀",reason:"Big brain chaotic energy, always thinking 10 steps ahead, probably sleep-deprived and still winning."},
  {name:"Rihanna",emoji:"💅",reason:"Effortlessly iconic. Doesn't try, just wins. Fashion icon + boss + unbothered queen."},
  {name:"Shah Rukh Khan",emoji:"🌹",reason:"Romantic genius with business brain. Charming everyone while secretly running an empire."},
  {name:"Billie Eilish",emoji:"🖤",reason:"Dark, deep, misunderstood but wildly magnetic. Quiet on outside, full storm inside."},
  {name:"The Rock",emoji:"💪",reason:"Unbreakable discipline. Gets up at 4AM, works harder than everyone, yet somehow still likeable."},
  {name:"Kylie Jenner",emoji:"💋",reason:"Built an empire from zero. Business shark wrapped in pretty packaging. Don't underestimate."},
  {name:"Albert Einstein",emoji:"🧠",reason:"Genius brain that works differently. Messy outside, revolutionary inside. Decades ahead."},
  {name:"Beyoncé",emoji:"👑",reason:"Pure excellence. Every move is calculated, every performance is godly. Born to dominate."},
  {name:"Cristiano Ronaldo",emoji:"⚽",reason:"Obsessive about perfection. Works when others sleep. Simply refuses to be second."},
  {name:"Zendaya",emoji:"✨",reason:"Old soul in young body. Quietly powerful, emotionally intelligent, effortlessly cool."},
  {name:"Virat Kohli",emoji:"🏏",reason:"Fierce competitor with burning passion. Every game is life or death. Zero chill mode."},
  {name:"Taylor Swift",emoji:"🎸",reason:"Calculates every step 3 years ahead. Emotional genius who turns pain into art."},
  {name:"BTS V (Kim Taehyung)",emoji:"🎨",reason:"Mysteriously artistic. Doesn't follow trends, creates them. Galaxy-brained aesthetic."},
  {name:"Priyanka Chopra",emoji:"🌏",reason:"Global domination mode on. Breaks every ceiling, works every room, fears nothing."},
  {name:"Nikola Tesla",emoji:"⚡",reason:"Visionary so far ahead, the world wasn't ready. Pure electric creative force."},
];

function pick(arr, n) {
  return [...arr].sort(()=>Math.random()-0.5).slice(0, n);
}

function createResultCard() {
  const accuracy  = 82 + Math.floor(Math.random() * 17);
  const bestDay   = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][Math.floor(Math.random()*7)];
  const pastLife  = pick(PAST_LIFE_POOL, 1)[0];
  const darkSide  = pick(DARK_SIDE_POOL, 1)[0];
  const celebs    = pick(CELEB_MATCHES, 3);
  const highlight = ["Your Face Analysis is Complete! 🌟🔮","AI has unlocked your hidden traits! ✨","Magical insights from your face! 😎","Your personality secrets revealed! 🔥"][Math.floor(Math.random()*4)];

  const percentages = [
    {name:"Confidence",    val: 70+Math.floor(Math.random()*30), emoji:"😎"},
    {name:"Attractiveness",val: 75+Math.floor(Math.random()*25), emoji:"✨"},
    {name:"Intelligence",  val: 80+Math.floor(Math.random()*20), emoji:"🧠"},
    {name:"Happiness",     val: 65+Math.floor(Math.random()*35), emoji:"😄"},
    {name:"Charm",         val: 70+Math.floor(Math.random()*30), emoji:"🧲"}
  ];

  const statsHTML = percentages.map(p => `
    <div class="stat-box stat-box-ready">
      <h4>${p.emoji} ${p.name}</h4>
      <div class="stat-value">${p.val}%</div>
      <div class="stat-bar"><div class="stat-fill" style="width:0%" data-w="${p.val}%"></div></div>
    </div>`).join('');

  const pastLifeHTML = `
    <div class="crazy-card crazy-card--pastlife">
      <div class="cc-ribbon">🔮 Past Life Revealed</div>
      <div class="cc-main-emoji">${pastLife.role.split(' ').pop()}</div>
      <div class="cc-role">${pastLife.role}</div>
      <div class="cc-desc">${pastLife.desc}</div>
      <div class="cc-aura-row">
        <span class="cc-aura-label">Your Aura Color</span>
        <span class="cc-aura-chip" data-aura="${pastLife.aura}">${pastLife.aura}</span>
      </div>
    </div>`;

  const darkHTML = `
    <div class="crazy-card crazy-card--dark">
      <div class="cc-ribbon cc-ribbon--dark">😈 Your Dark Side</div>
      <div class="cc-dark-trait">${darkSide.trait}</div>
      <div class="cc-dark-meter-wrap">
        <span class="cc-dark-meter-label">Intensity</span>
        <div class="cc-dark-meter"><div class="cc-dark-fill" data-w="${darkSide.meter}%"></div></div>
        <span class="cc-dark-pct">${darkSide.meter}%</span>
      </div>
      <div class="cc-desc">${darkSide.desc}</div>
    </div>`;

  const celebHTML = `
    <div class="crazy-card crazy-card--celeb">
      <div class="cc-ribbon cc-ribbon--celeb">⭐ Celebrity Match</div>
      <div class="cc-celebs">
        ${celebs.map((c,i) => `
          <div class="cc-celeb-item ${i===0?'cc-celeb-top':''}">
            <div class="cc-celeb-emoji">${c.emoji}</div>
            <div class="cc-celeb-info">
              <div class="cc-celeb-name">${i===0?'<span class="cc-match-pct">Best Match</span>':''} ${c.name}</div>
              <div class="cc-celeb-reason">${c.reason}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  const html = `
    <div class="dynamic-result-inner">
      <img src="/favicon.ico" class="result-logo" alt="AI Face Analyzer">
      <div class="highlight-msg" id="highlightText">${highlight}</div>
      <div class="dynamic-photo-wrapper">
        <img src="${currentPhoto}" loading="eager">
        <div class="dynamic-glow"></div>
      </div>
      <div class="dynamic-circle" style="--prog:0%">
        <span id="accuracyText">0%</span>
      </div>
      <p class="accuracy-label">AI Confidence Score 🌟</p>
      <div class="face-stats" id="statsContainer">${statsHTML}</div>
      <div class="best-day-box">
        <span class="bestday-label">✨ Lucky Day</span>
        <span class="bestday-value">${bestDay}</span>
        <span class="bestday-emoji">🎉</span>
      </div>

      <div class="crazy-section-title">🤯 AI Deep Scan Results</div>
      <div class="crazy-cards-wrap">
        ${pastLifeHTML}
        ${darkHTML}
        ${celebHTML}
      </div>

      <div class="dynamic-actions">
        <button onclick="clearResult()" class="clear-result-btn">🗑️ Clear</button>
        <button onclick="shareFullResult()" class="share-result-btn">📤 Share Result</button>
      </div>
      <div class="result-watermark-visible">aifaceanalyzer.netlify.app</div>
    </div>
  `;

  const card = document.getElementById('dynamicResultCard');
  card.innerHTML = html;
  card.style.display = 'block';

  requestAnimationFrame(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Pro upsell: popup 8s after result renders
  if (localStorage.getItem('pus_is_pro') !== 'true') {
    setTimeout(() => {
      if (window.__pusOpen) window.__pusOpen('post_result');
    }, 8000);
  }

  requestAnimationFrame(() => setTimeout(() => {
    const circle = document.querySelector('.dynamic-circle');
    if (circle) circle.style.setProperty('--prog', accuracy + '%');
    const accEl = document.getElementById('accuracyText');
    if (accEl) {
      let c = 0; const step = Math.ceil(accuracy/40);
      const t = setInterval(() => {
        c = Math.min(c + step, accuracy);
        accEl.textContent = c + '%';
        if (c >= accuracy) clearInterval(t);
      }, 30);
    }
    card.querySelectorAll('.stat-fill').forEach(b => {
      b.style.transition = 'width 1s ease'; b.style.width = b.dataset.w;
    });
    card.querySelectorAll('.cc-dark-fill').forEach(b => {
      b.style.transition = 'width 1.2s ease'; b.style.width = b.dataset.w;
    });
    const auraChip = card.querySelector('.cc-aura-chip');
    if (auraChip) {
      const auraColors = {Gold:'#f59e0b',Red:'#ef4444',Purple:'#8b5cf6',Black:'#1f2937',Blue:'#3b82f6',Green:'#10b981',Silver:'#94a3b8',White:'#e5e7eb',Indigo:'#6366f1',Orange:'#f97316',Crimson:'#be123c',Teal:'#0d9488'};
      const col = auraColors[auraChip.dataset.aura] || '#7c3aed';
      auraChip.style.background = col;
      auraChip.style.color = auraChip.dataset.aura === 'White' ? '#1f2937' : '#fff';
    }
    card.querySelectorAll('.crazy-card').forEach((c, i) => {
      c.style.animationDelay = (i * 120) + 'ms';
      c.classList.add('cc-visible');
    });
  }, 100));
}

function typeWriterSafe(element, text, speed) {
  if (!element) return;
  element.innerHTML = '';
  let i = 0;
  element.classList.add('typing');
  const timer = setInterval(() => {
    if (i < text.length) {
      if (text.substr(i,8) === '<strong>') { element.innerHTML += '<strong>'; i += 8; }
      else if (text.substr(i,9) === '</strong>') { element.innerHTML += '</strong>'; i += 9; }
      else { element.innerHTML += text.charAt(i); i++; }
    } else {
      clearInterval(timer);
      element.classList.remove('typing');
    }
  }, speed);
}

function clearResult() {
  document.getElementById('dynamicResultCard').style.display = 'none';
  document.getElementById('dynamicResultCard').innerHTML = '';
  document.getElementById('previewContainer').innerHTML = '';
  currentPhoto = '';
  goToScreen('uploadScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function shareFullResult() {
  const card = document.getElementById('dynamicResultCard');
  try {
    const canvas = await html2canvas(card, { scale:2, useCORS:true, backgroundColor:null, logging:false, allowTaint:true });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "my-ai-face-analysis.png", { type:"image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({ files:[file], title:"My AI Face Analysis Result 😎✨", text:"Check out my personality analysis!\nVisit: https://aifaceanalyzer.netlify.app/" });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'my-ai-face-analysis.png';
        a.click();
        alert("Result downloaded! Share it anywhere 🔥\nLink: https://aifaceanalyzer.netlify.app/");
      }
    }, 'image/png');
  } catch(err) {
    alert("Error taking screenshot. Take a manual screenshot instead.");
  }
}

// ============================================================
//  DOM LOADED — INIT EVERYTHING
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const initCredits = getCredits();
  updateCreditDisplay(initCredits);
  maybeShowOfferToast();

  const creditPanel = document.getElementById('creditPanel');
  if (creditPanel) {
    creditPanel.addEventListener('click', (e) => {
      if (e.target === creditPanel) closeCreditPanel();
    });
  }

  const lowCreditModal = document.getElementById('lowCreditModal');
  if (lowCreditModal) {
    lowCreditModal.addEventListener('click', (e) => {
      if (e.target === lowCreditModal) lowCreditModal.classList.remove('show');
    });
  }

  const spinModalEl = document.getElementById('spinModal');
  if (spinModalEl) {
    spinModalEl.addEventListener('click', (e) => {
      if (e.target === spinModalEl) closeSpinModal();
    });
  }

  const streakPanelEl = document.getElementById('streakPanel');
  if (streakPanelEl) {
    streakPanelEl.addEventListener('click', (e) => {
      if (e.target === streakPanelEl) closeStreakPanel();
    });
  }

  const offerToast = document.getElementById('offerToast');
  if (offerToast) {
    const closeBtn = offerToast.querySelector('.offer-toast-close');
    if (closeBtn) closeBtn.onclick = () => offerToast.style.display = "none";
  }

  // ---- Firebase Auth Setup ----
  // Firebase is type="module" so it loads async — wait for it
  function initFirebaseAuth() {
    if (!window.firebaseAuth) { setTimeout(initFirebaseAuth, 80); return; }
    const {
      auth, provider,
      signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
      signOut, onAuthStateChanged,
      db, doc, setDoc, getDoc
    } = window.firebaseAuth;

  const loginBtn        = document.getElementById('loginBtn');
  const profileSection  = document.getElementById('profileSection');
  const profilePic      = document.getElementById('profilePic');
  const profileDropdown = document.getElementById('profileDropdown');
  const dropdownPic     = document.getElementById('dropdownPic');
  const dropdownName    = document.getElementById('dropdownName');
  const dropdownEmail   = document.getElementById('dropdownEmail');
  const authModal       = document.getElementById('authModal');
  const editModal       = document.getElementById('editProfileModal');
  const googleBtn       = document.getElementById('googleSignInBtn');
  const authForm        = document.getElementById('authForm');
  const authEmail       = document.getElementById('authEmail');
  const authPassword    = document.getElementById('authPassword');
  const authError       = document.getElementById('authError');
  const modalTitle      = document.getElementById('modalTitle');
  const modalSubtitle   = document.getElementById('modalSubtitle');
  const tabBtns         = document.querySelectorAll('.tab-btn');
  const editPreview     = document.getElementById('editPreview');
  const newPicInput     = document.getElementById('newPicInput');
  const editName        = document.getElementById('editName');
  const saveProfileBtn  = document.getElementById('saveProfileBtn');
  const editProfileBtn  = document.getElementById('editProfileBtn');
  const logoutBtn       = document.getElementById('logoutBtn');

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openLogin') === 'true') authModal.classList.add('show');
  if (urlParams.get('openEdit')  === 'true') editProfileBtn && editProfileBtn.click();

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isSignUp = btn.dataset.tab === 'signup';
      modalTitle.textContent    = isSignUp ? 'Create Account ✨' : 'Welcome! ✨';
      modalSubtitle.textContent = isSignUp ? 'Sign up to get 200,000 FREE credits!' : 'Sign in to unlock 200,000 credits';
      authForm.querySelector('button[type="submit"]').textContent = isSignUp ? 'Sign Up with Email' : 'Continue with Email';
    };
  });

  if (loginBtn) loginBtn.onclick = () => authModal.classList.add('show');

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
      authModal.classList.remove('show');
      editModal.classList.remove('show');
      authError.textContent = '';
    };
  });

  window.onclick = (e) => {
    if (e.target === authModal) { authModal.classList.remove('show'); authError.textContent = ''; }
    if (e.target === editModal)  editModal.classList.remove('show');
    if (!e.target.closest('.profile-section')) profileDropdown.classList.remove('show');
  };

  if (profilePic) profilePic.onclick = () => profileDropdown.classList.toggle('show');

  if (googleBtn) googleBtn.onclick = async () => {
    authError.textContent = 'Signing in with Google...';
    authError.style.color = '#8e2de2';
    try {
      await signInWithPopup(auth, provider);
      authModal.classList.remove('show');
      authError.textContent = '';
    } catch(err) {
      authError.textContent = 'Google sign in failed. Please try again.';
      authError.style.color = '#ff6b6b';
    }
  };

  if (authForm) authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email    = authEmail.value.trim();
    const password = authPassword.value;
    const isSignUp = document.querySelector('.tab-btn.active').dataset.tab === 'signup';

    authError.textContent = isSignUp ? 'Creating account...' : 'Signing in...';
    authError.style.color = '#8e2de2';

    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else          await signInWithEmailAndPassword(auth, email, password);
      authModal.classList.remove('show');
      authError.textContent = '';
    } catch(err) {
      authError.style.color = '#ff6b6b';
      let msg = 'An error occurred. Please try again.';
      if (err.message.includes('wrong-password'))       msg = 'Wrong password';
      else if (err.message.includes('user-not-found'))  msg = 'No user found with this email';
      else if (err.message.includes('email-already-in-use')) msg = 'Email already in use';
      else if (err.message.includes('weak-password'))   msg = 'Password should be at least 6 characters';
      authError.textContent = msg;
    }
  };

  async function loadUserData(user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        return { name: d.name || user.displayName || 'User', photo: d.photo || user.photoURL || '/favicon.ico', email: user.email };
      }
    } catch(err) { console.error(err); }
    return { name: user.displayName || 'User', photo: user.photoURL || '/favicon.ico', email: user.email };
  }

  function updateUI(data) {
    if (document.getElementById('profilePic'))   document.getElementById('profilePic').src   = data.photo;
    if (document.getElementById('dropdownPic'))  document.getElementById('dropdownPic').src  = data.photo;
    if (document.getElementById('dropdownName')) document.getElementById('dropdownName').textContent  = data.name;
    if (document.getElementById('dropdownEmail'))document.getElementById('dropdownEmail').textContent = data.email || '';
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      loginBtn.style.display = 'none';
      profileSection.style.display = 'block';

      const wasLoggedIn = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
      if (!wasLoggedIn) {
        localStorage.setItem(CREDIT_KEY, LOGIN_START);
        localStorage.setItem(CREDIT_USED_KEY, '0');
        localStorage.setItem(CREDIT_LOGGED_KEY, 'true');
        localStorage.setItem(CREDIT_TS_KEY, Date.now());
        localStorage.removeItem(CREDIT_HIST_KEY);
        updateCreditDisplay(LOGIN_START);
        showLoginSuccessToast();
      }

      const userData   = await loadUserData(user);
      const finalName  = localStorage.getItem('userName')  || userData.name;
      const finalPhoto = localStorage.getItem('userPhoto') || userData.photo;
      updateUI({ name: finalName, photo: finalPhoto, email: userData.email });

    } else {
      const localName  = localStorage.getItem('userName');
      const localPhoto = localStorage.getItem('userPhoto');
      if (localName || localPhoto) {
        loginBtn.style.display = 'none';
        profileSection.style.display = 'block';
        updateUI({ name: localName || 'User', photo: localPhoto || '/favicon.ico', email: '' });
      } else {
        loginBtn.style.display = 'block';
        profileSection.style.display = 'none';
      }
      profileDropdown.classList.remove('show');
    }
  });

  function showLoginSuccessToast() {
    const toast = document.getElementById('offerToast');
    if (!toast) return;
    const strong = toast.querySelector('strong');
    const span   = toast.querySelector('span');
    if (strong) strong.textContent = '🎉 Welcome! 200,000 Credits Unlocked!';
    if (span)   span.textContent   = 'Your credits have been added. Enjoy unlimited analyses!';
    toast.style.display = "flex";
    localStorage.setItem('afa_toast_ts', Date.now());
    setTimeout(() => toast.style.display = 'none', 7000);
  }

  if (editProfileBtn) editProfileBtn.onclick = async () => {
    const localName  = localStorage.getItem('userName');
    const localPhoto = localStorage.getItem('userPhoto');
    let currentName  = localName  || 'User';
    let currentPhotoVal = localPhoto || '/favicon.ico';
    const user = auth.currentUser;
    if (user) {
      const ud = await loadUserData(user);
      currentName     = localName  || ud.name;
      currentPhotoVal = localPhoto || ud.photo;
    }
    editPreview.src  = currentPhotoVal;
    editName.value   = currentName;
    editModal.classList.add('show');
  };

  if (newPicInput) newPicInput.onchange = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => editPreview.src = ev.target.result;
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (saveProfileBtn) saveProfileBtn.onclick = async () => {
    const newName  = editName.value.trim() || 'User';
    const newPhoto = editPreview.src || '/favicon.ico';
    saveProfileBtn.textContent = 'Saving...';
    saveProfileBtn.disabled    = true;
    try {
      localStorage.setItem('userName',  newName);
      localStorage.setItem('userPhoto', newPhoto);
      const user = auth.currentUser;
      if (user) await setDoc(doc(db, "users", user.uid), { name: newName, photo: newPhoto }, { merge: true });

      document.getElementById('profilePic').src          = newPhoto;
      document.getElementById('dropdownPic').src         = newPhoto;
      document.getElementById('dropdownName').textContent = newName;
      document.getElementById('loginBtn').style.display  = 'none';
      document.getElementById('profileSection').style.display = 'block';

      saveProfileBtn.textContent = 'Saved! ✅';
      setTimeout(() => {
        editModal.classList.remove('show');
        saveProfileBtn.textContent = 'Save Changes';
        saveProfileBtn.disabled    = false;
      }, 1000);
    } catch(err) {
      console.error(err);
      alert('Error saving profile. Please try again.');
      saveProfileBtn.textContent = 'Save Changes';
      saveProfileBtn.disabled    = false;
    }
  };

  if (logoutBtn) logoutBtn.onclick = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhoto');
      localStorage.removeItem(CREDIT_LOGGED_KEY);
      localStorage.setItem(CREDIT_KEY,      GUEST_START);
      localStorage.setItem(CREDIT_USED_KEY, '0');
      localStorage.setItem(CREDIT_TS_KEY,   Date.now());
      localStorage.removeItem(CREDIT_HIST_KEY);
      updateCreditDisplay(GUEST_START);
      alert('Logged out successfully!');
      location.reload();
    } catch(err) {
      alert('Logout failed. Please try again.');
    }
  };

  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.addEventListener('change', e => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => { currentPhoto = ev.target.result; showPreview(ev.target.result); };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
  } // end initFirebaseAuth
  initFirebaseAuth();

});

// ============================================================
//  LIVE ANIMATION ENGINE
// ============================================================

const ALL_TESTIMONIALS = [
  { stars:'⭐⭐⭐⭐⭐', text:'"OMG this is so accurate! It said I\'m a natural leader and all my friends agree 😂 The lucky day was spot on!"', avatar:'👩🏽', name:'Priya S.', loc:'Mumbai, India', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Tried with my whole squad at a sleepover. We were laughing for hours! Result cards look amazing shared."', avatar:'👩🏻', name:'Sofia R.', loc:'Madrid, Spain', cls:'testimonial-card--purple' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Love that my photo isn\'t uploaded anywhere. Finally a fun AI tool I can actually trust. Face Future section is wild!"', avatar:'🧑🏾', name:'Kwame A.', loc:'Lagos, Nigeria', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Bahut mast hai yaar! Pura sahi bataya — creative mastermind 🎨 Dosto ko share kiya sabne try kiya!"', avatar:'👦🏽', name:'Arjun K.', loc:'Delhi, India', cls:'testimonial-card--pink' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Used it 5 times with different expressions. Got different traits each time! Best free AI tool I\'ve found."', avatar:'👩🏼', name:'Emma T.', loc:'London, UK', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"The loading animation is so clean. Feels like a premium app but totally free. Bookmarked!"', avatar:'🧑🏻', name:'Yuki M.', loc:'Tokyo, Japan', cls:'testimonial-card--purple' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Showed my personality as Empath ❤️ — my family said it\'s 100% true! Shared it in family group lol."', avatar:'👩🏾', name:'Fatima A.', loc:'Cairo, Egypt', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"I got \'The Mystic\' 🔮 three times in a row. Clearly the universe agrees. This app is addicting!"', avatar:'🧑🏻', name:'Liam O.', loc:'Dublin, Ireland', cls:'testimonial-card--pink' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Mera result aaya The Guardian 🛡️ — sach mein main hamesha sabki madad karta hun. Perfect result!"', avatar:'👦🏽', name:'Rohan M.', loc:'Pune, India', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Tried with 5 friends at a party — everyone got different types! The Creator was most common lol."', avatar:'👩🏼', name:'Chloe B.', loc:'Paris, France', cls:'testimonial-card--purple' },
  { stars:'⭐⭐⭐⭐⭐', text:'"No watermark, no login, instant result — who is making free tools like this?? Absolutely love it."', avatar:'🧑🏾', name:'Tariq N.', loc:'Nairobi, Kenya', cls:'' },
  { stars:'⭐⭐⭐⭐⭐', text:'"Got The Achiever ⚡ and honestly that\'s my whole personality. The accuracy is scary sometimes 😅"', avatar:'👩🏻', name:'Ana P.', loc:'São Paulo, Brazil', cls:'testimonial-card--pink' },
];

const ALL_COUNTRIES = [
  { flag:'🇮🇳', name:'India',       count:'88K+', pct:88 },
  { flag:'🇺🇸', name:'USA',         count:'74K+', pct:74 },
  { flag:'🇧🇷', name:'Brazil',      count:'52K+', pct:52 },
  { flag:'🇵🇭', name:'Philippines', count:'41K+', pct:41 },
  { flag:'🇳🇬', name:'Nigeria',     count:'35K+', pct:35 },
  { flag:'🇵🇰', name:'Pakistan',    count:'29K+', pct:29 },
  { flag:'🇬🇧', name:'UK',          count:'26K+', pct:26 },
  { flag:'🇯🇵', name:'Japan',       count:'22K+', pct:22 },
  { flag:'🇲🇾', name:'Malaysia',    count:'19K+', pct:19 },
  { flag:'🇮🇩', name:'Indonesia',   count:'31K+', pct:31 },
  { flag:'🇪🇬', name:'Egypt',       count:'17K+', pct:17 },
  { flag:'🇲🇽', name:'Mexico',      count:'24K+', pct:24 },
];

const LIVE_FEED_DATA = [
  "🇮🇳 Someone in Mumbai just got 'The Leader' 👑",
  "🇺🇸 Someone in New York got 'The Achiever' ⚡",
  "🇧🇷 Someone in São Paulo got 'The Creator' 🎨",
  "🇵🇭 Someone in Manila got 'The Empath' ❤️",
  "🇬🇧 Someone in London got 'The Thinker' 🧠",
  "🇳🇬 Someone in Lagos got 'The Explorer' 🌍",
  "🇵🇰 Someone in Karachi got 'The Connector' 🤝",
  "🇯🇵 Someone in Tokyo got 'The Mystic' 🔮",
  "🇩🇪 Someone in Berlin got 'The Guardian' 🛡️",
  "🇮🇩 Someone in Jakarta got 'The Leader' 👑",
  "🇲🇾 Someone in KL got 'The Creator' 🎨",
  "🇪🇬 Someone in Cairo got 'The Empath' ❤️",
  "🇲🇽 Someone in Mexico City got 'The Achiever' ⚡",
  "🇿🇦 Someone in Johannesburg got 'The Explorer' 🌍",
  "🇹🇷 Someone in Istanbul got 'The Mystic' 🔮",
  "🇨🇦 Someone in Toronto got 'The Thinker' 🧠",
  "🇫🇷 Someone in Paris got 'The Connector' 🤝",
  "🇦🇺 Someone in Sydney got 'The Guardian' 🛡️",
  "🇸🇦 Someone in Riyadh got 'The Leader' 👑",
  "🇰🇷 Someone in Seoul got 'The Creator' 🎨",
];

function initScrollReveal() {
  const revealMap = [
    ['.stats-section',        'reveal'],
    ['.howto-section',        'reveal'],
    ['.ptypes-section',       'reveal'],
    ['.features-section',     'reveal'],
    ['.testimonials-section', 'reveal'],
    ['.worldmap-section',     'reveal'],
    ['.tips-section',         'reveal'],
    ['.share-section',        'reveal'],
    ['.future-hero',          'reveal-scale'],
    ['.faq-section',          'reveal'],
    ['.howto-steps',          'stagger-children'],
    ['.ptypes-grid',          'stagger-children'],
    ['.tips-grid',            'stagger-children'],
    ['.stats-grid',           'stagger-children'],
    ['.share-btns',           'stagger-children'],
  ];

  revealMap.forEach(([sel, cls]) => {
    document.querySelectorAll(sel).forEach(el => el.classList.add(cls));
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('worldmap-section')) {
          animateCountryBars();
        }
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')
    .forEach(el => io.observe(el));
}

function initRotatingTestimonials() {
  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;

  let pool = [...ALL_TESTIMONIALS];
  let shown = pool.splice(0, 6);

  function renderTestimonials(list) {
    grid.innerHTML = list.map(t => `
      <div class="testimonial-card ${t.cls} testimonial-entering">
        <div class="testimonial-stars">${t.stars}</div>
        <p>${t.text}</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${t.avatar}</div>
          <div><strong>${t.name}</strong><span>${t.loc}</span></div>
        </div>
      </div>
    `).join('');
  }

  renderTestimonials(shown);

  setInterval(() => {
    if (pool.length === 0) pool = [...ALL_TESTIMONIALS].filter(t => !shown.includes(t));
    if (pool.length === 0) return;

    const replaceIdx = Math.floor(Math.random() * shown.length);
    const nextIdx    = Math.floor(Math.random() * pool.length);
    const next = pool.splice(nextIdx, 1)[0];
    pool.push(shown[replaceIdx]);
    shown[replaceIdx] = next;

    const cards = grid.querySelectorAll('.testimonial-card');
    if (cards[replaceIdx]) {
      cards[replaceIdx].style.opacity = '0';
      cards[replaceIdx].style.transform = 'translateY(16px)';
      setTimeout(() => {
        cards[replaceIdx].outerHTML = `
          <div class="testimonial-card ${next.cls} testimonial-entering">
            <div class="testimonial-stars">${next.stars}</div>
            <p>${next.text}</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">${next.avatar}</div>
              <div><strong>${next.name}</strong><span>${next.loc}</span></div>
            </div>
          </div>`;
      }, 300);
    }
  }, 4000);
}

function animateCountryBars() {
  const container = document.querySelector('.worldmap-countries');
  if (!container) return;

  const shuffled = [...ALL_COUNTRIES].sort(() => Math.random() - 0.5).slice(0, 6);
  container.innerHTML = shuffled.map(c => `
    <div class="wc-item">
      <span class="wc-flag">${c.flag}</span>
      <span class="wc-name">${c.name}</span>
      <div class="wc-bar"><span style="width:0%"></span></div>
      <span class="wc-count">${c.count}</span>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll('.wc-bar span').forEach((bar, i) => {
        bar.style.width = shuffled[i].pct + '%';
      });
    }, 80);
  });
}

function initRotatingCountries() {
  setInterval(() => {
    const section = document.querySelector('.worldmap-section');
    if (section && section.classList.contains('visible')) {
      const container = document.querySelector('.worldmap-countries');
      if (!container) return;
      const shuffled = [...ALL_COUNTRIES].sort(() => Math.random() - 0.5).slice(0, 6);
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.4s';
      setTimeout(() => {
        container.innerHTML = shuffled.map(c => `
          <div class="wc-item">
            <span class="wc-flag">${c.flag}</span>
            <span class="wc-name">${c.name}</span>
            <div class="wc-bar"><span style="width:0%"></span></div>
            <span class="wc-count">${c.count}</span>
          </div>
        `).join('');
        container.style.opacity = '1';
        requestAnimationFrame(() => {
          setTimeout(() => {
            container.querySelectorAll('.wc-bar span').forEach((bar, i) => {
              bar.style.width = shuffled[i].pct + '%';
            });
          }, 60);
        });
      }, 400);
    }
  }, 8000);
}

function initLiveFeed() {
  const el = document.getElementById('liveFeed');
  if (!el) return;
  let idx = Math.floor(Math.random() * LIVE_FEED_DATA.length);

  function showNext() {
    const msg = LIVE_FEED_DATA[idx % LIVE_FEED_DATA.length];
    idx++;
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => {
      el.innerHTML = `<div class="live-feed-item"><span class="live-dot"></span>${msg}</div>`;
      el.style.transition = 'opacity 0.4s, transform 0.4s';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 300);
  }

  showNext();
  setInterval(showNext, 3000);
}

// ============================================================
//  ★ CHANGED: initLiveStatsIncrement — country data se connected
// ============================================================

// Leaderboard country base data (script.js se sync)
const LB_COUNTRY_BASE = [
  {n:'India',       f:'🇮🇳', dailyAvg:242},
  {n:'USA',         f:'🇺🇸', dailyAvg:203},
  {n:'Brazil',      f:'🇧🇷', dailyAvg:143},
  {n:'Philippines', f:'🇵🇭', dailyAvg:113},
  {n:'Nigeria',     f:'🇳🇬', dailyAvg: 97},
  {n:'Pakistan',    f:'🇵🇰', dailyAvg: 82},
  {n:'Japan',       f:'🇯🇵', dailyAvg: 73},
  {n:'UK',          f:'🇬🇧', dailyAvg: 63},
  {n:'Germany',     f:'🇩🇪', dailyAvg: 54},
  {n:'Mexico',      f:'🇲🇽', dailyAvg: 48},
];
const LB_APP_LAUNCH = new Date('2025-01-01');

// ── GLOBAL PERSISTENT COUNTERS ──
// Ek baar init hote hain, sirf badhte hain, page refresh pe bhi same value se shuru
const _LIVE = (() => {
  const STORAGE_KEY    = 'afa_live_analyses';
  const STORAGE_TS_KEY = 'afa_live_analyses_ts';
  const COUNTRY_KEY    = 'afa_live_country';

  // Base calculation
  function calcBase() {
    const days = Math.max(1, Math.floor((Date.now() - LB_APP_LAUNCH) / 86400000));
    let extra = {};
    try { extra = JSON.parse(localStorage.getItem('afa_country_extra') || '{}'); } catch(e) {}
    return LB_COUNTRY_BASE.reduce((sum, c) => sum + (c.dailyAvg * days) + (extra[c.n] || 0), 0);
  }

  // Country-wise persistent counters
  function getCountry() {
    try {
      const saved = JSON.parse(localStorage.getItem(COUNTRY_KEY) || 'null');
      if (saved) {
        // Make sure all countries exist
        LB_COUNTRY_BASE.forEach(c => {
          if (!saved[c.n]) {
            const days = Math.max(1, Math.floor((Date.now() - LB_APP_LAUNCH) / 86400000));
            saved[c.n] = c.dailyAvg * days;
          }
        });
        return saved;
      }
    } catch(e) {}
    // First time — seed from base
    const days = Math.max(1, Math.floor((Date.now() - LB_APP_LAUNCH) / 86400000));
    const obj = {};
    LB_COUNTRY_BASE.forEach(c => { obj[c.n] = c.dailyAvg * days; });
    return obj;
  }

  function saveCountry(obj) {
    try { localStorage.setItem(COUNTRY_KEY, JSON.stringify(obj)); } catch(e) {}
  }

  // Total persistent analyses
  function getTotal() {
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
      const base  = calcBase();
      // Take whichever is bigger — never go back
      return Math.max(saved, base);
    } catch(e) { return calcBase(); }
  }

  function saveTotal(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch(e) {}
  }

  // Init
  let _total   = getTotal();
  let _country = getCountry();
  saveTotal(_total);
  saveCountry(_country);

  // Ticker — every 1s badhao, dono jagah sync rahe
  setInterval(() => {
    // Total mein +3 to +10
    const gain = Math.floor(Math.random() * 8) + 3;
    _total += gain;
    saveTotal(_total);

    // Country mein distribute karo proportionally
    const totalDailyAvg = LB_COUNTRY_BASE.reduce((s, c) => s + c.dailyAvg, 0);
    LB_COUNTRY_BASE.forEach(c => {
      const share = Math.round(gain * c.dailyAvg / totalDailyAvg);
      _country[c.n] = (_country[c.n] || 0) + share;
    });
    saveCountry(_country);
  }, 2500);

  return {
    getTotal:   ()    => _total,
    getCountry: ()    => ({..._country}),
    addForUser: (country) => {
      _total += 1;
      if (_country[country] !== undefined) _country[country] += 1;
      saveTotal(_total);
      saveCountry(_country);
    },
  };
})();
window._LIVE = _LIVE; // Expose globally for agedetector and other pages

// Backward compat
function getLbTotalAnalyses() {
  return _LIVE.getTotal();
}

function initLiveStatsIncrement() {
  // _LIVE global counter se read karo — woh khud har second badhta hai
  // Yahan sirf DOM update karo smoothly

  function rollTo(el, fromVal, toVal, dur) {
    const t0   = performance.now();
    const diff = toVal - fromVal;
    if (diff <= 0) return;
    function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.floor(fromVal + diff * e);
      // No decimals — always clean integers
      el.textContent = v >= 1000000
        ? Math.floor(v / 1000000) + 'M+'
        : v >= 1000
        ? Math.floor(v / 1000) + 'K+'
        : v + '+';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function showPop(el, amount) {
    if (amount <= 0) return;
    // Bump animation on number
    el.classList.remove('bumping');
    void el.offsetWidth;
    el.classList.add('bumping');
    setTimeout(() => el.classList.remove('bumping'), 460);
    // +N floating particle
    const pop = document.createElement('span');
    pop.className = 'stat-plus-pop';
    pop.textContent = '+' + amount;
    el.style.position = 'relative';
    el.appendChild(pop);
    setTimeout(() => pop.remove(), 1200);
  }

  let _prevA = _LIVE.getTotal();
  let _prevT = _prevA * 20;

  // Har second _LIVE se fresh value lo aur diff dikhao
  setInterval(() => {
    const elA = document.getElementById('liveAnalysisStatEl') ||
                document.querySelector('[data-target="248319"]');
    if (elA && elA.dataset.animated) {
      const nowA = _LIVE.getTotal();
      const diff = nowA - _prevA;
      rollTo(elA, _prevA, nowA, 800);
      if (diff > 0) showPop(elA, diff);
      _prevA = nowA;
    }

    const elT = document.getElementById('liveTraitsStatEl') ||
                document.querySelector('[data-target="4800000"]');
    if (elT && elT.dataset.animated) {
      const nowT = _LIVE.getTotal() * 20;
      const diffT = nowT - _prevT;
      rollTo(elT, _prevT, nowT, 800);
      if (diffT > 0) showPop(elT, diffT);
      _prevT = nowT;
    }
  }, 2500);
}
function initStatsCounter() {
  function animateCounter(el, target, duration) {
    // Agar yeh "Faces Analyzed" ya "Traits" hai toh live value use karo
    let effectiveTarget = target;
    if (target === 248319) effectiveTarget = getLbTotalAnalyses();
    if (target === 4800000) effectiveTarget = getLbTotalAnalyses() * 20;

    let start = 0;
    const step = effectiveTarget / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= effectiveTarget) { start = effectiveTarget; clearInterval(timer); }
      const val = Math.floor(start);
      el.dataset.animated = 'true';
      el.dataset.current  = val;
      if (target === 97)         el.textContent = val + '%';
      else if (val >= 1000000)   el.textContent = Math.floor(val/1000000) + 'M+';
      else if (val >= 1000)      el.textContent = Math.floor(val/1000) + 'K+';
      else                       el.textContent = val + '+';
    }, 16);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target), 2000);
        });
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const statsEl = document.querySelector('.stats-section');
  if (statsEl) io.observe(statsEl);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initStatsCounter();
  initRotatingTestimonials();
  initRotatingCountries();
  initLiveFeed();
  initLiveStatsIncrement();
  initFunfactRotator();
});

function initFunfactRotator() {
  const facts = [
    'Most common type worldwide: <strong>The Achiever ⚡</strong>',
    'Rarest type detected: <strong>The Mystic 🔮</strong> — only 4% of users!',
    '<strong>68%</strong> of users share their result on social media 📲',
    'The Empath ❤️ is most common among <strong>women aged 18–25</strong>',
    'Leaders 👑 tend to score highest in the <strong>Confidence</strong> trait',
    '<strong>India</strong> has the most Achievers ⚡ of any country!',
    'Thinkers 🧠 get the highest <strong>Intelligence</strong> scores on average',
    'Tried different expressions? You might get a <strong>different type!</strong> 😄',
    'The Explorer 🌍 is the most common type in <strong>Brazil & Philippines</strong>',
    'Connectors 🤝 score highest in <strong>Charm & Happiness</strong> traits',
  ];
  const el = document.getElementById('ptypeFunfactText');
  if (!el) return;
  let i = 0;
  setInterval(() => {
    i = (i + 1) % facts.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.innerHTML = facts[i];
      el.style.opacity = '1';
      el.style.transition = 'opacity 0.5s';
    }, 400);
  }, 4000);
}

// ============================================================
//  🎵 SOUND ENGINE
// ============================================================

function isSoundEnabled() {
  return localStorage.getItem('afa_setting_sound') !== '0';
}

function isAnimEnabled() {
  return localStorage.getItem('afa_setting_anim') !== '0';
}

const SoundEngine = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function beep(freq, dur, type = 'sine', vol = 0.3) {
    if (!isSoundEnabled()) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.start(); o.stop(c.currentTime + dur);
    } catch(e) {}
  }
  return {
    click()   { beep(800, 0.06, 'square', 0.15); },
    scan()    {
      if (!isSoundEnabled()) return;
      try {
        const c = getCtx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, c.currentTime);
        o.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.6);
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
        o.start(); o.stop(c.currentTime + 0.6);
      } catch(e) {}
    },
    result()  {
      if (!isSoundEnabled()) return;
      [[523,0],[659,0.1],[784,0.2],[1047,0.35]].forEach(([f,t]) => {
        setTimeout(() => beep(f, 0.4, 'sine', 0.2), t * 1000);
      });
    },
    spin()    { beep(440, 0.08, 'square', 0.2); },
    streak()  {
      if (!isSoundEnabled()) return;
      [523,587,659,784,1047].forEach((f,i) => {
        setTimeout(() => beep(f, 0.15, 'sine', 0.25), i * 80);
      });
    },
    error()   { beep(200, 0.3, 'sawtooth', 0.2); },
  };
})();

document.addEventListener('click', (e) => {
  if (e.target.closest('button') || e.target.closest('.upload-card') || e.target.closest('.credit-display')) {
    SoundEngine.click();
  }
}, true);

// ============================================================
//  💥 CONFETTI ENGINE
// ============================================================

function launchConfetti() {
  if (!isAnimEnabled()) return;

  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#7c3aed','#ec4899','#fbbf24','#10b981','#3b82f6','#f97316','#ef4444','#8b5cf6'];
  const pieces = Array.from({length: 160}, () => ({
    x:    Math.random() * canvas.width,
    y:    -Math.random() * canvas.height * 0.5,
    w:    6 + Math.random() * 10,
    h:    10 + Math.random() * 14,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot:  Math.random() * 360,
    vx:   (Math.random() - 0.5) * 4,
    vy:   2 + Math.random() * 4,
    vr:   (Math.random() - 0.5) * 6,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 140);
      if (p.shape === 'rect') ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      else { ctx.beginPath(); ctx.arc(0, 0, p.w/2, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
      p.vy += 0.08;
    });
    frame++;
    if (frame < 160) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display='none'; }
  }
  draw();
  SoundEngine.result();
}

// ============================================================
//  👁️ FACE SCAN OVERLAY
// ============================================================
const scanTexts = [
  'Scanning face structure...',
  'Detecting facial landmarks...',
  'Mapping personality zones...',
  'Reading micro expressions...',
  'Analyzing symmetry ratios...',
  'Unlocking hidden traits...',
];

function showFaceScanOverlay(duration, onDone) {
  const overlay = document.getElementById('faceScanOverlay');
  const textEl  = document.getElementById('scanText');
  if (!overlay) { onDone && onDone(); return; }
  overlay.style.display = 'flex';
  SoundEngine.scan();
  let ti = 0;
  const textTimer = setInterval(() => {
    ti = (ti + 1) % scanTexts.length;
    if (textEl) textEl.textContent = scanTexts[ti];
  }, duration / scanTexts.length);
  setTimeout(() => {
    clearInterval(textTimer);
    overlay.style.display = 'none';
    onDone && onDone();
  }, duration);
}

// ============================================================
//  🔥 STREAK SYSTEM
// ============================================================
const STREAK_KEY       = 'afa_streak_days';
const STREAK_LAST_KEY  = 'afa_streak_last';
const STREAK_BEST_KEY  = 'afa_streak_best';
const STREAK_REWARDED_KEY = 'afa_streak_rewarded';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getStreakData() {
  return {
    days:     parseInt(localStorage.getItem(STREAK_KEY) || '0'),
    last:     localStorage.getItem(STREAK_LAST_KEY) || '',
    best:     parseInt(localStorage.getItem(STREAK_BEST_KEY) || '0'),
    rewarded: JSON.parse(localStorage.getItem(STREAK_REWARDED_KEY) || '[]'),
  };
}

function recordStreakDay() {
  const today = getTodayStr();
  const data  = getStreakData();
  if (data.last === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  let newDays = data.last === yStr ? data.days + 1 : 1;
  const newBest = Math.max(newDays, data.best);

  localStorage.setItem(STREAK_KEY, newDays);
  localStorage.setItem(STREAK_LAST_KEY, today);
  localStorage.setItem(STREAK_BEST_KEY, newBest);

  updateStreakBadge(newDays);
  checkStreakRewards(newDays, data.rewarded);
  return newDays;
}

function checkStreakRewards(days, alreadyRewarded) {
  const rewards = [{days:3, credits:2000, id:'r3'}, {days:7, credits:5000, id:'r7'}, {days:30, credits:25000, id:'r30'}];
  rewards.forEach(r => {
    if (days >= r.days && !alreadyRewarded.includes(r.id)) {
      const newRewarded = [...alreadyRewarded, r.id];
      localStorage.setItem(STREAK_REWARDED_KEY, JSON.stringify(newRewarded));
      const current = getCredits();
      localStorage.setItem(CREDIT_KEY, current + r.credits);
      updateCreditDisplay(current + r.credits);
      showStreakRewardToast(r.days, r.credits);
      SoundEngine.streak();
    }
  });
}

function showStreakRewardToast(days, credits) {
  const toast = document.getElementById('offerToast');
  if (!toast) return;
  const strong = toast.querySelector('strong');
  const span   = toast.querySelector('span');
  if (strong) strong.textContent = `🔥 ${days}-Day Streak Reward!`;
  if (span)   span.textContent   = `+${credits.toLocaleString()} Credits added to your account!`;
  toast.style.display = 'flex';
  setTimeout(() => toast.style.display = 'none', 6000);
}

function updateStreakBadge(days) {
  const badge = document.getElementById('streakBadge');
  const count = document.getElementById('streakCount');
  if (!badge || !count) return;
  count.textContent = days;
  if (days >= 3) badge.classList.add('on-fire');
  else badge.classList.remove('on-fire');
  badge.style.display = '';
}

function openStreakPanel() {
  const panel = document.getElementById('streakPanel');
  if (!panel) return;
  panel.classList.add('show');
  refreshStreakPanel();
}
function closeStreakPanel() {
  document.getElementById('streakPanel')?.classList.remove('show');
}

function refreshStreakPanel() {
  const data = getStreakData();
  const titleEl = document.getElementById('streakModalTitle');
  const subEl   = document.getElementById('streakModalSub');
  if (titleEl) titleEl.textContent = data.days > 0 ? `🔥 ${data.days} Day Streak!` : 'Start Your Streak!';
  if (subEl)   subEl.textContent   = data.days > 0 ? `Keep going! Analyze daily for rewards.` : 'Analyze today to start your streak!';
  const ssC = document.getElementById('ssCurrentStreak');
  const ssB = document.getElementById('ssBestStreak');
  const ssT = document.getElementById('ssTotalDays');
  if (ssC) ssC.textContent = data.days;
  if (ssB) ssB.textContent = data.best;
  if (ssT) ssT.textContent = parseInt(localStorage.getItem('afa_total_days') || '0');

  const cal = document.getElementById('streakCalendar');
  if (cal) {
    const today    = getTodayStr();
    const days28   = Array.from({length:28}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (27 - i));
      return d.toISOString().split('T')[0];
    });
    const doneDays = JSON.parse(localStorage.getItem('afa_done_days') || '[]');
    cal.innerHTML = days28.map(d => {
      const isToday = d === today;
      const isDone  = doneDays.includes(d);
      return `<div class="sc-day ${isDone?'done':''} ${isToday&&!isDone?'today':''}">${isDone?'🔥':''}</div>`;
    }).join('');
  }

  const r3  = document.getElementById('reward3');
  const r7  = document.getElementById('reward7');
  const r30 = document.getElementById('reward30');
  if (r3  && data.rewarded.includes('r3'))  r3.classList.add('claimed');
  if (r7  && data.rewarded.includes('r7'))  r7.classList.add('claimed');
  if (r30 && data.rewarded.includes('r30')) r30.classList.add('claimed');
  if (r3  && data.days >= 3  && !data.rewarded.includes('r3'))  r3.classList.add('unlocked');
  if (r7  && data.days >= 7  && !data.rewarded.includes('r7'))  r7.classList.add('unlocked');
  if (r30 && data.days >= 30 && !data.rewarded.includes('r30')) r30.classList.add('unlocked');
}

function initStreak() {
  const data = getStreakData();
  updateStreakBadge(data.days);
}

// ============================================================
//  🎰 SPIN WHEEL
// ============================================================
const SPIN_TYPES = [
  { label:'Leader',    emoji:'👑', color:'#7c3aed' },
  { label:'Creator',   emoji:'🎨', color:'#ec4899' },
  { label:'Thinker',   emoji:'🧠', color:'#3b82f6' },
  { label:'Empath',    emoji:'❤️', color:'#10b981' },
  { label:'Mystic',    emoji:'🔮', color:'#f59e0b' },
  { label:'Achiever',  emoji:'⚡', color:'#8b5cf6' },
  { label:'Explorer',  emoji:'🌍', color:'#f43f5e' },
  { label:'Connector', emoji:'🤝', color:'#06b6d4' },
];

let spinAngle    = 0;
let spinVelocity = 0;
let isSpinning   = false;
let spinRAF      = null;

function drawWheel(angle) {
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const cx   = canvas.width / 2;
  const cy   = canvas.height / 2;
  const r    = cx - 8;
  const seg  = (Math.PI * 2) / SPIN_TYPES.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  SPIN_TYPES.forEach((type, i) => {
    const startA = angle + i * seg;
    const endA   = startA + seg;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startA, endA);
    ctx.closePath();
    ctx.fillStyle = type.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startA + seg / 2);
    ctx.textAlign = 'right';
    ctx.font = '16px serif';
    ctx.fillText(type.emoji, r - 10, 5);
    ctx.font = 'bold 11px Poppins, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(type.label, r - 30, 5);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = 'bold 14px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText('🎰', cx, cy + 5);
}

function openSpinModal() {
  const modal = document.getElementById('spinModal');
  if (!modal) return;
  modal.classList.add('show');
  spinAngle = 0;
  drawWheel(spinAngle);
  document.getElementById('spinResult').textContent = '';
  const btn = document.getElementById('spinBtn');
  if (btn) { btn.disabled = false; btn.textContent = '🎰 SPIN!'; }
}

function closeSpinModal() {
  document.getElementById('spinModal')?.classList.remove('show');
  if (spinRAF) { cancelAnimationFrame(spinRAF); spinRAF = null; }
}

function spinWheel() {
  if (isSpinning) return;
  const btn = document.getElementById('spinBtn');
  if (btn) { btn.disabled = true; btn.textContent = '🌀 Spinning...'; }
  document.getElementById('spinResult').textContent = '';

  isSpinning   = true;
  spinVelocity = 0.25 + Math.random() * 0.2;
  const totalRotations = 4 + Math.floor(Math.random() * 4);
  const targetExtra    = Math.random() * Math.PI * 2;
  const targetAngle    = spinAngle + Math.PI * 2 * totalRotations + targetExtra;
  const duration       = 3000 + Math.random() * 1000;
  const startTime      = performance.now();
  const startAngle     = spinAngle;

  SoundEngine.spin();

  function animate(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    spinAngle = startAngle + (targetAngle - startAngle) * eased;
    drawWheel(spinAngle);

    const segAngle = (Math.PI * 2) / SPIN_TYPES.length;
    const prevSeg  = Math.floor(((spinAngle - 0.05) % (Math.PI*2)) / segAngle);
    const currSeg  = Math.floor((spinAngle % (Math.PI*2)) / segAngle);
    if (prevSeg !== currSeg && progress < 0.85) SoundEngine.click();

    if (progress < 1) {
      spinRAF = requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      spinAngle  = targetAngle % (Math.PI * 2);
      showSpinResult();
      if (btn) { btn.disabled = false; btn.textContent = '🎰 Spin Again!'; }
    }
  }
  spinRAF = requestAnimationFrame(animate);
}

function showSpinResult() {
  const segAngle  = (Math.PI * 2) / SPIN_TYPES.length;
  const normalized = ((Math.PI * 1.5 - spinAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const idx        = Math.floor(normalized / segAngle) % SPIN_TYPES.length;
  const winner     = SPIN_TYPES[idx];

  const resultEl = document.getElementById('spinResult');
  if (resultEl) {
    resultEl.innerHTML = `<div style="animation:testimonialSlide 0.5s ease forwards">You are <strong style="color:${winner.color}">${winner.emoji} The ${winner.label}!</strong></div>`;
  }
  SoundEngine.streak();
}

window.closeSpinModal   = closeSpinModal;
window.openSpinModal    = openSpinModal;
window.closeStreakPanel = closeStreakPanel;
window.openStreakPanel  = openStreakPanel;
window.spinWheel        = spinWheel;

document.addEventListener('DOMContentLoaded', initStreak);

// ============================================================
//  ⌨️ TYPEWRITER ANIMATION — Welcome Screen
// ============================================================
function initWelcomeTypewriter() {
  const el = document.getElementById('welcomeTypewriter');
  if (!el) return;
  const phrases = [
    'Unlock hidden personality secrets from your face ✨',
    'Discover your true personality type in seconds 🔮',
    '100% free, instant & private — no uploads! 🔒',
    'Join 2.4M+ people who\'ve discovered their type 🌍',
    'AI-powered face reading — real, fast & fun! 🤖',
  ];
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
      setTimeout(tick, 42);
    } else {
      el.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, 22);
    }
  }
  setTimeout(tick, 800);
}

// ============================================================
//  🎂 BIRTHDAY MODE
// ============================================================
function saveDOB(val) {
  if (!val) return;
  localStorage.setItem('afa_dob', val);
  const el = document.getElementById('dobInput');
  if (el) {
    el.disabled = true;
    el.style.opacity = '0.7';
    el.title = 'Birthday saved! 🎂';
    el.nextElementSibling && (el.nextElementSibling.textContent = '✅ Saved!');
  }
  checkBirthday();
}

function checkBirthday() {
  const dob = localStorage.getItem('afa_dob');
  if (!dob) return;
  const today = new Date();
  const birth = new Date(dob);
  const isBirthday = today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
  const banner = document.getElementById('birthdayBanner');
  if (!banner) return;

  if (isBirthday) {
    const nameEl = document.getElementById('birthdayName');
    if (nameEl) nameEl.textContent = '🎂 Happy Birthday to You!';
    banner.style.display = 'block';
    setTimeout(() => { launchBirthdayConfetti(); }, 500);
  }
}

function launchBirthdayConfetti() {
  if (!isAnimEnabled()) return;
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#fbbf24','#f97316','#ec4899','#7c3aed','#10b981','#3b82f6'];
  const pieces = Array.from({length:250}, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 200,
    w: 8 + Math.random()*12, h: 12 + Math.random()*16,
    color: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*360, vx:(Math.random()-0.5)*5,
    vy: 1.5 + Math.random()*4, vr:(Math.random()-0.5)*7,
    shape: Math.random()>0.6?'circle':'rect',
    emoji: Math.random()>0.7 ? ['🎂','🎁','🎈','⭐'][Math.floor(Math.random()*4)] : null,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.globalAlpha = Math.max(0, 1 - frame/200);
      if (p.emoji) {
        ctx.font = '20px serif';
        ctx.fillText(p.emoji, -10, 10);
      } else {
        ctx.fillStyle = p.color;
        if (p.shape==='rect') ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        else { ctx.beginPath(); ctx.arc(0,0,p.w/2,0,Math.PI*2); ctx.fill(); }
      }
      ctx.restore();
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.vy+=0.06;
    });
    frame++;
    if (frame<200) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display='none'; }
  }
  draw();
  [261,330,392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>{
    if (!isSoundEnabled()) return;
    try {
      const c = new(window.AudioContext||window.webkitAudioContext)();
      const o=c.createOscillator(),g=c.createGain();
      o.connect(g);g.connect(c.destination);
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0.2,c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.5);
      o.start();o.stop(c.currentTime+0.5);
    } catch(e){}
  },i*120));
}

function isTodayBirthday() {
  const dob = localStorage.getItem('afa_dob');
  if (!dob) return false;
  const today = new Date(), birth = new Date(dob);
  return today.getMonth()===birth.getMonth() && today.getDate()===birth.getDate();
}

// ============================================================
//  🎯 PERSONALITY MATCH % — injected into result card
// ============================================================
const PERSONALITY_MATCH = {
  'Leader':    { best:['Achiever','Connector'], worst:['Mystic'],   desc:'Natural synergy with driven, social types.' },
  'Creator':   { best:['Empath','Explorer'],   worst:['Guardian'],  desc:'Thrives with free-spirited, emotional partners.' },
  'Thinker':   { best:['Leader','Creator'],    worst:['Connector'], desc:'Deep bonds with visionaries and innovators.' },
  'Empath':    { best:['Creator','Guardian'],  worst:['Achiever'],  desc:'Best with creative, nurturing personalities.' },
  'Mystic':    { best:['Thinker','Explorer'],  worst:['Leader'],    desc:'Drawn to seekers of deep truths and adventures.' },
  'Achiever':  { best:['Leader','Thinker'],    worst:['Empath'],    desc:'Works best with ambitious, strategic types.' },
  'Explorer':  { best:['Mystic','Creator'],    worst:['Guardian'],  desc:'Loves free spirits and creative adventurers.' },
  'Connector': { best:['Empath','Leader'],     worst:['Thinker'],   desc:'Flourishes with warm, social personalities.' },
  'Guardian':  { best:['Empath','Connector'],  worst:['Explorer'],  desc:'Loyal bond with caring, steady personalities.' },
};

const TYPE_EMOJIS = {
  'Leader':'👑','Creator':'🎨','Thinker':'🧠','Empath':'❤️',
  'Mystic':'🔮','Achiever':'⚡','Explorer':'🌍','Connector':'🤝','Guardian':'🛡️'
};

function getPersonalityTypeFromInsights(insights) {
  const map = [
    { type:'Leader',    keywords:['leader','commanding','visionary'] },
    { type:'Creator',   keywords:['creative','artistic','creator','imagination'] },
    { type:'Thinker',   keywords:['intelligent','analytical','thinker','genius'] },
    { type:'Empath',    keywords:['caring','empathetic','emotional','kind'] },
    { type:'Mystic',    keywords:['intuitive','spiritual','mystic','psychic','mysterious'] },
    { type:'Achiever',  keywords:['ambitious','disciplined','goal','achiever','hustling'] },
    { type:'Explorer',  keywords:['adventurous','traveller','explorer','thrill'] },
    { type:'Connector', keywords:['charismatic','social','communicator','connector'] },
    { type:'Guardian',  keywords:['loyal','trustworthy','guardian','protective','patient'] },
  ];
  const text = insights.join(' ').toLowerCase();
  for (const m of map) {
    if (m.keywords.some(k => text.includes(k))) return m.type;
  }
  const types = Object.keys(PERSONALITY_MATCH);
  return types[Math.floor(Math.random() * types.length)];
}

function injectPersonalityMatch(myType) {
  const data = PERSONALITY_MATCH[myType] || PERSONALITY_MATCH['Leader'];
  const bestType  = data.best[Math.floor(Math.random()*data.best.length)];
  const worstType = data.worst[0];
  const matchPct  = 72 + Math.floor(Math.random()*26);

  const box = document.createElement('div');
  box.className = 'personality-match-box';
  box.innerHTML = `
    <div class="pmatch-title">💞 Your Personality Match</div>
    <div class="pmatch-types">
      <div class="pmatch-item">
        <span class="pmatch-emoji">${TYPE_EMOJIS[myType]||'🔮'}</span>
        <span class="pmatch-name">You: The ${myType}</span>
      </div>
      <div style="font-size:24px;align-self:center;color:#ec4899">💕</div>
      <div class="pmatch-item">
        <span class="pmatch-emoji">${TYPE_EMOJIS[bestType]||'⭐'}</span>
        <span class="pmatch-name">Best: The ${bestType}</span>
      </div>
    </div>
    <div class="pmatch-pct" id="pmatchPct">0%</div>
    <div class="pmatch-label">Compatibility Score</div>
    <div class="pmatch-verdict">${matchPct>=90?'🔥 Legendary Match!':matchPct>=80?'✨ Great Chemistry!':matchPct>=70?'💫 Good Vibes!':'🌱 Can Work!'}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:6px">${data.desc}</div>
    <div style="font-size:12px;color:#ef4444;margin-top:6px">⚠️ Least compatible with: The ${worstType} ${TYPE_EMOJIS[worstType]||''}</div>
  `;

  const actionsEl = document.querySelector('.dynamic-actions');
  if (actionsEl) actionsEl.before(box);

  let count = 0;
  const timer = setInterval(() => {
    count += 2;
    if (count >= matchPct) { count = matchPct; clearInterval(timer); }
    const el = document.getElementById('pmatchPct');
    if (el) el.textContent = count + '%';
  }, 30);
}

// ============================================================
//  📊 COMPARE MODAL
// ============================================================
let comparePhotos = { 1: null, 2: null };

function openCompareModal() {
  const modal = document.getElementById('compareModal');
  if (!modal) return;
  modal.classList.add('show');
  comparePhotos = {1:null, 2:null};
  document.getElementById('compareResult').innerHTML = '';
  document.getElementById('compareBtn').disabled = true;
  ['1','2'].forEach(n => {
    const inner = document.getElementById('compareSlotInner'+n);
    if (inner) inner.innerHTML = `<span class="compare-slot-icon">👤</span><span>Person ${n}</span>`;
  });
}
function closeCompareModal() {
  document.getElementById('compareModal')?.classList.remove('show');
}

function loadComparePhoto(input, num) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    comparePhotos[num] = e.target.result;
    const inner = document.getElementById('compareSlotInner'+num);
    if (inner) inner.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:18px;">`;
    if (comparePhotos[1] && comparePhotos[2]) {
      document.getElementById('compareBtn').disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

function runCompare() {
  const btn = document.getElementById('compareBtn');
  btn.disabled = true;
  btn.textContent = '🔍 Analyzing...';

  setTimeout(() => {
    const types  = Object.keys(PERSONALITY_MATCH);
    const type1  = types[Math.floor(Math.random()*types.length)];
    let type2;
    do { type2 = types[Math.floor(Math.random()*types.length)]; } while(type2===type1);

    const data   = PERSONALITY_MATCH[type1];
    const isBest = data.best.includes(type2);
    const score  = isBest ? 78+Math.floor(Math.random()*20) : 42+Math.floor(Math.random()*35);

    const traits = [
      {name:'Vibes',    score: score + Math.floor((Math.random()-0.5)*10) },
      {name:'Chemistry',score: score + Math.floor((Math.random()-0.5)*12) },
      {name:'Trust',    score: score + Math.floor((Math.random()-0.5)*8)  },
      {name:'Humor',    score: score + Math.floor((Math.random()-0.5)*15) },
    ].map(t=>({...t, score: Math.min(100,Math.max(30,t.score))}));

    const verdict = score>=85?'🔥 Legendary Match — made for each other!'
                  : score>=70?'✨ Great Chemistry — strong connection!'
                  : score>=55?'💫 Good Potential — worth exploring!'
                  : '🌱 Different Worlds — but opposites attract!';

    const resultEl = document.getElementById('compareResult');
    resultEl.innerHTML = `
      <div class="compare-result-grid">
        <div class="cresult-card">
          <div class="cresult-avatar"><img src="${comparePhotos[1]}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;"></div>
          <div class="cresult-emoji">${TYPE_EMOJIS[type1]||'🔮'}</div>
          <div class="cresult-type">The ${type1}</div>
        </div>
        <div class="cresult-card">
          <div class="cresult-avatar"><img src="${comparePhotos[2]}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;"></div>
          <div class="cresult-emoji">${TYPE_EMOJIS[type2]||'⭐'}</div>
          <div class="cresult-type">The ${type2}</div>
        </div>
      </div>
      <div class="compatibility-box">
        <div class="compat-score" id="compatScore">0%</div>
        <div class="compat-label">Overall Compatibility</div>
        <div class="compat-verdict">${verdict}</div>
        <div class="compat-bars">
          ${traits.map(t=>`
            <div class="compat-bar-row">
              <span>${t.name}</span>
              <div class="compat-bar-track"><div class="compat-bar-fill" style="width:0%" data-w="${t.score}%"></div></div>
              <span>${t.score}%</span>
            </div>`).join('')}
        </div>
      </div>
    `;

    let c=0;
    const timer=setInterval(()=>{
      c+=2; if(c>=score){c=score;clearInterval(timer);}
      const el=document.getElementById('compatScore');
      if(el) el.textContent=c+'%';
    },25);

    requestAnimationFrame(()=>setTimeout(()=>{
      resultEl.querySelectorAll('.compat-bar-fill').forEach(b=>{
        b.style.width=b.dataset.w;
      });
    },100));

    btn.disabled = false;
    btn.textContent = '🔄 Compare Again!';
    SoundEngine.result();
    if (isAnimEnabled()) launchConfetti();
  }, 1800);
}

// ============================================================
//  🔔 PUSH NOTIFICATIONS
// ============================================================
function initNotifications() {
  if (localStorage.getItem('afa_notif_asked')) return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission === 'granted') {
    scheduleDailyReminder();
    return;
  }
  if (Notification.permission !== 'denied') {
    setTimeout(() => {
      const banner = document.getElementById('notifBanner');
      if (banner) banner.style.display = 'flex';
    }, 8000);
  }
}

function requestNotifPermission() {
  dismissNotifBanner();
  localStorage.setItem('afa_notif_asked', 'true');
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      scheduleDailyReminder();
      setTimeout(() => {
        new Notification('🔥 AI Face Analyzer', {
          body: 'Notifications enabled! We\'ll remind you to keep your streak alive 🔥',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }, 500);
    }
  }).catch(()=>{});
}

function dismissNotifBanner() {
  const banner = document.getElementById('notifBanner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('afa_notif_asked', 'true');
}

function scheduleDailyReminder() {
  const today = new Date().toISOString().split('T')[0];
  const last  = localStorage.getItem(STREAK_LAST_KEY);
  if (last !== today && Notification.permission === 'granted') {
    const ms = getMillisUntil(20, 0);
    setTimeout(() => {
      new Notification('🔥 Don\'t break your streak!', {
        body: 'Analyze your face today to keep your streak alive! 🔥',
        icon: '/favicon.ico',
        tag:  'streak-reminder',
      });
    }, Math.min(ms, 30000));
  }
}

function getMillisUntil(hour, min) {
  const now    = new Date();
  const target = new Date();
  target.setHours(hour, min, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

window.closeCompareModal  = closeCompareModal;
window.openCompareModal   = openCompareModal;
window.loadComparePhoto   = loadComparePhoto;
window.runCompare         = runCompare;
window.saveDOB            = saveDOB;
window.requestNotifPermission = requestNotifPermission;
window.dismissNotifBanner = dismissNotifBanner;

document.addEventListener('DOMContentLoaded', () => {
  initWelcomeTypewriter();
  checkBirthday();
  initNotifications();

  const cModal = document.getElementById('compareModal');
  if (cModal) cModal.addEventListener('click', e => { if(e.target===cModal) closeCompareModal(); });

  const savedDOB = localStorage.getItem('afa_dob');
  if (savedDOB) {
    const el = document.getElementById('dobInput');
    if (el) {
      el.value = savedDOB;
      el.disabled = true;
      el.style.opacity = '0.7';
      el.title = 'Birthday saved! 🎂';
    }
    const lbl = document.getElementById('dobSavedLabel');
    if (lbl) lbl.textContent = '✅ Birthday saved!';
  }
});

const _origCreateResultCard = createResultCard;
window.createResultCard = function() {
  _origCreateResultCard();
  setTimeout(() => {
    const traitsList = document.getElementById('traitsList');
    const insights   = traitsList ? Array.from(traitsList.querySelectorAll('strong')).map(s=>s.textContent) : [];
    const myType     = getPersonalityTypeFromInsights(insights);
    injectPersonalityMatch(myType);
    if (isTodayBirthday()) {
      const card = document.getElementById('dynamicResultCard');
      if (card) {
        const bday = document.createElement('div');
        bday.style.cssText='text-align:center;padding:16px;background:linear-gradient(135deg,#fef3c7,#fce7f3);border-radius:20px;margin:12px 0;border:2px solid #fbbf24;font-size:14px;font-weight:700;color:#92400e;';
        bday.innerHTML='🎂 <strong>Birthday Special!</strong> Today\'s reading is extra powerful — the stars align on your special day! ⭐🎉';
        card.querySelector('.dynamic-result-inner')?.prepend(bday);
        launchBirthdayConfetti();
      }
    }
  }, 8000);
};

createResultCard = window.createResultCard;

window.clearDOB = function() {
  localStorage.removeItem('afa_dob');
  const el = document.getElementById('dobInput');
  if (el) { el.value = ''; el.disabled = false; el.style.opacity = '1'; el.title = ''; }
  const lbl = document.getElementById('dobSavedLabel');
  if (lbl) lbl.textContent = '';
  document.getElementById('birthdayBanner') && (document.getElementById('birthdayBanner').style.display = 'none');
};

// ============================================================
//  🎰 SPIN ONCE PER DAY + PRIZES
// ============================================================
const SPIN_TODAY_KEY = 'afa_spin_date';

const SPIN_PRIZES = [
  { label:'Leader',    emoji:'👑', color:'#7c3aed', type:'type',    value:'The Leader' },
  { label:'+500 ⚡',   emoji:'⚡', color:'#6366f1', type:'credits', value:500 },
  { label:'Creator',  emoji:'🎨', color:'#ec4899', type:'type',    value:'The Creator' },
  { label:'+1000 ⚡',  emoji:'💰', color:'#059669', type:'credits', value:1000 },
  { label:'Mystic',   emoji:'🔮', color:'#f59e0b', type:'type',    value:'The Mystic' },
  { label:'+200 ⚡',   emoji:'💫', color:'#8b5cf6', type:'credits', value:200 },
  { label:'Explorer', emoji:'🌍', color:'#f43f5e', type:'type',    value:'The Explorer' },
  { label:'🎁 Bonus',  emoji:'🎁', color:'#0ea5e9', type:'bonus',   value:2000 },
];

function canSpinToday() {
  return localStorage.getItem(SPIN_TODAY_KEY) !== getTodayStr();
}

function markSpinUsed() {
  localStorage.setItem(SPIN_TODAY_KEY, getTodayStr());
}

function updateSpinCountdown() {
  const el = document.getElementById('spinCountdown');
  const btn = document.getElementById('spinCardBtn');
  if (!el) return;
  if (!canSpinToday()) {
    const now = new Date();
    const midnight = new Date(); midnight.setHours(24,0,0,0);
    const diff = midnight - now;
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    el.innerHTML = `<span class="spin-cd-badge">⏰ Next spin in ${h}h ${m}m</span>`;
    if (btn) { btn.textContent = '✅ Spun Today!'; btn.disabled = true; btn.style.opacity = '0.6'; }
  } else {
    el.innerHTML = `<span class="spin-cd-badge spin-cd-ready">🟢 Ready to spin!</span>`;
    if (btn) { btn.textContent = 'Spin Now →'; btn.disabled = false; btn.style.opacity = '1'; }
  }
}

window.openSpinModal = function() {
  const modal = document.getElementById('spinModal');
  if (!modal) return;
  modal.classList.add('show');
  spinAngle = 0;
  drawWheelNew(spinAngle);
  document.getElementById('spinResult').innerHTML = '';
  const btn = document.getElementById('spinBtn');
  if (btn) {
    if (!canSpinToday()) {
      btn.disabled = true;
      btn.textContent = '✅ Already Spun Today!';
      const now = new Date(), midnight = new Date(); midnight.setHours(24,0,0,0);
      const diff = midnight - now;
      const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
      document.getElementById('spinResult').innerHTML = `<div style="color:#6b7280;font-size:13px;margin-top:8px">⏰ Come back in ${h}h ${m}m for your next spin!</div>`;
    } else {
      btn.disabled = false;
      btn.textContent = '🎰 SPIN!';
    }
  }
};
openSpinModal = window.openSpinModal;

function drawWheelNew(angle) {
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2, r = cx - 8;
  const seg = (Math.PI*2) / SPIN_PRIZES.length;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  SPIN_PRIZES.forEach((prize, i) => {
    const startA = angle + i*seg, endA = startA + seg;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,startA,endA); ctx.closePath();
    ctx.fillStyle = prize.color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(startA + seg/2);
    ctx.textAlign = 'right';
    ctx.font = '15px serif'; ctx.fillStyle = '#fff';
    ctx.fillText(prize.emoji, r-8, 4);
    ctx.font = 'bold 10px Poppins,sans-serif';
    ctx.fillText(prize.label, r-26, 4);
    ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill();
  ctx.strokeStyle='#7c3aed'; ctx.lineWidth=3; ctx.stroke();
  ctx.font='bold 13px serif'; ctx.textAlign='center'; ctx.fillStyle='#7c3aed';
  ctx.fillText('🎰', cx, cy+5);
}

window.spinWheel = function() {
  if (!canSpinToday()) return;
  if (isSpinning) return;
  const btn = document.getElementById('spinBtn');
  if (btn) { btn.disabled=true; btn.textContent='🌀 Spinning...'; }
  document.getElementById('spinResult').innerHTML = '';
  isSpinning = true;
  const totalRotations = 5 + Math.floor(Math.random()*4);
  const targetExtra = Math.random() * Math.PI*2;
  const targetAngle = spinAngle + Math.PI*2*totalRotations + targetExtra;
  const duration = 3500 + Math.random()*800;
  const startTime = performance.now(), startAngle = spinAngle;
  SoundEngine.spin();
  function animate(now) {
    const elapsed = now - startTime, progress = Math.min(elapsed/duration, 1);
    const eased = 1 - Math.pow(1-progress, 3);
    spinAngle = startAngle + (targetAngle - startAngle)*eased;
    drawWheelNew(spinAngle);
    const segAngle = (Math.PI*2)/SPIN_PRIZES.length;
    const prevSeg = Math.floor(((spinAngle-0.05)%(Math.PI*2))/segAngle);
    const currSeg = Math.floor((spinAngle%(Math.PI*2))/segAngle);
    if (prevSeg!==currSeg && progress<0.85) SoundEngine.click();
    if (progress < 1) { spinRAF = requestAnimationFrame(animate); }
    else {
      isSpinning = false;
      spinAngle = targetAngle % (Math.PI*2);
      showSpinPrize();
      markSpinUsed();
      updateSpinCountdown();
      if (btn) { btn.disabled=true; btn.textContent='✅ Spun Today!'; }
    }
  }
  spinRAF = requestAnimationFrame(animate);
};
spinWheel = window.spinWheel;

function showSpinPrize() {
  const segAngle = (Math.PI*2) / SPIN_PRIZES.length;
  const normalized = ((Math.PI*1.5 - spinAngle) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
  const idx = Math.floor(normalized/segAngle) % SPIN_PRIZES.length;
  const prize = SPIN_PRIZES[idx];
  const resultEl = document.getElementById('spinResult');
  if (!resultEl) return;

  let rewardMsg = '';
  if (prize.type === 'credits' || prize.type === 'bonus') {
    const amt = prize.value;
    const current = getCredits();
    localStorage.setItem(CREDIT_KEY, current + amt);
    updateCreditDisplay(current + amt);
    rewardMsg = `<div class="spin-reward-msg">⚡ +${amt.toLocaleString()} Credits added!</div>`;
  } else {
    rewardMsg = `<div class="spin-reward-msg">You are <strong style="color:${prize.color}">${prize.emoji} ${prize.value}!</strong></div>`;
  }

  resultEl.innerHTML = `
    <div class="spin-prize-card" style="border-color:${prize.color}">
      <div class="spin-prize-emoji">${prize.emoji}</div>
      <div class="spin-prize-label" style="color:${prize.color}">${prize.label}</div>
      ${rewardMsg}
      <div class="spin-next-hint">Come back tomorrow for another spin! 🔥</div>
    </div>`;

  SoundEngine.streak();
  if (isAnimEnabled()) launchConfetti();
}

// ============================================================
//  🏆 STREAK REWARDS
// ============================================================
function showStreakRewardPopup(streakDays) {
  const milestones = [
    {days:1,  msg:'🔥 First day!',          credits:100,  icon:'🌱'},
    {days:3,  msg:'3-Day Streak! 🔥🔥🔥',   credits:2000, icon:'🔥'},
    {days:5,  msg:'5-Day Streak! 🚀',        credits:3500, icon:'🚀'},
    {days:7,  msg:'1 Week Streak! 👑',        credits:5000, icon:'👑'},
    {days:14, msg:'2 Weeks! 💎',              credits:12000,icon:'💎'},
    {days:30, msg:'1 Month Legend! 🏆',       credits:25000,icon:'🏆'},
  ];
  const hit = milestones.find(m => m.days === streakDays);
  if (!hit) return;
  const rewarded = JSON.parse(localStorage.getItem(STREAK_REWARDED_KEY)||'[]');
  if (rewarded.includes('s'+streakDays)) return;
  rewarded.push('s'+streakDays);
  localStorage.setItem(STREAK_REWARDED_KEY, JSON.stringify(rewarded));

  const current = getCredits();
  const newBal = current + hit.credits;
  localStorage.setItem(CREDIT_KEY, newBal);
  updateCreditDisplay(newBal);

  const toast = document.createElement('div');
  toast.className = 'streak-reward-toast';
  toast.innerHTML = `
    <div class="srt-icon">${hit.icon}</div>
    <div class="srt-text">
      <strong>${hit.msg}</strong>
      <span>+${hit.credits.toLocaleString()} Credits Rewarded! ⚡</span>
    </div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('srt-show'), 100);
  setTimeout(() => { toast.classList.remove('srt-show'); setTimeout(()=>toast.remove(),500); }, 4500);
  SoundEngine.streak();
}

document.addEventListener('DOMContentLoaded', () => {
  updateSpinCountdown();
  setInterval(updateSpinCountdown, 60000);
});

// ============================================================
//  🤯 VIRAL FACTS SCROLL
// ============================================================
function initViralFacts() {
  const track = document.getElementById('vfTrack');
  const dotsEl = document.getElementById('vfDots');
  if (!track || !dotsEl) return;

  const cards = track.querySelectorAll('.vf-card');
  const total = cards.length;

  dotsEl.innerHTML = Array.from({length: total}, (_,i) =>
    `<div class="vf-dot${i===0?' active':''}" onclick="vfScrollTo(${i})"></div>`
  ).join('');

  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / 234);
    dotsEl.querySelectorAll('.vf-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
  }, {passive:true});

  let isDown=false, startX, sl;
  track.addEventListener('mousedown', e => { isDown=true; startX=e.pageX-track.offsetLeft; sl=track.scrollLeft; });
  document.addEventListener('mouseup', ()=>{ isDown=false; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    track.scrollLeft = sl - (e.pageX - track.offsetLeft - startX);
  });

  let autoIdx = 0;
  setInterval(() => {
    autoIdx = (autoIdx + 1) % total;
    track.scrollTo({ left: autoIdx * 234, behavior: 'smooth' });
  }, 4000);
}

window.vfScrollTo = function(i) {
  const track = document.getElementById('vfTrack');
  if (track) track.scrollTo({ left: i * 234, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', initViralFacts);

// Stats ticker message rotator
document.addEventListener('DOMContentLoaded', () => {
  const tickerEl = document.getElementById('statsTickerMsg');
  if (!tickerEl) return;
  const msgs = [
    '🔴 Real-time data updating every second · Faces being analyzed right now across the globe',
    '🌍 Users from 182+ countries have used AI Face Analyzer · Join the global community!',
    '⚡ Every analysis contributes to the live leaderboard · See your country rank →',
    '🔥 Trending right now: India, USA & Brazil leading the global face analysis race!',
    '✨ 20+ personality traits discovered per analysis · Try it free — no login needed!',
    '🏆 Top analyzers earn daily credits on the leaderboard · Analyze more to climb ranks!',
  ];
  let mi = 0;
  setInterval(() => {
    mi = (mi + 1) % msgs.length;
    tickerEl.style.opacity = '0';
    setTimeout(() => {
      tickerEl.textContent = msgs[mi];
      tickerEl.style.opacity = '1';
      tickerEl.style.transition = 'opacity 0.4s';
    }, 300);
  }, 7000);
});

// ═══════════════════════════════════════════════════════════
//  🎮 GAMES HUB
// ═══════════════════════════════════════════════════════════
window.openGamesHub  = () => { document.getElementById('gamesHubModal').classList.add('show'); SoundEngine.click(); };
window.closeGamesHub = () => document.getElementById('gamesHubModal').classList.remove('show');
document.getElementById('gamesHubModal')?.addEventListener('click', e => { if(e.target.id==='gamesHubModal') closeGamesHub(); });

// ═══════════════════════════════════════════════════════════
//  🃏 FACE CARD GAME
// ═══════════════════════════════════════════════════════════
const CARD_POOL = [
  {emoji:'👑',name:'The Leader',    power:92, color:'#7c3aed'},
  {emoji:'🎨',name:'The Creator',   power:85, color:'#ec4899'},
  {emoji:'🧠',name:'The Thinker',   power:90, color:'#3b82f6'},
  {emoji:'❤️',name:'The Empath',    power:80, color:'#10b981'},
  {emoji:'🔮',name:'The Mystic',    power:88, color:'#f59e0b'},
  {emoji:'⚡',name:'The Achiever',  power:95, color:'#8b5cf6'},
  {emoji:'🌍',name:'The Explorer',  power:82, color:'#f43f5e'},
  {emoji:'🤝',name:'The Connector', power:78, color:'#06b6d4'},
  {emoji:'🛡️',name:'The Guardian',  power:86, color:'#6366f1'},
];
let cgFlipping = false;

window.openFaceCardGame = () => {
  closeGamesHub();
  document.getElementById('faceCardModal').classList.add('show');
  document.getElementById('cgPlayerCard').innerHTML = '🃏<br><span style="font-size:11px;opacity:0.5">Draw to reveal</span>';
  document.getElementById('cgOpponentCard').innerHTML = '🃏<br><span style="font-size:11px;opacity:0.5">Draw to reveal</span>';
  document.getElementById('cgResult').innerHTML = '';
  document.getElementById('cgPlayerCard').className = 'cg-card-back';
  document.getElementById('cgOpponentCard').className = 'cg-card-back';
};
window.closeFaceCardGame = () => document.getElementById('faceCardModal').classList.remove('show');

window.drawCards = () => {
  if (cgFlipping) return;
  cgFlipping = true;
  document.getElementById('cgDrawBtn').textContent = '⚡ Drawing...';
  const p = CARD_POOL[Math.floor(Math.random()*CARD_POOL.length)];
  const o = CARD_POOL[Math.floor(Math.random()*CARD_POOL.length)];
  const pMod = p.power + Math.floor(Math.random()*15) - 5;
  const oMod = o.power + Math.floor(Math.random()*15) - 5;

  setTimeout(() => {
    const pc = document.getElementById('cgPlayerCard');
    const oc = document.getElementById('cgOpponentCard');
    const won = pMod >= oMod;
    pc.innerHTML = `${p.emoji}<br><strong style="font-size:12px">${p.name}</strong><br><span style="font-size:18px;font-weight:900">${pMod}</span>`;
    oc.innerHTML = `${o.emoji}<br><strong style="font-size:12px">${o.name}</strong><br><span style="font-size:18px;font-weight:900">${oMod}</span>`;
    pc.className = 'cg-card-back revealed' + (won ? '' : ' loser');
    oc.className = 'cg-card-back revealed' + (won ? ' loser' : '');
    document.getElementById('cgResult').innerHTML = won
      ? `🏆 YOU WIN! +${pMod-oMod} power!`
      : `😤 Opponent wins by ${oMod-pMod}... Rematch?`;
    document.getElementById('cgDrawBtn').textContent = '🔄 Draw Again';
    cgFlipping = false;
    if (won && isAnimEnabled()) launchConfetti();
    SoundEngine.result();
  }, 800);
};
document.getElementById('faceCardModal')?.addEventListener('click', e => { if(e.target.id==='faceCardModal') closeFaceCardGame(); });

// ═══════════════════════════════════════════════════════════
//  💘 FACE DATING
// ═══════════════════════════════════════════════════════════
const DATING_PROFILES = [
  {emoji:'👑',type:'The Leader',    traits:'Ambitious • Decisive • Magnetic',   compat:'Power couple energy ⚡'},
  {emoji:'🎨',type:'The Creator',   traits:'Artistic • Dreamy • Expressive',     compat:'Soulmate vibes 💫'},
  {emoji:'🧠',type:'The Thinker',   traits:'Deep • Analytical • Mysterious',     compat:'Mind-blowing chemistry 🧪'},
  {emoji:'❤️',type:'The Empath',    traits:'Caring • Warm • Deeply loving',      compat:'Forever person material 💍'},
  {emoji:'🔮',type:'The Mystic',    traits:'Intuitive • Spiritual • Unique',     compat:'Cosmic connection 🌌'},
  {emoji:'⚡',type:'The Achiever',  traits:'Driven • Bold • High-energy',        compat:'Unstoppable duo 🚀'},
  {emoji:'🌍',type:'The Explorer',  traits:'Adventurous • Free • Fun',           compat:'Wild adventures await 🏕️'},
];
let fdIdx = 0, fdLikes = 0;

window.openFaceDating = () => {
  closeGamesHub();
  fdIdx = Math.floor(Math.random() * DATING_PROFILES.length);
  fdLikes = 0;
  document.getElementById('faceDatingModal').classList.add('show');
  document.getElementById('fdMatches').textContent = '';
  loadFdProfile();
};
window.closeFaceDating = () => document.getElementById('faceDatingModal').classList.remove('show');

function loadFdProfile() {
  const p = DATING_PROFILES[fdIdx % DATING_PROFILES.length];
  const card = document.getElementById('fdCard');
  card.className = 'fd-card';
  document.getElementById('fdEmoji').textContent = p.emoji;
  document.getElementById('fdPtype').textContent = p.type;
  document.getElementById('fdTraits').textContent = p.traits;
  document.getElementById('fdCompat').textContent = p.compat;
}

window.swipeProfile = (dir) => {
  const card = document.getElementById('fdCard');
  card.classList.add(dir === 'like' ? 'swiping-right' : 'swiping-left');
  if (dir === 'like') {
    fdLikes++;
    SoundEngine.streak();
    const p = DATING_PROFILES[fdIdx % DATING_PROFILES.length];
    document.getElementById('fdMatches').innerHTML = `<span style="color:#ec4899;font-weight:800">💘 ${fdLikes} match${fdLikes>1?'es':''}! Latest: ${p.emoji} ${p.type}</span>`;
  }
  setTimeout(() => {
    fdIdx++;
    loadFdProfile();
  }, 350);
};
document.getElementById('faceDatingModal')?.addEventListener('click', e => { if(e.target.id==='faceDatingModal') closeFaceDating(); });

// ═══════════════════════════════════════════════════════════
//  🌍 COUNTRY BATTLE
// ═══════════════════════════════════════════════════════════
const COUNTRIES = [
  {flag:'🇮🇳',name:'India'},   {flag:'🇺🇸',name:'USA'},
  {flag:'🇧🇷',name:'Brazil'},  {flag:'🇯🇵',name:'Japan'},
  {flag:'🇰🇷',name:'Korea'},   {flag:'🇬🇧',name:'UK'},
  {flag:'🇩🇪',name:'Germany'}, {flag:'🇳🇬',name:'Nigeria'},
  {flag:'🇲🇽',name:'Mexico'},  {flag:'🇵🇰',name:'Pakistan'},
  {flag:'🇷🇺',name:'Russia'},  {flag:'🇫🇷',name:'France'},
];
const CB_TRAITS = ['Confidence','Intelligence','Charm','Boldness','Creativity'];
let cbC1 = COUNTRIES[0], cbC2 = COUNTRIES[1];

window.openCountryBattle = () => { closeGamesHub(); document.getElementById('countryBattleModal').classList.add('show'); renderCountryBattle(); };
window.closeCountryBattle = () => document.getElementById('countryBattleModal').classList.remove('show');

function renderCountryBattle() {
  document.getElementById('cbFlag1').textContent = cbC1.flag;
  document.getElementById('cbCname1').textContent = cbC1.name;
  document.getElementById('cbFlag2').textContent = cbC2.flag;
  document.getElementById('cbCname2').textContent = cbC2.name;
  document.getElementById('cbBars1').innerHTML = CB_TRAITS.map(t => `<div class="cb-bar-row"><span class="cb-bar-label">${t.slice(0,4)}</span><div class="cb-bar-track"><div class="cb-bar-fill" style="width:0%"></div></div></div>`).join('');
  document.getElementById('cbBars2').innerHTML = document.getElementById('cbBars1').innerHTML;
  document.getElementById('cbScore1').textContent = '—';
  document.getElementById('cbScore2').textContent = '—';
  document.getElementById('cbWinner').textContent = '';
}

window.randomCountries = () => {
  const s = [...COUNTRIES].sort(()=>Math.random()-0.5);
  cbC1 = s[0]; cbC2 = s[1];
  renderCountryBattle();
};

window.runCountryBattle = () => {
  const s1 = CB_TRAITS.map(()=> 55+Math.floor(Math.random()*45));
  const s2 = CB_TRAITS.map(()=> 55+Math.floor(Math.random()*45));
  const t1 = s1.reduce((a,b)=>a+b,0), t2 = s2.reduce((a,b)=>a+b,0);
  const bars1 = document.getElementById('cbBars1').querySelectorAll('.cb-bar-fill');
  const bars2 = document.getElementById('cbBars2').querySelectorAll('.cb-bar-fill');
  setTimeout(()=>{
    bars1.forEach((b,i)=>b.style.width=s1[i]+'%');
    bars2.forEach((b,i)=>b.style.width=s2[i]+'%');
    document.getElementById('cbScore1').textContent = Math.round(t1/CB_TRAITS.length);
    document.getElementById('cbScore2').textContent = Math.round(t2/CB_TRAITS.length);
    const winner = t1>t2 ? cbC1 : cbC2;
    document.getElementById('cbWinner').innerHTML = `${winner.flag}<br><span style="font-size:12px;color:#fbbf24;font-weight:800">WINNER!</span>`;
    if(t1>t2 && isAnimEnabled()) launchConfetti();
    SoundEngine.result();
  }, 200);
};
document.getElementById('countryBattleModal')?.addEventListener('click', e => { if(e.target.id==='countryBattleModal') closeCountryBattle(); });

// ═══════════════════════════════════════════════════════════
//  🎯 DAILY CHALLENGE
// ═══════════════════════════════════════════════════════════
const CHALLENGES = [
  {emoji:'😤',text:'Show your most INTENSE expression — score based on power!'},
  {emoji:'😂',text:'Make the funniest face you can — highest chaos wins!'},
  {emoji:'😌',text:'Most peaceful, zen face — inner calm is today\'s theme'},
  {emoji:'👑',text:'Look like royalty — regal, commanding, powerful'},
  {emoji:'🤫',text:'The most mysterious face — enigmatic energy only'},
  {emoji:'😍',text:'Most charming and loveable face — win hearts!'},
  {emoji:'💪',text:'Strongest most confident face — boss mode activated'},
];
const FAKE_LEADERS = [
  {flag:'🇮🇳',name:'Priya S.',score:94},{flag:'🇧🇷',name:'Lucas M.',score:91},
  {flag:'🇺🇸',name:'Jake T.',score:89},{flag:'🇰🇷',name:'Soo Y.',score:87},
  {flag:'🇬🇧',name:'Emma R.',score:85},{flag:'🇳🇬',name:'Amara O.',score:83},
];

window.openDailyChallenge = () => {
  const modal = document.getElementById('dailyChallengeModal');
  modal.classList.add('show');
  const today = new Date();
  const dayIdx = today.getDate() % CHALLENGES.length;
  const ch = CHALLENGES[dayIdx];
  document.getElementById('dcDate').textContent = today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  document.getElementById('dcEmoji').textContent = ch.emoji;
  document.getElementById('dcText').textContent = ch.text;
  document.getElementById('dcLeaderboard').innerHTML = '<div style="font-size:11px;font-weight:800;color:#9ca3af;letter-spacing:1px;margin-bottom:6px">TODAY\'S TOP SCORES</div>' +
    FAKE_LEADERS.map((l,i)=>`<div class="dc-lb-row"><span class="dc-lb-rank">#${i+1}</span><span>${l.flag} ${l.name}</span><span style="margin-left:auto;font-weight:800;color:#7c3aed">${l.score}</span></div>`).join('');
};
window.closeDailyChallenge = () => document.getElementById('dailyChallengeModal').classList.remove('show');
document.getElementById('dailyChallengeModal')?.addEventListener('click', e => { if(e.target.id==='dailyChallengeModal') closeDailyChallenge(); });

// ═══════════════════════════════════════════════════════════
//  🔮 HOROSCOPE + FACE
// ═══════════════════════════════════════════════════════════
const ZODIAC = [
  {sign:'♈',name:'Aries',    emoji:'🔥',trait:'Fearless fire — born to lead and conquer',       lucky:'Red • Tuesday • 9',    week:['💰','❤️','⚡','🌟','😤','🎲','🏆']},
  {sign:'♉',name:'Taurus',   emoji:'🌿',trait:'Grounded earth — magnetic and deeply loyal',     lucky:'Green • Friday • 6',   week:['💎','😌','💰','❤️','🌿','✨','🍀']},
  {sign:'♊',name:'Gemini',   emoji:'💨',trait:'Quick-mind air — dual nature, endlessly curious',lucky:'Yellow • Wednesday • 5',week:['💬','🎭','⚡','🌟','😜','💡','🎯']},
  {sign:'♋',name:'Cancer',   emoji:'🌊',trait:'Deep water — emotionally powerful and nurturing', lucky:'White • Monday • 2',    week:['💞','🌙','😌','💰','❤️','🔮','🍀']},
  {sign:'♌',name:'Leo',      emoji:'☀️',trait:'Roaring sun — natural royalty, commands rooms',  lucky:'Gold • Sunday • 1',    week:['👑','💰','❤️','🔥','⚡','🌟','🏆']},
  {sign:'♍',name:'Virgo',    emoji:'🌾',trait:'Sharp earth — analytical perfectionist genius',   lucky:'Navy • Wednesday • 5', week:['💡','📈','💰','😌','⚡','🎯','✨']},
  {sign:'♎',name:'Libra',    emoji:'⚖️',trait:'Balanced air — charming diplomat, deeply fair',  lucky:'Pink • Friday • 6',    week:['❤️','💫','💰','😊','🌟','🎭','🍀']},
  {sign:'♏',name:'Scorpio',  emoji:'🦂',trait:'Intense water — mysterious, magnetic, powerful', lucky:'Black • Tuesday • 8',  week:['🔮','💰','⚡','😈','❤️','🌙','🏆']},
  {sign:'♐',name:'Sagittarius',emoji:'🏹',trait:'Free fire — adventurous philosopher of life',  lucky:'Purple • Thursday • 3',week:['✈️','💰','😂','⚡','🌟','🎲','🍀']},
  {sign:'♑',name:'Capricorn',emoji:'🏔️',trait:'Relentless earth — climbs every mountain alone', lucky:'Brown • Saturday • 8',  week:['📈','💰','💎','😤','⚡','🌟','🏆']},
  {sign:'♒',name:'Aquarius', emoji:'💧',trait:'Wild air — visionary rebel ahead of time',       lucky:'Blue • Saturday • 4',  week:['💡','⚡','🌍','💰','🎭','✨','🔮']},
  {sign:'♓',name:'Pisces',   emoji:'🌊',trait:'Dreamy water — psychic artist of the soul',      lucky:'Ocean • Thursday • 7',  week:['🔮','❤️','💫','😌','💰','🌙','✨']},
];
const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

window.openHoroscopeModal = () => {
  const modal = document.getElementById('horoscopeModal');
  modal.classList.add('show');
  const grid = document.getElementById('hsZodiacGrid');
  grid.innerHTML = ZODIAC.map((z,i) => `
    <button class="hs-sign-btn" onclick="selectZodiac(${i})">
      <span class="hs-sign-emoji">${z.sign}</span>
      <span class="hs-sign-name">${z.name}</span>
    </button>`).join('');
  document.getElementById('hsResult').style.display = 'none';
  grid.style.display = 'grid';
};
window.closeHoroscopeModal = () => document.getElementById('horoscopeModal').classList.remove('show');
window.resetHoroscope = () => {
  document.getElementById('hsResult').style.display = 'none';
  document.getElementById('hsZodiacGrid').style.display = 'grid';
};
window.selectZodiac = (i) => {
  const z = ZODIAC[i];
  document.getElementById('hsZodiacGrid').style.display = 'none';
  const res = document.getElementById('hsResult');
  res.style.display = 'block';
  document.getElementById('hsResultSign').textContent = z.sign + ' ' + z.emoji;
  document.getElementById('hsResultTitle').textContent = z.name + ' Face Reading';
  document.getElementById('hsResultBody').innerHTML = `
    <strong style="color:#c4b5fd">${z.trait}</strong><br><br>
    Your face carries the energy of ${z.name}. The AI detects <strong>${z.emoji} ${z.name} vibes</strong> in your bone structure and expression.<br><br>
    🍀 <strong>Lucky:</strong> ${z.lucky}`;
  document.getElementById('hsWeekGrid').innerHTML = WEEK_DAYS.map((d,j)=>`
    <div class="hs-day-cell"><span>${z.week[j]}</span>${d}</div>`).join('');
  SoundEngine.result();
};
document.getElementById('horoscopeModal')?.addEventListener('click', e => { if(e.target.id==='horoscopeModal') closeHoroscopeModal(); });

// ═══════════════════════════════════════════════════════════
//  🕵️ CELEBRITY TWIN
// ═══════════════════════════════════════════════════════════
window.openCelebTwin = () => {
  closeGamesHub();
  document.getElementById('celebTwinModal').classList.add('show');
  document.getElementById('ctResults').style.display = 'none';
  document.getElementById('ctScanWrap').style.display = 'block';
};
window.closeCelebTwin = () => document.getElementById('celebTwinModal').classList.remove('show');

window.runCelebScan = () => {
  const btn = document.querySelector('.ct-start-btn');
  btn.textContent = '🔍 Scanning...'; btn.disabled = true;
  const picks = [...CELEB_MATCHES].sort(()=>Math.random()-0.5).slice(0,3);
  const pcts  = [72+Math.floor(Math.random()*26), 55+Math.floor(Math.random()*20), 40+Math.floor(Math.random()*18)].sort((a,b)=>b-a);
  setTimeout(()=>{
    document.getElementById('ctScanWrap').style.display = 'none';
    const res = document.getElementById('ctResults');
    res.style.display = 'block';
    res.innerHTML = picks.map((c,i)=>`
      <div class="ct-celeb-card" style="animation-delay:${i*120}ms">
        <div class="ct-celeb-emoji">${c.emoji}</div>
        <div>
          <div class="ct-celeb-name">${c.name}</div>
          <div class="ct-celeb-pct">${pcts[i]}% facial similarity</div>
          <div class="ct-celeb-bar"><div class="ct-celeb-bar-fill" style="width:0%" data-w="${pcts[i]}%"></div></div>
        </div>
      </div>`).join('');
    setTimeout(()=>res.querySelectorAll('.ct-celeb-bar-fill').forEach(b=>b.style.width=b.dataset.w), 200);
    SoundEngine.result();
  }, 2200);
};
document.getElementById('celebTwinModal')?.addEventListener('click', e => { if(e.target.id==='celebTwinModal') closeCelebTwin(); });

// ═══════════════════════════════════════════════════════════
//  👶 BABY FACE PREDICTOR
// ═══════════════════════════════════════════════════════════
const BABY_RESULTS = {
  Creative: [{emoji:'👧',title:'Artistic Little Dreamer',traits:'Your baby will be wildly creative, love drawing, and see the world differently. An old soul with big imagination.'},{emoji:'🧒',title:'Musical Genius Baby',traits:'Born humming, always dancing. Your little one will have an ear for music and a heart full of stories.'}],
  Leader:   [{emoji:'👦',title:'Future Boss Baby',traits:'Confident from day 1. This one walks into the room and everyone notices. Natural authority in tiny form.'},{emoji:'👧',title:'Captain of Everything',traits:'First to stand, first to run, first to demand answers. Your baby comes to lead, not follow.'}],
  Thinker:  [{emoji:'🧒',title:'Little Professor',traits:'Quiet but watching everything. Your baby will ask "why" before they can walk. Genius brain incoming.'},{emoji:'👧',title:'Tiny Philosopher',traits:'Deep in thought at 3 months. This baby will read at age 2 and debate you by age 4.'}],
  Empath:   [{emoji:'👶',title:'Pure Love Bundle',traits:'Born with extra empathy. This baby will hug you before you even cry and make everyone around them feel safe.'},{emoji:'👧',title:'Little Healer',traits:'Sensitive soul. Animals, people, plants — your baby will love everything fiercely.'}],
};

window.openBabyPredictor = () => {
  closeGamesHub();
  document.getElementById('babyModal').classList.add('show');
  document.getElementById('bmResult').style.display = 'none';
  document.getElementById('bmYouFace').textContent = ['😊','😎','🤩','😌','😄'][Math.floor(Math.random()*5)];
  document.querySelectorAll('.bm-ptype-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.bm-ptype-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    };
  });
};
window.closeBabyModal = () => document.getElementById('babyModal').classList.remove('show');

window.runBabyPrediction = () => {
  const activeBtn = document.querySelector('.bm-ptype-btn.active');
  const ptype = activeBtn?.dataset.type || 'Creative';
  const results = BABY_RESULTS[ptype];
  const baby = results[Math.floor(Math.random()*results.length)];
  const res = document.getElementById('bmResult');
  res.style.display = 'block';
  res.innerHTML = `<div class="bm-baby-emoji">${baby.emoji}</div><div class="bm-baby-title">${baby.title}</div><div class="bm-baby-traits">${baby.traits}</div>`;
  if (isAnimEnabled()) launchConfetti();
  SoundEngine.streak();
};
document.getElementById('babyModal')?.addEventListener('click', e => { if(e.target.id==='babyModal') closeBabyModal(); });

// ═══════════════════════════════════════════════════════════
//  🧠 BRAIN AGE TEST
// ═══════════════════════════════════════════════════════════
const BRAIN_AGES = [
  {min:0, max:20, label:'🎮 Teen Brain',    desc:'Pure energy, zero filter, maximum creativity. You think fast and feel everything intensely. Absolute vibe machine.'},
  {min:21,max:28, label:'🚀 Young Genius',  desc:'Peak mental performance. Fast learner, bold thinker, pattern recognizer. The world is your playground.'},
  {min:29,max:35, label:'💡 Sharp Mind',    desc:'Experience meets energy. You have clarity, emotional intelligence, and strategic thinking. Dangerous combo.'},
  {min:36,max:45, label:'🧙 Wise Thinker',  desc:'You see through nonsense instantly. Deep wisdom, long-term vision. People come to you for real advice.'},
  {min:46,max:55, label:'🦅 Ancient Soul',  desc:'You\'ve seen things, understood things others can\'t. Timeless wisdom in modern form. Rare and powerful.'},
  {min:56,max:99, label:'🌌 Cosmic Brain',  desc:'Beyond age. You operate on a frequency most can\'t access. Pure consciousness with human packaging.'},
];
let baScanRunning = false;

window.openBrainAge = () => {
  closeGamesHub();
  document.getElementById('brainAgeModal').classList.add('show');
  document.getElementById('baResult').style.display = 'none';
  document.getElementById('baScanWrap').querySelector('.ba-start-btn').style.display = 'inline-block';
  document.getElementById('baScanFill').style.width = '0%';
  document.getElementById('baScanLabel').textContent = 'Ready to scan...';
  baScanRunning = false;
};
window.closeBrainAge = () => document.getElementById('brainAgeModal').classList.remove('show');

window.runBrainScan = () => {
  if (baScanRunning) return;
  baScanRunning = true;
  document.querySelector('.ba-start-btn').style.display = 'none';
  document.getElementById('baScanLabel').textContent = 'Scanning neural pathways...';
  const fill = document.getElementById('baScanFill');
  const labels = ['Analyzing eye patterns...','Processing facial symmetry...','Mapping expression zones...','Calculating mental frequency...','Finalizing brain age...'];
  let pct = 0, li = 0;
  const iv = setInterval(()=>{
    pct += 1 + Math.random()*3;
    if (pct > 100) pct = 100;
    fill.style.width = pct + '%';
    if (pct > li*20+20 && li < labels.length) { document.getElementById('baScanLabel').textContent = labels[li++]; }
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(()=>{
        const age = 16 + Math.floor(Math.random()*55);
        const info = BRAIN_AGES.find(b=>age>=b.min && age<=b.max) || BRAIN_AGES[2];
        const res = document.getElementById('baResult');
        res.style.display = 'block';
        res.innerHTML = `<div class="ba-age-num">${age}</div><div class="ba-age-label">${info.label}</div><div class="ba-age-desc">${info.desc}</div>`;
        document.getElementById('baScanLabel').textContent = '✅ Scan complete!';
        SoundEngine.result();
        if (isAnimEnabled()) launchConfetti();
      }, 400);
    }
  }, 60);
};
document.getElementById('brainAgeModal')?.addEventListener('click', e => { if(e.target.id==='brainAgeModal') closeBrainAge(); });

// ═══════════════════════════════════════════════════════════
//  👻 HORROR MODE — auto triggers at midnight
// ═══════════════════════════════════════════════════════════
const HORROR_MSGS = [
  '👁️ The AI has been watching you\nfor longer than you think...',
  '🩸 Your face was scanned\n3 times before you clicked analyze.',
  '😱 Someone with your exact face\ncreated this website.',
  '🕯️ It is midnight.\nYour reflection knows.',
  '👻 The last person who got 99%\nnever came back to this page.',
];

function checkHorrorMode() {
  if (localStorage.getItem('afa_setting_horror') === '0') return;

  const h = new Date().getHours();
  if (h >= 0 && h < 3) {
    const shown = localStorage.getItem('afa_horror_shown_' + new Date().toDateString());
    if (!shown) {
      setTimeout(() => {
        const msg = HORROR_MSGS[Math.floor(Math.random()*HORROR_MSGS.length)];
        document.getElementById('horrorMsg').textContent = msg;
        document.getElementById('horrorOverlay').style.display = 'flex';
        if (isSoundEnabled()) {
          try {
            const ctx = new (window.AudioContext||window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine'; o.frequency.setValueAtTime(180, ctx.currentTime);
            o.frequency.linearRampToValueAtTime(80, ctx.currentTime+3);
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime+3);
            o.start(); o.stop(ctx.currentTime+3);
          } catch(e){}
        }
        localStorage.setItem('afa_horror_shown_' + new Date().toDateString(), '1');
      }, 3000);
    }
  }
}
window.dismissHorror = () => { document.getElementById('horrorOverlay').style.display = 'none'; };

window.setActiveNav = (btn) => {
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
  checkHorrorMode();
});

// ═══════════════════════════════════════════════════════════
//  SHARED UTILITY — all pages
// ═══════════════════════════════════════════════════════════
function pageToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function pgToast(msg) {
  let t = document.getElementById('pgToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'pgToast';
    t.className = 'pg-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════
//  🏆 LEADERBOARD JS
// ═══════════════════════════════════════════════════════════

const LB_NAMES = [
  ['Priya S.','🇮🇳'],['Lucas M.','🇧🇷'],['Jake T.','🇺🇸'],['Soo Y.','🇰🇷'],
  ['Emma R.','🇬🇧'],['Amara O.','🇳🇬'],['Yuki M.','🇯🇵'],['Sofia R.','🇲🇽'],
  ['Ali K.','🇵🇰'],['Kwame A.','🇬🇭'],['Maria G.','🇪🇸'],['Arjun K.','🇮🇳'],
  ['Chen L.','🇨🇳'],['Fatima H.','🇸🇦'],['Diego R.','🇦🇷'],['Anya P.','🇷🇺'],
  ['Kevin O.','🇳🇬'],['Mei L.','🇹🇼'],['Omar F.','🇪🇬'],['Lena M.','🇩🇪'],
  ['Ravi S.','🇮🇳'],['Chloe B.','🇫🇷'],['Hassan A.','🇲🇦'],['Jin S.','🇰🇷'],
  ['Aisha M.','🇵🇰'],['Bruno C.','🇧🇷'],['Nadia K.','🇺🇦'],['Tariq N.','🇿🇦'],
  ['Yuna H.','🇯🇵'],['Carlos V.','🇨🇴'],['Preet K.','🇮🇳'],['Zara A.','🇬🇧'],
  ['Min J.','🇰🇷'],['Isabel F.','🇵🇹'],['Karan M.','🇮🇳'],['Amir H.','🇮🇷'],
  ['Leila N.','🇲🇦'],['Tomás R.','🇦🇷'],['Yemi A.','🇳🇬'],['Sara L.','🇸🇪'],
  ['Dhruv P.','🇮🇳'],['Mia K.','🇩🇪'],['Abdul R.','🇸🇦'],['Hana Y.','🇯🇵'],
  ['Nico B.','🇮🇹'],['Zoe W.','🇦🇺'],['Raj V.','🇮🇳'],['Lily C.','🇨🇳'],
  ['Marco A.','🇧🇷'],['Fatou D.','🇸🇳'],
];
const LB_EMOJIS = ['👑','🧠','⚡','🌟','🎨','🔮','🚀','💎','🏆','🌍','🎯','💡','🔥','✨','🦋','🌈','😎','🦁','⭐','🎪'];

// ── COUNTRY DATA — YEARLY CUMULATIVE ─────────────────────
// LB_COUNTRY_BASE is defined above (shared with index stats)
// Re-use same LB_APP_LAUNCH

// lbCountryExtraToday — aaj ke extra analyses (leaderboard realtime engine se)
let lbCountryExtraToday = {};
LB_COUNTRY_BASE.forEach(c => {
  lbCountryExtraToday[c.n] = Math.floor(Math.random() * c.dailyAvg * 0.3);
});

function lbDaysSinceLaunch() {
  const now    = new Date();
  const diffMs = now - LB_APP_LAUNCH;
  return Math.max(1, Math.floor(diffMs / 86400000));
}

function lbGetCountryData() {
  // _LIVE se lo — same source, consistent everywhere
  const live = _LIVE.getCountry();
  return LB_COUNTRY_BASE.map(c => ({
    ...c,
    a: live[c.n] || (c.dailyAvg * lbDaysSinceLaunch())
  }));
}

const LB_STREAKERS_BASE = [
  {e:'🔥',n:'Yuki M.',c:'🇯🇵',str:30},{e:'⚡',n:'Jake T.',c:'🇺🇸',str:21},
  {e:'👑',n:'Priya S.',c:'🇮🇳',str:18},{e:'🧠',n:'Lucas M.',c:'🇧🇷',str:14},
  {e:'🎨',n:'Emma R.',c:'🇬🇧',str:12},{e:'🏆',n:'Ali K.',c:'🇵🇰',str:11},
  {e:'🌟',n:'Soo Y.',c:'🇰🇷',str:9}, {e:'🎯',n:'Maria G.',c:'🇪🇸',str:8},
  {e:'🔮',n:'Amara O.',c:'🇳🇬',str:7},{e:'💎',n:'Sofia R.',c:'🇲🇽',str:5},
];
const LB_RANK_CR = {1:500,2:300,3:200,4:100,5:100,6:50,7:50,8:50,9:50,10:50};

function lbMakePlayers() {
  return LB_NAMES.map((p, i) => {
    const baseScore = 50000 - i * 900 + Math.floor(Math.random() * 500);
    return {
      id:    'p' + i,
      e:     LB_EMOJIS[i % LB_EMOJIS.length],
      n:     p[0],
      c:     p[1],
      s:     baseScore,
      a:     Math.floor(baseScore / 120) + Math.floor(Math.random() * 10),
      str:   Math.max(1, 25 - Math.floor(i / 2) + Math.floor(Math.random() * 4)),
      trend: '➡️',
    };
  });
}

let LB_PLAYERS = lbMakePlayers();
LB_PLAYERS.sort((a, b) => b.s - a.s);

let lbPrevRanks = {};
LB_PLAYERS.forEach((p, i) => { lbPrevRanks[p.id] = i + 1; });

let lbCurrentTab  = 'global';
let lbLiveTimer   = null;
let lbResetTimer  = null;
let lbCdTimer     = null;
let lbIsRendering = false;

function lbInit() {
  lbRenderGlobal();
  lbStartRealtime();
  lbStartCountdown();
  lbScheduleMidnightReset();

  // ── ★ CHANGED: URL se country tab auto-open ──
  const _urlParams = new URLSearchParams(window.location.search);
  if (_urlParams.get('tab') === 'country') {
    setTimeout(() => {
      lbSwitchTab('country', document.getElementById('lbTabBtn-country'));
    }, 300);
  }
}

function lbStartCountdown() {
  if (lbCdTimer) clearInterval(lbCdTimer);
  lbTickCountdown();
  lbCdTimer = setInterval(lbTickCountdown, 1000);
}

function lbTickCountdown() {
  const now      = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;

  const h   = Math.floor(diff / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);

  const txt = `🔄 Daily reset in ${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

  const el = document.getElementById('lbGlobalCountdown');
  if (el) el.textContent = txt;
}

function lbScheduleMidnightReset() {
  if (lbResetTimer) clearTimeout(lbResetTimer);
  const now      = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight - now;

  lbResetTimer = setTimeout(() => {
    lbDoMidnightReset();
    lbScheduleMidnightReset();
  }, msLeft);
}

function lbDoMidnightReset() {
  LB_PLAYERS = lbMakePlayers();
  LB_PLAYERS.sort((a, b) => b.s - a.s);
  lbPrevRanks = {};
  LB_PLAYERS.forEach((p, i) => { lbPrevRanks[p.id] = i + 1; });

  LB_COUNTRY_BASE.forEach(c => {
    lbCountryExtraToday[c.n] = 0;
  });

  pgToast('🔄 New day! Leaderboard reset — race starts fresh! 🏆');

  if (lbCurrentTab === 'global') lbRenderGlobal();
}

function lbStartRealtime() {
  if (lbLiveTimer) clearInterval(lbLiveTimer);

  lbLiveTimer = setInterval(() => {
    LB_PLAYERS.forEach((p, i) => { lbPrevRanks[p.id] = i + 1; });

    LB_PLAYERS.forEach(p => {
      const r = Math.random();
      let gain;
      if      (r < 0.70) gain = Math.floor(Math.random() * 8)   + 1;
      else if (r < 0.90) gain = Math.floor(Math.random() * 25)  + 8;
      else if (r < 0.98) gain = Math.floor(Math.random() * 60)  + 30;
      else               gain = Math.floor(Math.random() * 150) + 80;

      if (Math.random() < 0.12) gain = -(Math.floor(Math.random() * 10) + 1);

      p.s = Math.max(100, p.s + gain);

      if (gain > 0) {
        const expected = Math.floor(p.s / 120);
        if (expected > p.a) p.a = expected;
      }
    });

    LB_PLAYERS.sort((a, b) => b.s - a.s);

    LB_PLAYERS.forEach((p, i) => {
      const newR  = i + 1;
      const prevR = lbPrevRanks[p.id] || newR;
      p.trend = newR < prevR ? '📈' : newR > prevR ? '📉' : '➡️';
    });

    if (Math.random() < 0.15) {
      const idx  = Math.floor(Math.random() * LB_PLAYERS.length);
      const nm   = LB_NAMES[Math.floor(Math.random() * LB_NAMES.length)];
      LB_PLAYERS[idx].n = nm[0];
      LB_PLAYERS[idx].c = nm[1];
      LB_PLAYERS[idx].e = LB_EMOJIS[Math.floor(Math.random() * LB_EMOJIS.length)];
    }

    // ── Country extra bhi badhao (index stats ke saath sync) ──
    LB_COUNTRY_BASE.forEach(c => {
      if (Math.random() < 0.3) {
        lbCountryExtraToday[c.n] += Math.floor(Math.random() * 5) + 1;
      }
    });

    LB_STREAKERS_BASE.forEach(p => {
      if (Math.random() < 0.02) p.str = Math.max(1, p.str + 1);
    });

    if      (lbCurrentTab === 'global')  lbRenderGlobal();
    else if (lbCurrentTab === 'country') lbRenderCountry();
    else if (lbCurrentTab === 'streak')  lbRenderStreak();

    const tickerEl = document.getElementById('lbTicker');
    if (tickerEl) {
      const rp  = LB_PLAYERS[Math.floor(Math.random() * 8)];
      const top = LB_PLAYERS[0];
      const msgs = [
        `${rp.c} ${rp.n} just moved ${rp.trend} · 🏆 ${top.c} ${top.n} leads with ${top.s.toLocaleString()} pts!`,
        `🔴 LIVE: Rankings shifting! ${LB_PLAYERS[1].c} ${LB_PLAYERS[1].n} chasing #1 · Fight for Top 10!`,
        `⚡ ${rp.c} ${rp.n} climbing the board! · Top 10 earns daily credits!`,
        `🌍 50+ players competing globally · ${top.c} ${top.n} dominates #1 right now!`,
      ];
      tickerEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }

  }, 2000);
}

function lbMyData() {
  const used = parseInt(localStorage.getItem('afa_credits_used') || 0);
  const a    = Math.max(0, Math.floor(used / 200));
  return { a, s: a * 280, str: parseInt(localStorage.getItem('afa_streak_days') || 0) };
}

function lbGrantReward(rank) {
  const cr  = LB_RANK_CR[rank]; if (!cr) return;
  const key = 'afa_lbrew_' + new Date().toDateString() + '_r' + rank;
  if (localStorage.getItem(key)) return;
  const cur = parseInt(localStorage.getItem('afa_credits') || 1000);
  localStorage.setItem('afa_credits', cur + cr);
  localStorage.setItem(key, '1');
  pgToast('🏆 Rank #' + rank + ' Bonus! +' + cr + ' Credits!');
  const rb = document.getElementById('lbRewBanner');
  if (rb) {
    rb.style.display = 'flex';
    document.getElementById('lbRewTitle').textContent = 'Rank #' + rank + ' Daily Reward!';
    document.getElementById('lbRewBadge').textContent = '+' + cr + ' ⚡';
  }
}

function lbRenderGlobal() {
  if (lbIsRendering) return;
  lbIsRendering = true;

  const my = lbMyData();
  let userRealRank = null;

  if (my.s > 0) {
    const above = LB_PLAYERS.filter(p => p.s > my.s).length;
    userRealRank = above + 1 + Math.floor(Math.random() * 3);
    if      (my.a === 0) userRealRank = 800  + Math.floor(Math.random() * 9200);
    else if (my.a < 3)   userRealRank = 200  + Math.floor(Math.random() * 800);
    else if (my.a < 10)  userRealRank = 50   + Math.floor(Math.random() * 150);

    const t = document.getElementById('lbMyTitle');
    if (t) t.textContent = 'You\'re Rank #' + userRealRank.toLocaleString() + ' 🌍';
    const s = document.getElementById('lbMySub');
    if (s) s.textContent = my.a + ' analyses · ' + my.str + 'd streak · ' + my.s.toLocaleString() + ' pts';
    const n = document.getElementById('lbMyNum');
    if (n) n.textContent = my.s.toLocaleString();
    if (userRealRank <= 10) lbGrantReward(userRealRank);
  }

  const top50 = LB_PLAYERS.slice(0, 50);

  const podOrder = [
    {p: top50[1], rank:2, cls:'lb-p2', crown:'🥈', rw:'+300⚡'},
    {p: top50[0], rank:1, cls:'lb-p1', crown:'🥇', rw:'+500⚡'},
    {p: top50[2], rank:3, cls:'lb-p3', crown:'🥉', rw:'+200⚡'},
  ];
  const podEl = document.getElementById('lbPodium');
  if (podEl) {
    podEl.innerHTML = podOrder.map(o => `
      <div class="lb-pod ${o.cls}">
        <div class="lb-pod-crown">${o.crown}</div>
        <div class="lb-pod-av">${o.p ? o.p.e : '?'}</div>
        <div class="lb-pod-badge">#${o.rank}</div>
        <div class="lb-pod-name">${o.p ? o.p.n : '—'}</div>
        <div class="lb-pod-pts">${o.p ? o.p.s.toLocaleString() : ''}</div>
        <div class="lb-pod-cr">${o.rw}</div>
        <div class="lb-pod-block"></div>
      </div>`).join('');
  }

  const listEl = document.getElementById('lbList');
  if (listEl) {
    const rows = top50.slice(3).map((p, i) => {
      const r   = i + 4;
      const cr  = LB_RANK_CR[r];
      const tCl = p.trend === '📈' ? 'color:#10b981;font-weight:800'
                : p.trend === '📉' ? 'color:#ef4444;font-weight:800'
                : 'color:#9ca3af';
      return `
        <div class="lb-row" id="lbrow-${p.id}">
          <div class="lb-rnum">${r}</div>
          <div class="lb-av">${p.e}</div>
          <div class="lb-inf">
            <div class="lb-nm">${p.n} ${p.c}</div>
            <div class="lb-mt">${p.a} analyses · ${p.str}d streak</div>
          </div>
          <div class="lb-ri">
            <div class="lb-pts">${p.s.toLocaleString()}</div>
            <div class="lb-ptsl">pts</div>
            <div class="lb-trend" style="${tCl}">${p.trend}</div>
            ${cr ? `<div class="lb-crd">+${cr}⚡</div>` : ''}
          </div>
        </div>`;
    });

    let userRowHTML = '';
    if (my.s > 0 && userRealRank > 50) {
      userRowHTML = `
        <div style="text-align:center;padding:8px;font-size:12px;color:#9ca3af;letter-spacing:1px">
          · · · ${(userRealRank - 51).toLocaleString()} more players · · ·
        </div>
        <div class="lb-row lb-me">
          <div class="lb-rnum">${userRealRank.toLocaleString()}</div>
          <div class="lb-av">🧑</div>
          <div class="lb-inf">
            <div class="lb-nm">You 🌐</div>
            <div class="lb-mt">${my.a} analyses · ${my.str}d streak</div>
          </div>
          <div class="lb-ri">
            <div class="lb-pts">${my.s.toLocaleString()}</div>
            <div class="lb-ptsl">pts</div>
            <div class="lb-trend" style="color:#ef4444;font-weight:800">📉</div>
          </div>
        </div>
        <div style="text-align:center;padding:10px;font-size:12px;color:#8b5cf6;font-weight:700">
          Analyze more to climb the ranks! 🚀
        </div>`;
    }

    listEl.innerHTML = rows.join('') + userRowHTML;
  }

  lbIsRendering = false;
}

function lbRenderCountry() {
  const el = document.getElementById('lbCountryEl');
  if (!el) return;

  // _LIVE.getCountry() se le lo — persistent, kabhi reset nahi hota
  const countryData = _LIVE.getCountry();
  const sorted = LB_COUNTRY_BASE
    .map(c => ({ ...c, a: countryData[c.n] || c.dailyAvg }))
    .sort((a, b) => b.a - a.a);
  const max = sorted[0].a;

  const launchStr = LB_APP_LAUNCH.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  const todayStr  = new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  const totalAll  = sorted.reduce((s, c) => s + c.a, 0);

  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:14px 16px;margin-bottom:14px;color:#fff;text-align:center">
      <div style="font-size:11px;opacity:0.85;letter-spacing:1px;margin-bottom:4px">📅 TOTAL ANALYSES SINCE LAUNCH</div>
      <div style="font-size:13px;font-weight:800">${launchStr} → ${todayStr}</div>
      <div style="font-size:22px;font-weight:900;margin-top:4px" id="lbCntGrandTotal">${totalAll >= 1000000 ? (totalAll/1000000).toFixed(2)+'M' : (totalAll/1000).toFixed(1)+'K'} Total 🌍</div>
    </div>
  ` + sorted.map((c, i) => `
    <div class="lb-cnt-row" id="lbcnt-${c.n.replace(/ /g, '_')}">
      <div class="lb-cnt-flag">${c.f}</div>
      <div class="lb-cnt-info">
        <div class="lb-cnt-name">#${i + 1} ${c.n}</div>
        <div class="lb-cnt-bar">
          <div class="lb-cnt-fill" id="lbbar-${c.n.replace(/ /g, '_')}" style="width:${Math.round(c.a / max * 100)}%;transition:width 0.6s ease"></div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;min-width:60px">
        <div class="lb-cnt-num" id="lbnum-${c.n.replace(/ /g, '_')}">${c.a >= 1000000 ? (c.a/1000000).toFixed(2)+'M' : (c.a/1000).toFixed(1)+'K'}</div>
        <div class="lb-cnt-lbl">analyses</div>
      </div>
    </div>`).join('');

  // Live DOM updater — _LIVE se read karo, har second update karo
  if (el._lbCntTimer) clearInterval(el._lbCntTimer);
  el._lbCntTimer = setInterval(() => {
    if (!document.getElementById('lbCntGrandTotal')) {
      clearInterval(el._lbCntTimer);
      el._lbCntTimer = null;
      return;
    }

    const fresh = _LIVE.getCountry();
    const freshSorted = LB_COUNTRY_BASE
      .map(c => ({ ...c, a: fresh[c.n] || 0 }))
      .sort((a, b) => b.a - a.a);
    const freshMax = freshSorted[0].a;
    let grandTotal = 0;

    freshSorted.forEach(c => {
      grandTotal += c.a;
      const id     = c.n.replace(/ /g, '_');
      const numEl  = document.getElementById('lbnum-' + id);
      const barEl  = document.getElementById('lbbar-' + id);
      const rowEl  = document.getElementById('lbcnt-' + id);
      if (!numEl) return;

      const prev = parseFloat(numEl.dataset.raw || c.a);
      const diff = c.a - prev;

      if (diff > 0) {
        numEl.dataset.raw  = c.a;
        numEl.textContent  = c.a >= 1000000 ? (c.a/1000000).toFixed(2)+'M' : (c.a/1000).toFixed(1)+'K';
        // Green flash
        numEl.style.color = '#10b981';
        numEl.style.transform = 'scale(1.15)';
        numEl.style.transition = 'all 0.15s';
        setTimeout(() => { numEl.style.color = ''; numEl.style.transform = 'scale(1)'; }, 350);
        // Bar update
        if (barEl) barEl.style.width = Math.min(100, Math.round(c.a / freshMax * 100)) + '%';
        // +N pop
        if (rowEl) {
          if (getComputedStyle(rowEl).position === 'static') rowEl.style.position = 'relative';
          const pop = document.createElement('span');
          pop.textContent = '+' + diff;
          pop.style.cssText = 'position:absolute;right:10px;top:6px;font-size:10px;font-weight:900;color:#10b981;pointer-events:none;opacity:1;transition:all 0.8s ease;z-index:5;';
          rowEl.appendChild(pop);
          requestAnimationFrame(() => {
            setTimeout(() => { pop.style.opacity='0'; pop.style.transform='translateY(-14px)'; }, 30);
            setTimeout(() => pop.remove(), 900);
          });
        }
      }
    });

    // Grand total
    const gtEl = document.getElementById('lbCntGrandTotal');
    if (gtEl) gtEl.textContent = grandTotal >= 1000000
      ? (grandTotal/1000000).toFixed(2)+'M Total 🌍'
      : (grandTotal/1000).toFixed(1)+'K Total 🌍';

  }, 1000);
}
function lbRenderStreak() {
  const el = document.getElementById('lbStreakEl');
  if (!el) return;
  const streakers = [...LB_STREAKERS_BASE].sort((a, b) => b.str - a.str);
  el.innerHTML = streakers.map((p, i) => `
    <div class="lb-str-row">
      <div class="lb-str-em">${p.e}</div>
      <div class="lb-str-inf">
        <div class="lb-str-name">${p.c} ${p.n}</div>
        <div class="lb-str-days">${p.str} consecutive days</div>
      </div>
      <div style="text-align:right">
        <div class="lb-str-num">${p.str}🔥</div>
        <div class="lb-str-rnk">#${i + 1} streak</div>
      </div>
    </div>`).join('');
}

function lbSwitchTab(tab, el) {
  lbCurrentTab = tab;
  ['global', 'country', 'streak'].forEach(t => {
    const d = document.getElementById('lbTab-' + t);
    if (d) d.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('on'));
  if (el) el.classList.add('on');
  if (tab === 'country') lbRenderCountry();
  if (tab === 'streak')  lbRenderStreak();
}

// ═══════════════════════════════════════════════════════════
//  🎯 MISSION JS
// ═══════════════════════════════════════════════════════════
const MS_LEVELS = [
  {lv:1,nm:'Rookie',min:0,max:500},{lv:2,nm:'Explorer',min:500,max:1200},
  {lv:3,nm:'Analyst',min:1200,max:2500},{lv:4,nm:'Expert',min:2500,max:5000},
  {lv:5,nm:'Master',min:5000,max:9000},{lv:6,nm:'Legend',min:9000,max:15000},
  {lv:7,nm:'Mythic',min:15000,max:25000},{lv:8,nm:'GOD TIER',min:25000,max:99999},
];
const MS_CHALLENGES = [
  {e:'😤',t:'Power Face',d:'Show your most intense, powerful, commanding expression. Own the frame!',r:200},
  {e:'😂',t:'Chaos Mode',d:'Make the most chaotic, wild, hilarious face possible. No limits!',r:150},
  {e:'😌',t:'Zen Energy',d:'Most peaceful, calm, serene face today. Find your inner stillness.',r:180},
  {e:'👑',t:'Royal Vibes',d:'Look like absolute royalty — regal, commanding, noble. Own your throne.',r:250},
  {e:'🤫',t:'Mystery Mode',d:'Most mysterious, enigmatic, unreadable expression.',r:200},
  {e:'😍',t:'Charm Blast',d:'Maximum charm and loveable energy. Melt every heart in one photo!',r:150},
  {e:'💪',t:'Boss Mode',d:'Most confident boss-level face. You own this place. Show it.',r:300},
];
const MS_DAILY = [
  {id:'m1',ic:'🔍',nm:'First Analysis',desc:'Analyze any face today',tgt:1,rar:'common',xp:50,cr:50},
  {id:'m2',ic:'📸',nm:'Triple Scan',desc:'Analyze 3 different faces today',tgt:3,rar:'rare',xp:120,cr:120},
  {id:'m3',ic:'🎯',nm:'Precision Shot',desc:'Complete any analysis today',tgt:1,rar:'epic',xp:200,cr:200},
  {id:'m4',ic:'📤',nm:'Share Result',desc:'Share your AI result with someone',tgt:1,rar:'common',xp:40,cr:40},
  {id:'m5',ic:'🏆',nm:'Face Champion',desc:'Analyze 5 times in one day',tgt:5,rar:'legendary',xp:500,cr:500},
  {id:'m6',ic:'🔥',nm:'Streak Keeper',desc:'Keep your streak alive today',tgt:1,rar:'rare',xp:80,cr:80},
];
const MS_WEEKLY = [
  {ic:'🔥',nm:'7-Day Warrior',desc:'Analyze every day for 7 days',cur:3,tgt:7,rw:1000},
  {ic:'🌍',nm:'World Traveler',desc:'Get 20 total analyses this week',cur:8,tgt:20,rw:800},
  {ic:'👑',nm:'Top Ranker',desc:'Reach top 10 on leaderboard',cur:0,tgt:1,rw:500},
  {ic:'⚡',nm:'Credit Hoarder',desc:'Earn 500+ credits this week',cur:210,tgt:500,rw:300},
];
const MS_ACHS = [
  {ic:'🥇',nm:'First Analysis',cond:(a)=>a>=1},
  {ic:'🔥',nm:'3-Day Streak',cond:(_,s)=>s>=3},
  {ic:'💯',nm:'10 Analyses',cond:(a)=>a>=10},
  {ic:'📤',nm:'Shared Once',cond:()=>!!localStorage.getItem('afa_shared')},
  {ic:'👑',nm:'50 Analyses',cond:(a)=>a>=50},
  {ic:'⚡',nm:'7-Day Streak',cond:(_,s)=>s>=7},
  {ic:'🧠',nm:'100 Analyses',cond:(a)=>a>=100},
  {ic:'🌟',nm:'30-Day Streak',cond:(_,s)=>s>=30},
];

const MS_FEATURES = [
  {ic:'📊',nm:'Face Compare',desc:'Compare two faces side-by-side — personality clash!',tags:['⚡ +150 XP','🎯 Unique feature'],cr:'+50⚡',fn:'openCompareModal',key:'afa_ms_feat_compare'},
  {ic:'🃏',nm:'Face Card Game',desc:'Get a collectible AI personality card for your face',tags:['✨ Rare reward','🃏 Collect them'],cr:'+40⚡',fn:'openFaceCardGame',key:'afa_ms_feat_card'},
  {ic:'💘',nm:'Face Dating',desc:'AI matchmaking — who is your perfect face match?',tags:['💕 Fun mode','🔥 Viral'],cr:'+40⚡',fn:'openFaceDating',key:'afa_ms_feat_dating'},
  {ic:'🌍',nm:'Country Battle',desc:'Which country does your face vibe match most?',tags:['🌍 Global','🏆 Ranked'],cr:'+40⚡',fn:'openCountryBattle',key:'afa_ms_feat_country'},
  {ic:'🎬',nm:'Celebrity Twin',desc:'Which celeb do you look like? AI will find your twin!',tags:['🌟 Famous','📸 Viral'],cr:'+60⚡',fn:'runCelebScan',key:'afa_ms_feat_celeb'},
  {ic:'👶',nm:'Baby Face Predictor',desc:'AI predicts what your baby will look like!',tags:['👶 Cute','🔮 Predictive'],cr:'+60⚡',fn:'runBabyPrediction',key:'afa_ms_feat_baby'},
  {ic:'🧠',nm:'Brain Age Test',desc:'Your face reveals your actual brain age. Try it!',tags:['🧪 Science','⚡ Instant'],cr:'+60⚡',fn:'runBrainScan',key:'afa_ms_feat_brain'},
  {ic:'🎡',nm:'Daily Spin Wheel',desc:'Spin the wheel for free credits and personality prizes!',tags:['🎰 Daily','💰 Free credits'],cr:'+30⚡',fn:'openSpinWheelModal',key:'afa_ms_feat_spin'},
];

function msInit() {
  msRender();
}

function msRender() {
  const used = parseInt(localStorage.getItem('afa_credits_used')||0);
  const a = Math.max(0, Math.floor(used/200));
  const str = parseInt(localStorage.getItem('afa_streak_days')||0);
  const cr = parseInt(localStorage.getItem('afa_credits')||1000);
  const xp = a*80 + str*40;
  const today = new Date();
  const todayStr = today.toDateString();

  let lv = MS_LEVELS[0];
  MS_LEVELS.forEach(l=>{if(xp>=l.min)lv=l;});
  const pct = Math.min(100,Math.round((xp-lv.min)/(lv.max-lv.min)*100));
  const xpBadge = document.getElementById('msXpBadge'); if(xpBadge) xpBadge.textContent='⭐ Level '+lv.lv+' — '+lv.nm;
  const xpCur = document.getElementById('msXpCur'); if(xpCur) xpCur.textContent=xp.toLocaleString();
  const xpMax = document.getElementById('msXpMax'); if(xpMax) xpMax.textContent=lv.max.toLocaleString();
  const xpLbl = document.getElementById('msXpLbl'); if(xpLbl) xpLbl.textContent=lv.lv<8?(lv.max-xp).toLocaleString()+' XP to Level '+(lv.lv+1)+' →':'🏆 MAX LEVEL!';
  setTimeout(()=>{const f=document.getElementById('msXpFill');if(f)f.style.width=pct+'%';},100);
  const stA=document.getElementById('msStA'); if(stA) stA.textContent=a;
  const ms2 = document.getElementById('stMsS'); if(ms2) ms2.textContent=str+'🔥';
  const mu=document.getElementById('stMsU'); if(mu) mu.textContent=used.toLocaleString();

  const ch = MS_CHALLENGES[today.getDate()%MS_CHALLENGES.length];
  const dcE=document.getElementById('msDcEmoji'); if(dcE) dcE.textContent=ch.e;
  const dcT=document.getElementById('msDcTitle'); if(dcT) dcT.textContent=ch.t;
  const dcD=document.getElementById('msDcDesc'); if(dcD) dcD.textContent=ch.d;
  const dcR=document.getElementById('msDcReward'); if(dcR) dcR.textContent='⚡ +'+ch.r+' Credits';
  const done = localStorage.getItem('afa_challenge_done_'+todayStr);
  const dcBtn=document.getElementById('msDcBtn');
  const dcDone=document.getElementById('msDcDone');
  if (done) { if(dcBtn){dcBtn.disabled=true;dcBtn.textContent='✅ Completed!';} if(dcDone) dcDone.style.display='block'; }
  const mid=new Date(today); mid.setHours(24,0,0,0);
  const diff=mid-today, h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000);
  const dcTimer=document.getElementById('msDcTimer'); if(dcTimer) dcTimer.textContent='Resets in '+h+'h '+m+'m';

  const featEl = document.getElementById('msFeatList');
  if (featEl) featEl.innerHTML = MS_FEATURES.map(f=>{
    const done2 = !!localStorage.getItem(f.key+'_'+todayStr);
    return `<div class="ms-feat" onclick="msFeatGo('${f.fn}','${f.key}')">
      <div class="ms-feat-ic">${f.ic}</div>
      <div class="ms-feat-body">
        <div class="ms-feat-name">${f.nm}</div>
        <div class="ms-feat-desc">${f.desc}</div>
        <div class="ms-feat-tags">${f.tags.map(t=>`<span class="ms-feat-tag">${t}</span>`).join('')}</div>
      </div>
      <div class="ms-feat-right">
        <button class="ms-feat-go">${done2?'✅ Done':'Go →'}</button>
        <div class="ms-feat-cr">${f.cr}</div>
      </div>
      ${done2?'<div class="ms-feat-done-badge">✅ Done today</div>':''}
    </div>`;
  }).join('');

  const dailyEl = document.getElementById('msDailyList');
  if (dailyEl) dailyEl.innerHTML = MS_DAILY.map(ms=>{
    const prog = Math.min(ms.tgt, a);
    const isDone = prog >= ms.tgt;
    const claimed = !!localStorage.getItem('afa_ms_claim_'+todayStr+'_'+ms.id);
    const canClaim = isDone && !claimed;
    return `<div class="ms-mc${isDone?' ms-done':''}">
      <div class="ms-mc-ic">${ms.ic}</div>
      <div class="ms-mc-body">
        <div class="ms-mc-name">${ms.nm}</div>
        <div class="ms-mc-desc">${ms.desc}</div>
        <div class="ms-bar"><div class="ms-bar-f" style="width:${Math.round(prog/ms.tgt*100)}%"></div></div>
        <div class="ms-mc-plbl">${prog}/${ms.tgt}${claimed?' · ✅ Claimed':''}</div>
      </div>
      <div class="ms-mc-right">
        ${canClaim?`<button class="ms-claim-btn" onclick="msClaimMission('${ms.id}',${ms.cr},${ms.xp})">+${ms.cr}⚡</button>`:
          claimed?'<div style="font-size:22px">✅</div>':
          `<div class="ms-mc-xp">+${ms.xp}</div><div class="ms-mc-xpl">XP</div>`}
      </div>
      <div class="ms-rar r-${ms.rar}">${ms.rar.toUpperCase()}</div>
    </div>`;
  }).join('');

  const weeklyEl = document.getElementById('msWeeklyList');
  if (weeklyEl) weeklyEl.innerHTML = MS_WEEKLY.map(w=>{
    const p = Math.min(100,Math.round(w.cur/w.tgt*100));
    return `<div class="ms-wc">
      <div class="ms-wc-ic">${w.ic}</div>
      <div class="ms-wc-body">
        <div class="ms-wc-name">${w.nm}</div>
        <div class="ms-wc-bar"><div class="ms-wc-fill" style="width:0%" data-w="${p}%"></div></div>
        <div class="ms-wc-pl">${w.desc} · ${w.cur.toLocaleString()}/${w.tgt.toLocaleString()}</div>
      </div>
      <div class="ms-wc-right">
        <div class="ms-wc-rw">+${(w.rw/1000).toFixed(1)}K⚡</div>
        <div class="ms-wc-pct">${p}%</div>
      </div>
    </div>`;
  }).join('');
  setTimeout(()=>document.querySelectorAll('.ms-wc-fill').forEach(b=>b.style.width=b.dataset.w),80);

  const achEl = document.getElementById('msAchGrid');
  if (achEl) achEl.innerHTML = MS_ACHS.map(ac=>{
    const ul = ac.cond(a,str);
    return `<div class="ms-ach-item ${ul?'ms-ul':'ms-lk'}">
      <span class="ms-ach-ic">${ac.ic}</span>
      <div class="ms-ach-nm">${ac.nm}</div>
    </div>`;
  }).join('');
}

function msFeatGo(fn, key) {
  const k = key+'_'+new Date().toDateString();
  if (!localStorage.getItem(k)) {
    const cur = parseInt(localStorage.getItem('afa_credits')||1000);
    localStorage.setItem('afa_credits', cur+40);
    localStorage.setItem(k,'1');
  }
  sessionStorage.setItem('afa_open_fn', fn);
  location.href='index.html';
}

function msAcceptChallenge() {
  const today = new Date().toDateString();
  localStorage.setItem('afa_challenge_done_'+today,'1');
  const ch = MS_CHALLENGES[new Date().getDate()%MS_CHALLENGES.length];
  const cur = parseInt(localStorage.getItem('afa_credits')||1000);
  localStorage.setItem('afa_credits', cur+ch.r);
  sessionStorage.setItem('afa_open_fn','triggerUpload');
  location.href='index.html';
}

function msClaimMission(id, cr, xp) {
  const key = 'afa_ms_claim_'+new Date().toDateString()+'_'+id;
  if (localStorage.getItem(key)) { pgToast('Already claimed!'); return; }
  const cur = parseInt(localStorage.getItem('afa_credits')||1000);
  localStorage.setItem('afa_credits', cur+cr);
  localStorage.setItem(key,'1');
  pgToast('✅ +'+cr+' Credits + '+xp+' XP!');
  setTimeout(msRender, 400);
}

// ═══════════════════════════════════════════════════════════
//  ⚙️ SETTINGS JS
// ═══════════════════════════════════════════════════════════

function stInit() {
  stLoadCredits();
  stLoadToggles();
  const lang   = localStorage.getItem('afa_lang')          || 'English';
  const style2 = localStorage.getItem('afa_analysisStyle') || 'Detailed';
  const lv = document.getElementById('stLangVal');  if (lv) lv.textContent  = lang;
  const sv = document.getElementById('stStyleVal'); if (sv) sv.textContent = style2;
}

function stLoadCredits() {
  const cur      = parseInt(localStorage.getItem(CREDIT_KEY)      || '1000');
  const used     = parseInt(localStorage.getItem(CREDIT_USED_KEY) || '0');
  const isLogged = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
  const start    = isLogged ? LOGIN_START : GUEST_START;
  const analyses = Math.max(0, Math.floor(used / 200));
  const streak   = parseInt(localStorage.getItem(STREAK_KEY)      || '0');
  const best     = parseInt(localStorage.getItem(STREAK_BEST_KEY) || '0');

  const cv = document.getElementById('stCredVal');   if (cv)  cv.textContent  = cur.toLocaleString();
  const cu = document.getElementById('stCredUsed');  if (cu)  cu.textContent  = used.toLocaleString() + ' credits used total';
  const pct = Math.max(0, Math.min(100, Math.round((cur / start) * 100)));
  setTimeout(() => { const f = document.getElementById('stCredFill'); if (f) f.style.width = pct + '%'; }, 150);
  const cp = document.getElementById('stCredPct');   if (cp)  cp.textContent  = pct + '% remaining';
  const cs = document.getElementById('stCredStart'); if (cs)  cs.textContent  = 'of ' + start.toLocaleString() + ' starting';
  const ma = document.getElementById('stMsA');       if (ma)  ma.textContent  = analyses;
  const ms2 = document.getElementById('stMsS');      if (ms2) ms2.textContent = streak + '🔥';
  const mu = document.getElementById('stMsU');       if (mu)  mu.textContent  = used.toLocaleString();

  const sn = document.getElementById('stStreakNum');  if (sn) sn.textContent = streak;
  const sl = document.getElementById('stStreakLbl');  if (sl) sl.textContent = 'day' + (streak !== 1 ? 's' : '') + ' in a row';
  const sb = document.getElementById('stStreakBest'); if (sb) sb.textContent = 'Best: ' + best + ' days';

  const dotsEl   = document.getElementById('stDots');
  const doneDays = JSON.parse(localStorage.getItem('afa_done_days') || '[]');
  if (dotsEl) {
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d  = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const isDone  = doneDays.includes(ds);
      const isToday = i === 0;
      dots += `<div class="st-dot${isDone ? ' done' : isToday ? ' today' : ''}">${isDone ? '✅' : isToday ? '📅' : '○'}</div>`;
    }
    dotsEl.innerHTML = dots;
  }

  stRenderCreditHistory();
}

function stRenderCreditHistory() {
  const histEl = document.getElementById('stHistList');
  if (!histEl) return;

  let hist = [];
  try { hist = JSON.parse(localStorage.getItem(CREDIT_HIST_KEY) || '[]'); } catch (e) { hist = []; }

  if (!hist.length) {
    histEl.innerHTML = `
      <div style="padding:20px;text-align:center;font-size:13px;color:#9ca3af;line-height:1.6">
        📭 No credit history yet.<br>Start analyzing faces to see your history!
      </div>`;
    return;
  }

  histEl.innerHTML = [...hist].reverse().slice(0, 10).map((h, i) => {
    const cost      = h.cost || 0;
    const remaining = h.remaining !== undefined ? h.remaining : '—';
    const time      = h.time || '';
    const date      = h.date || '';
    const label     = h.label || `Analysis #${hist.length - i}`;
    const icon      = h.icon  || '⚡';
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #f3f4f6">
        <div style="font-size:20px;flex-shrink:0">${icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#1f2937">${label}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px">${date} ${time}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:800;color:#dc2626">-${cost.toLocaleString()}⚡</div>
          <div style="font-size:10px;color:#9ca3af">${typeof remaining === 'number' ? remaining.toLocaleString() + ' left' : ''}</div>
        </div>
      </div>`;
  }).join('');
}

function stLoadToggles() {
  const map = {
    stTogAnim:        'anim',
    stTogSound:       'sound',
    stTogHorror:      'horror',
    stTogSpin:        'spin',
    stTogChallenge:   'challenge',
    stTogStreakWarn:  'streakWarn',
    stTogLeader:      'leader',
    stTogAutoSave:    'autosave',
    stTogHQ:          'hq'
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const defaultOn = ['anim','sound','horror','spin','autosave'].includes(key);
    const saved = localStorage.getItem('afa_setting_' + key);
    el.checked = saved !== null ? saved === '1' : defaultOn;
  });
}

function stSaveTog(key, el) {
  const val = el.checked ? '1' : '0';
  localStorage.setItem('afa_setting_' + key, val);

  switch (key) {
    case 'sound':   pgToast(el.checked ? '🔊 Sound Effects ON' : '🔇 Sound Effects OFF'); break;
    case 'anim':    pgToast(el.checked ? '✨ Animations & Confetti ON' : '🚫 Animations & Confetti OFF'); break;
    case 'horror':  pgToast(el.checked ? '👻 Horror Mode ON — see you at midnight!' : '😌 Horror Mode OFF'); break;
    case 'spin': {
      pgToast(el.checked ? '🎡 Spin Wheel shown on Home' : '🎡 Spin Wheel hidden on Home');
      const spinCards = document.querySelectorAll('.spin-card, [data-spin-section]');
      spinCards.forEach(c => c.style.display = el.checked ? '' : 'none');
      break;
    }
    case 'challenge':
      pgToast(el.checked ? '🎯 Daily Challenge Reminder ON' : '🎯 Daily Challenge Reminder OFF');
      if (el.checked && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') pgToast('🔔 Notifications enabled!'); }).catch(() => {});
      }
      break;
    case 'streakWarn':
      pgToast(el.checked ? '🔥 Streak Warning ON' : '🔥 Streak Warning OFF');
      if (el.checked && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') pgToast('🔔 Notifications enabled!'); }).catch(() => {});
      }
      break;
    case 'leader':   pgToast(el.checked ? '🏆 Leaderboard Updates ON' : '🏆 Leaderboard Updates OFF'); break;
    case 'autosave': pgToast(el.checked ? '💾 Auto-Save Results ON' : '💾 Auto-Save Results OFF'); break;
    case 'hq':       pgToast(el.checked ? '📸 High Quality Mode ON (uses more credits)' : '📸 Standard Quality Mode'); break;
    default:         pgToast(el.checked ? '✅ Enabled!' : '✅ Disabled!');
  }
}

function stShowLangPicker() {
  const langs = [
    ['English', '🇬🇧'], ['Hindi', '🇮🇳'], ['Spanish', '🇪🇸'],
    ['French', '🇫🇷'],  ['German', '🇩🇪'], ['Japanese', '🇯🇵'],
    ['Korean', '🇰🇷'],  ['Portuguese', '🇧🇷']
  ];
  const cur = localStorage.getItem('afa_lang') || 'English';
  const btns = langs.map(([l, f]) =>
    `<button onclick="stSetLang('${l}')" style="width:100%;padding:12px;background:${l === cur ? '#ede9fe' : '#f9fafb'};border:1.5px solid ${l === cur ? '#c4b5fd' : '#e5e7eb'};border-radius:12px;color:${l === cur ? '#7c3aed' : '#1a1a2e'};font-size:13px;font-weight:700;cursor:pointer;font-family:Poppins,sans-serif;margin-bottom:7px">${f} ${l}${l === cur ? ' ✓' : ''}</button>`
  ).join('');
  stShowQuickModal('🌐 Language', btns);
}

function stSetLang(l) {
  localStorage.setItem('afa_lang', l);
  const el = document.getElementById('stLangVal');
  if (el) el.textContent = l;
  stCloseModal();
  pgToast('🌐 Language set to ' + l);
}

function stShowStylePicker() {
  const styles = [
    ['Quick',     '⚡ Fast results, 3 traits'],
    ['Detailed',  '🧠 Full analysis, 8-10 traits'],
    ['Deep Dive', '🔬 Maximum detail, uses 2x credits'],
    ['Fun',       '😂 Casual & emoji-heavy results']
  ];
  const cur = localStorage.getItem('afa_analysisStyle') || 'Detailed';
  const btns = styles.map(([s, d]) =>
    `<button onclick="stSetStyle('${s}')" style="width:100%;padding:12px 14px;background:${s === cur ? '#ede9fe' : '#f9fafb'};border:1.5px solid ${s === cur ? '#c4b5fd' : '#e5e7eb'};border-radius:12px;color:${s === cur ? '#7c3aed' : '#1a1a2e'};font-size:13px;font-weight:700;cursor:pointer;font-family:Poppins,sans-serif;margin-bottom:7px;text-align:left"><div>${s}${s === cur ? ' ✓' : ''}</div><div style="font-size:11px;font-weight:500;color:#6b7280;margin-top:3px">${d}</div></button>`
  ).join('');
  stShowQuickModal('🧠 Analysis Style', btns);
}

function stSetStyle(s) {
  localStorage.setItem('afa_analysisStyle', s);
  const el = document.getElementById('stStyleVal');
  if (el) el.textContent = s;
  stCloseModal();
  pgToast('🧠 Analysis Style: ' + s);
}

let stQModal = null;
function stShowQuickModal(title, content) {
  stCloseModal();
  stQModal = document.createElement('div');
  stQModal.className = 'st-modal-ov';
  stQModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:20px';
  stQModal.innerHTML = `
    <div class="st-modal-box" style="width:100%;max-width:420px;background:#fff;border-radius:24px 24px 16px 16px;padding:24px;max-height:80vh;overflow-y:auto">
      <div class="st-modal-title" style="font-size:16px;font-weight:800;color:#1a1a2e;margin-bottom:16px">${title}</div>
      <div>${content}</div>
      <button class="st-modal-cancel" onclick="stCloseModal()" style="width:100%;padding:12px;background:#f3f4f6;border:none;border-radius:12px;font-size:13px;font-weight:700;color:#6b7280;cursor:pointer;margin-top:4px">Cancel</button>
    </div>`;
  stQModal.onclick = e => { if (e.target === stQModal) stCloseModal(); };
  document.body.appendChild(stQModal);
}

function stCloseModal() {
  if (stQModal) { stQModal.remove(); stQModal = null; }
}

function stOpenEditModal() {
  const curName = localStorage.getItem('afa_display_name') || localStorage.getItem('userName') || '';
  const inp = document.getElementById('stEditNameInput');
  if (inp) inp.value = curName;
  const modal = document.getElementById('stEditModal');
  if (modal) modal.style.display = 'flex';
}

function stCloseEditModal() {
  const modal = document.getElementById('stEditModal');
  if (modal) modal.style.display = 'none';
}

function stSaveEdit() {
  const nm = document.getElementById('stEditNameInput').value.trim();
  if (!nm) { pgToast('❌ Please enter a name'); return; }
  localStorage.setItem('afa_display_name', nm);
  localStorage.setItem('userName', nm);
  const el = document.getElementById('stUserName');
  if (el) el.textContent = nm;
  stCloseEditModal();
  pgToast('✅ Profile updated!');
}

function stClearHistory() {
  if (!confirm('Clear credit history? This cannot be undone.')) return;
  localStorage.removeItem(CREDIT_HIST_KEY);
  stLoadCredits();
  pgToast('🗑️ Credit history cleared!');
}

function stClearStreak() {
  if (!confirm('Reset your streak? This cannot be undone.')) return;
  localStorage.removeItem(STREAK_KEY);
  localStorage.removeItem(STREAK_LAST_KEY);
  localStorage.removeItem(STREAK_BEST_KEY);
  localStorage.removeItem('afa_done_days');
  localStorage.removeItem(STREAK_REWARDED_KEY);
  stLoadCredits();
  pgToast('💔 Streak reset to 0!');
}

function stClearAll() {
  if (!confirm('⚠️ Wipe ALL data? Credits, streak, history — everything will be deleted. This CANNOT be undone.')) return;
  if (!confirm('Are you 100% sure? All your progress will be permanently deleted.')) return;
  Object.keys(localStorage).filter(k => k.startsWith('afa_')).forEach(k => localStorage.removeItem(k));
  pgToast('☢️ All data wiped! Reloading...');
  setTimeout(() => location.reload(), 1200);
}

function stShareApp() {
  const url  = 'https://aifaceanalyzer.netlify.app/';
  const text = '🤖 AI Face Analyzer — Free AI personality analysis from your photo! 100% private & instant. Try it here 👉 ' + url;
  if (navigator.share) {
    navigator.share({ title: 'AI Face Analyzer', text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => pgToast('📋 Link copied to clipboard!'))
      .catch(() => { prompt('Copy this link:', url); });
  }
}

window.doGoogleLogin = function() {
  const fb = window.__fb;
  if (!fb) { pgToast('❌ Auth not ready, please wait...'); return; }
  fb.signInWithPopup(fb.auth, fb.provider)
    .then(() => { pgToast('✅ Logged in! Reloading...'); setTimeout(() => location.reload(), 800); })
    .catch(e => pgToast('❌ ' + (e.message || 'Login failed')));
};

window.doLogout = function() {
  const fb = window.__fb;
  if (!fb) return;
  fb.signOut(fb.auth)
    .then(() => {
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhoto');
      localStorage.removeItem(CREDIT_LOGGED_KEY);
      localStorage.setItem(CREDIT_KEY,      GUEST_START);
      localStorage.setItem(CREDIT_USED_KEY, '0');
      localStorage.setItem(CREDIT_TS_KEY,   Date.now());
      localStorage.removeItem(CREDIT_HIST_KEY);
      pgToast('👋 Logged out successfully!');
      setTimeout(() => location.reload(), 800);
    })
    .catch(e => pgToast('❌ Logout failed: ' + e.message));
};

function stWatchAuth() {
  const poll = setInterval(() => {
    if (window.__fb && window.__fb.onAuthStateChanged) {
      clearInterval(poll);
      window.__fb.onAuthStateChanged(window.__fb.auth, user => {
        const liCard  = document.getElementById('stLoggedIn');
        const gcCard  = document.getElementById('stGuestCard');
        const lrRow   = document.getElementById('stLogoutRow');

        if (user) {
          const name  = localStorage.getItem('afa_display_name') || user.displayName || 'User';
          const email = user.email || '';
          const photo = localStorage.getItem('userPhoto') || user.photoURL || '/favicon.ico';

          const n = document.getElementById('stUserName');  if (n) n.textContent  = name;
          const e = document.getElementById('stUserEmail'); if (e) e.textContent  = email;
          const p = document.getElementById('stUserPic');
          if (p) { p.src = photo; p.onerror = () => { p.src = '/favicon.ico'; }; }

          if (liCard) liCard.style.display = 'flex';
          if (gcCard) gcCard.style.display = 'none';
          if (lrRow)  lrRow.style.display  = 'flex';

          const wasLogged = localStorage.getItem(CREDIT_LOGGED_KEY) === 'true';
          if (!wasLogged) {
            localStorage.setItem(CREDIT_KEY,        LOGIN_START);
            localStorage.setItem(CREDIT_USED_KEY,   '0');
            localStorage.setItem(CREDIT_LOGGED_KEY, 'true');
            localStorage.setItem(CREDIT_TS_KEY,     Date.now());
            localStorage.removeItem(CREDIT_HIST_KEY);
            stLoadCredits();
            pgToast('🎉 Welcome! 200,000 Credits unlocked!');
          }

        } else {
          if (liCard) liCard.style.display = 'none';
          if (gcCard) gcCard.style.display = 'flex';
          if (lrRow)  lrRow.style.display  = 'none';
        }
      });
    }
  }, 200);
}

// ═══════════════════════════════════════════════════════════
//  🔁 PAGE ROUTER
// ═══════════════════════════════════════════════════════════
(function() {
  const PAGE = location.pathname.split('/').pop() || 'index.html';
  document.addEventListener('DOMContentLoaded', function() {
    if (PAGE === 'leaderboard.html') lbInit();
    if (PAGE === 'mission.html')     msInit();
    if (PAGE === 'settings.html') {
      stInit();
      stWatchAuth();
    }
    if (PAGE === 'index.html') {
      const fn = sessionStorage.getItem('afa_open_fn');
      if (fn) {
        sessionStorage.removeItem('afa_open_fn');
        setTimeout(() => { if (typeof window[fn] === 'function') window[fn](); }, 800);
      }
      const spinEnabled = localStorage.getItem('afa_setting_spin') !== '0';
      const spinCards = document.querySelectorAll('.spin-card, [data-spin-section]');
      spinCards.forEach(c => c.style.display = spinEnabled ? '' : 'none');
    }
  });
})();

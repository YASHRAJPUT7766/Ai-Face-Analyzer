/**
 * profile-onboarding.js
 * ─────────────────────────────────────────────────────────────
 * Shows a one-time profile setup popup.
 * REDESIGNED: White background, smooth animation, zero lag.
 * On confirm:
 *   1. Compresses image → uploads to Cloudinary
 *   2. Saves { name, photoUrl, uid } to Firestore
 *   3. Sets localStorage key so popup never shows again
 * ─────────────────────────────────────────────────────────────
 */
(function () {

  var CLD_CLOUD  = "dljzyticd";
  var CLD_PRESET = "YASHRAJPUT";
  var CLD_URL    = "https://api.cloudinary.com/v1_1/" + CLD_CLOUD + "/image/upload";

  var FB_API_KEY = "YOUR_FIREBASE_API_KEY";
  var FB_PROJECT = "YOUR_FIREBASE_PROJECT_ID";
  var FB_DB_URL  = "https://firestore.googleapis.com/v1/projects/" + FB_PROJECT
                 + "/databases/(default)/documents/userProfiles/";

  var PROFILE_KEY = "raf_profile_v1";

  if (localStorage.getItem(PROFILE_KEY) === "1") return;

  function getUID() {
    var uid = localStorage.getItem("raf_uid");
    if (!uid) {
      uid = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem("raf_uid", uid);
    }
    return uid;
  }

  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var MAX = 600;
        var w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else       { w = Math.round(w * MAX / h); h = MAX; }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) { cb(blob); }, "image/jpeg", 0.78);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function uploadToCloudinary(blob, uid, cb) {
    var fd = new FormData();
    fd.append("file", blob, uid + "_profile.jpg");
    fd.append("upload_preset", CLD_PRESET);
    fd.append("public_id", "profiles/" + uid);
    fetch(CLD_URL, { method: "POST", body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) { cb(null, d.secure_url || d.url); })
      .catch(function (e) { cb(e, null); });
  }

  function saveToFirestore(uid, name, photoUrl, cb) {
    var url = FB_DB_URL + uid + "?key=" + FB_API_KEY;
    var body = JSON.stringify({
      fields: {
        uid:       { stringValue: uid },
        name:      { stringValue: name },
        photoUrl:  { stringValue: photoUrl },
        createdAt: { stringValue: new Date().toISOString() },
        page:      { stringValue: window.location.pathname }
      }
    });
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body
    })
    .then(function () { cb(null); })
    .catch(function (e) { cb(e); });
  }

  // ── CSS — white, clean, smooth, zero lag ────────────────
  var style = document.createElement("style");
  style.textContent = `
    #raf-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      font-family: -apple-system, 'Segoe UI', sans-serif;
      animation: rafFadeIn 0.25s ease both;
    }
    @keyframes rafFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #raf-box {
      background: #ffffff;
      border-radius: 20px;
      max-width: 360px;
      width: 100%;
      padding: 28px 24px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15);
      color: #1a1a1a;
      text-align: center;
      animation: rafBoxIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
    }
    @keyframes rafBoxIn {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    #raf-box h2 {
      font-size: 20px;
      font-weight: 700;
      color: #111;
      margin: 0 0 4px;
    }
    #raf-box .raf-sub {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 22px;
    }
    #raf-avatar-wrap {
      position: relative;
      width: 84px;
      height: 84px;
      margin: 0 auto 18px;
      cursor: pointer;
    }
    #raf-avatar {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #e5e7eb;
      background: #f9fafb;
      display: block;
      transition: border-color 0.2s;
    }
    #raf-avatar-wrap:hover #raf-avatar {
      border-color: #7c3aed;
    }
    #raf-avatar-edit {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #7c3aed;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #fff;
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(124,58,237,0.35);
    }
    #raf-file { display: none; }
    #raf-name {
      width: 100%;
      box-sizing: border-box;
      padding: 11px 14px;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      color: #1a1a1a;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      margin-bottom: 16px;
      transition: border-color 0.18s;
    }
    #raf-name:focus { border-color: #7c3aed; background: #fff; }
    #raf-name::placeholder { color: #9ca3af; }
    #raf-err {
      font-size: 12px;
      color: #ef4444;
      margin: -10px 0 12px;
      min-height: 16px;
    }
    #raf-btn {
      width: 100%;
      padding: 13px;
      background: #7c3aed;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.18s, opacity 0.18s;
    }
    #raf-btn:hover:not(:disabled) { background: #6d28d9; }
    #raf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    #raf-spinner {
      display: none;
      margin: 10px auto 0;
      font-size: 13px;
      color: #7c3aed;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .raf-spin {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #e5e7eb;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: rafRotate 0.7s linear infinite;
    }
    @keyframes rafRotate { to { transform: rotate(360deg); } }
    .raf-note {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 12px;
      line-height: 1.5;
    }
  `;
  document.head.appendChild(style);

  var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 84 84'%3E%3Ccircle cx='42' cy='42' r='42' fill='%23f3f0ff'/%3E%3Ccircle cx='42' cy='32' r='14' fill='%237c3aed'/%3E%3Cellipse cx='42' cy='72' rx='22' ry='16' fill='%237c3aed'/%3E%3C/svg%3E";

  var selectedFile = null;

  function buildPopup() {
    var overlay = document.createElement("div");
    overlay.id = "raf-overlay";
    overlay.innerHTML = `
      <div id="raf-box">
        <h2>👋 Welcome!</h2>
        <div class="raf-sub">Set up your profile to continue</div>

        <div id="raf-avatar-wrap" title="Tap to choose photo">
          <img id="raf-avatar" src="${DEFAULT_AVATAR}" alt="Profile Photo" />
          <div id="raf-avatar-edit">✏️</div>
        </div>
        <input type="file" id="raf-file" accept="image/*">

        <input type="text" id="raf-name" placeholder="Enter your name…" maxlength="40" autocomplete="off">
        <div id="raf-err"></div>

        <button id="raf-btn">Save &amp; Continue →</button>
        <div id="raf-spinner"><span class="raf-spin"></span> Saving…</div>
        <div class="raf-note">Your profile is saved securely.</div>
      </div>
    `;
    document.body.appendChild(overlay);

    var avatarWrap = overlay.querySelector("#raf-avatar-wrap");
    var avatarImg  = overlay.querySelector("#raf-avatar");
    var fileInput  = overlay.querySelector("#raf-file");
    var nameInput  = overlay.querySelector("#raf-name");
    var errDiv     = overlay.querySelector("#raf-err");
    var btn        = overlay.querySelector("#raf-btn");
    var spinner    = overlay.querySelector("#raf-spinner");

    avatarWrap.addEventListener("click", function () { fileInput.click(); });

    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        errDiv.textContent = "Please select an image file."; return;
      }
      selectedFile = f;
      var reader = new FileReader();
      reader.onload = function (e) { avatarImg.src = e.target.result; };
      reader.readAsDataURL(f);
      errDiv.textContent = "";
    });

    nameInput.addEventListener("input", function () { errDiv.textContent = ""; });

    btn.addEventListener("click", function () {
      var name = nameInput.value.trim();
      if (!name) { errDiv.textContent = "Please enter your name."; return; }
      if (!selectedFile) { errDiv.textContent = "Please choose a profile photo."; return; }

      btn.disabled = true;
      spinner.style.display = "flex";
      errDiv.textContent = "";

      var uid = getUID();

      compressImage(selectedFile, function (blob) {
        uploadToCloudinary(blob, uid, function (err, photoUrl) {
          if (err || !photoUrl) {
            errDiv.textContent = "Photo upload failed. Please try again.";
            btn.disabled = false;
            spinner.style.display = "none";
            return;
          }

          saveToFirestore(uid, name, photoUrl, function (err2) {
            if (err2) {
              errDiv.textContent = "Save failed. Please try again.";
              btn.disabled = false;
              spinner.style.display = "none";
              return;
            }

            localStorage.setItem(PROFILE_KEY, "1");
            localStorage.setItem("raf_name", name);
            localStorage.setItem("raf_photo", photoUrl);

            // Dismiss smoothly
            overlay.style.transition = "opacity 0.22s ease";
            overlay.style.opacity = "0";
            setTimeout(function () {
              overlay.remove();
              // Geo popup trigger event (geo-popup will listen)
              document.dispatchEvent(new CustomEvent("raf-profile-done"));
            }, 230);
          });
        });
      });
    });

    // Shake on outside click (no close)
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        var box = document.getElementById("raf-box");
        box.style.transition = "transform 0.12s";
        box.style.transform = "scale(1.02)";
        setTimeout(function () { box.style.transform = ""; }, 130);
      }
    });
  }

  function init() {
    if (localStorage.getItem(PROFILE_KEY) === "1") return;
    buildPopup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

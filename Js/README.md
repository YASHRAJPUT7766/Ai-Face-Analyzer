# ⚙️ JS — JavaScript & CSS Files

This folder contains all the JavaScript logic and CSS styling for the Face AI app.

---

## 📂 File Overview

### 🎨 Styling
| File | Description |
|---|---|
| `style.css` | Main stylesheet — all UI styles, themes, responsive design |

### 🧠 Core Logic
| File | Description |
|---|---|
| `script.js` | Main app script — face analysis core logic |
| `server.js` | Local Node.js server for development |
| `sw.js` | Service Worker — enables PWA offline mode |

### 💎 Pro / Payment System
| File | Description |
|---|---|
| `pro-system.js` | Pro plan activation & management |
| `pro-manager.js` | Pro user session & state handler |
| `pro-upsell.js` | Upsell prompts & upgrade flow |
| `plan-system.js` | Plan comparison & selection logic |

### 👤 User & Onboarding
| File | Description |
|---|---|
| `profile-onboarding.js` | New user onboarding flow |
| `collect.js` | User data collection (privacy-safe) |

### 🌍 Popups & Geo
| File | Description |
|---|---|
| `consent-popup.js` | Cookie & privacy consent popup |
| `geo-popup.js` | Location-based popup & offers |

---

## 🔗 How Files Connect

```
index.html / any page
    ↓ loads
style.css          ← All visual styles
script.js          ← Core face analysis
pro-system.js      ← Checks if user is Pro
consent-popup.js   ← Shows on first visit
sw.js              ← Runs in background (PWA)
```

---

## 📝 Notes

- No external frameworks — pure Vanilla JS
- `sw.js` is registered from the root, not this folder
- `server.js` is only for local development

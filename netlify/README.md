# ☁️ Netlify — Serverless Backend Functions

This folder contains the backend API functions that run on Netlify's serverless infrastructure.

---

## 📂 Functions Overview

| File | Endpoint | Description |
|---|---|---|
| `check-pro.js` | `/.netlify/functions/check-pro` | Check if a user has active Pro subscription |
| `create-order.js` | `/.netlify/functions/create-order` | Create a new payment order |
| `verify-payment.js` | `/.netlify/functions/verify-payment` | Verify & confirm payment after checkout |
| `package.json` | — | Function-level dependencies |

---

## 🔄 Payment Flow

```
User clicks "Upgrade to Pro"
        ↓
create-order.js    ← Creates order, returns payment link
        ↓
User completes payment
        ↓
verify-payment.js  ← Verifies payment is genuine
        ↓
check-pro.js       ← App checks Pro status on each load
        ↓
Pro features unlocked ✅
```

---

## 🔐 Environment Variables Required

These must be set in Netlify Dashboard → Site Settings → Environment Variables:

```
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
PRO_SECRET_KEY=your_custom_secret
```

See `docs/.env.example` for full list.

---

## 🚀 How Netlify Functions Work

- Each `.js` file = one API endpoint
- Auto-deployed when you push to GitHub
- No server needed — fully serverless
- Free tier: 125,000 requests/month

---

## 🧪 Test Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local dev server with functions
netlify dev
```

Functions will be available at:
`http://localhost:8888/.netlify/functions/check-pro`

---

## 📝 Notes

- Functions run on Node.js 18+
- Each function must export a `handler` async function
- Cold start time: ~100-300ms (normal for serverless)

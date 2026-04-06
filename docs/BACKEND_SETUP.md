# AI Face Analyzer — Backend Setup Guide

## Files
- `server.js` — Node.js Express backend (Razorpay + Firebase)
- `.env.example` — Copy to `.env` and fill values
- `package.json` — Dependencies

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create .env file
```bash
cp .env.example .env
```
Then edit `.env`:
```
RAZORPAY_KEY_ID=YOUR_RAZORPAY_LIVE_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=3001
```

## Step 3: Firebase Service Account
1. Go to Firebase Console → Project Settings
2. Service Accounts tab → Generate new private key
3. Download the JSON file
4. Convert to single line: `node -e "console.log(JSON.stringify(require('./serviceAccount.json')))" `
5. Paste as value of `FIREBASE_SERVICE_ACCOUNT` in `.env`

## Step 4: Deploy Options

### Option A: Railway (Easiest — Free)
1. Go to railway.app → New Project → Deploy from GitHub
2. Add environment variables from your .env
3. Railway gives you a URL like `https://your-app.railway.app`
4. Update `BACKEND_URL` in `pricing.html` to that URL

### Option B: Render (Free)
1. render.com → New Web Service → Connect GitHub
2. Build command: `npm install`
3. Start command: `npm start`
4. Add env vars in dashboard

### Option C: Run Locally (for testing)
```bash
node server.js
# Server runs on http://localhost:3001
```

## Step 5: Update Frontend
In `pricing.html`, update line:
```js
var BACKEND_URL = ''; // Change to: 'https://your-app.railway.app'
```

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/create-order` | POST | Creates Razorpay order |
| `/api/verify-payment` | POST | Verifies payment + activates Pro in Firebase |
| `/api/check-pro` | POST | Check if user is Pro |
| `/api/pro-count` | GET | Get total Pro users count |

## Payment Flow
```
User clicks Pay
  → Frontend calls /api/create-order (gets order_id)
  → Razorpay checkout opens (UPI/Card/NetBanking)
  → User pays
  → Frontend calls /api/verify-payment (verifies signature)
  → Pro activated in Firebase + localStorage
  → Success screen shown
```

## Note
- `RAZORPAY_KEY_ID` goes in frontend (safe ✅)
- `RAZORPAY_KEY_SECRET` ONLY in backend .env (never in frontend ❌)

# 📚 Docs — Documentation & Setup Guides

This folder contains all documentation and environment setup files.

---

## 📂 File Overview

| File | Description |
|---|---|
| `BACKEND_SETUP.md` | Complete backend setup guide |
| `.env.example` | Template for environment variables |

---

## 🚀 Getting Started — Full Setup

### Step 1: Clone the Repo
```bash
git clone https://github.com/yourusername/face-ai.git
cd face-ai
```

### Step 2: Setup Environment Variables
```bash
# Copy the example file
cp docs/.env.example .env

# Open .env and fill in your keys
nano .env
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Read Backend Setup
Follow the full guide in [`BACKEND_SETUP.md`](BACKEND_SETUP.md)

---

## 🔑 Environment Variables (`.env.example`)

The `.env.example` file shows all required variables:

```
RAZORPAY_KEY_ID=        ← Get from Razorpay Dashboard
RAZORPAY_KEY_SECRET=    ← Get from Razorpay Dashboard
PRO_SECRET_KEY=         ← Your custom secret (any random string)
```

> ⚠️ **Never commit your `.env` file to GitHub!**
> It's already added to `.gitignore` for safety.

---

## 📖 Backend Setup (`BACKEND_SETUP.md`)

Covers:
- Payment gateway integration
- API keys configuration
- Netlify function deployment
- Testing payment flow
- Going live checklist

---

## 🔒 Security Notes

- `.env` file is in `.gitignore` — will NOT be pushed to GitHub ✅
- Never share your `RAZORPAY_KEY_SECRET` publicly
- Use Netlify environment variables for production keys
- Rotate keys if accidentally exposed

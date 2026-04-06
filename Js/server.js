/**
 * AI Face Analyzer — Node.js Backend
 * 
 * Handles:
 *  - Razorpay payment verification
 *  - Pro activation
 *  - Firebase Firestore: record who bought Pro
 *  - Email link support (Gmail linkage)
 *
 * Deploy: Netlify Functions (netlify/functions/) OR as standalone Node server
 * 
 * Install: npm install express razorpay firebase-admin cors dotenv
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const Razorpay   = require('razorpay');
const crypto     = require('crypto');
const admin      = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// ── RAZORPAY ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── FIREBASE ADMIN ──────────────────────────────────────────────────
// Set FIREBASE_SERVICE_ACCOUNT env var to your service account JSON (stringified)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}
const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════
// POST /api/create-order
// Creates a Razorpay order for the frontend to open checkout
// ═══════════════════════════════════════════════════════════════════
app.post('/api/create-order', async (req, res) => {
  try {
    const { currency = 'INR', country = 'IN', amount: clientAmount } = req.body;

    // Authoritative amount map (smallest unit: paise, cents, pence, fils, etc.)
    const AMOUNT_MAP = {
      INR: 100,   // ₹1
      USD: 1200,  // $12
      GBP: 950,   // £9.5
      EUR: 1100,  // €11
      AUD: 1900,  // A$19
      CAD: 1600,  // C$16
      SGD: 1600,  // S$16
      AED: 4400,  // AED 44
    };
    // Always use server-side amount — never trust client amount
    const amount = AMOUNT_MAP[currency] || 1200;

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { product: 'FaceAIPro', country },
    });

    res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('create-order error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/verify-payment
// Verifies Razorpay signature, activates Pro, writes to Firestore
// ═══════════════════════════════════════════════════════════════════
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, email } = req.body;

    // 1. Verify signature
    const body       = razorpay_order_id + '|' + razorpay_payment_id;
    const expected   = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    const isValid    = expected === razorpay_signature;

    if (!isValid) return res.status(400).json({ success: false, error: 'Signature mismatch' });

    // 2. Write to Firestore — pro_users collection
    const proData = {
      uid:          uid || null,
      email:        email || null,
      payment_id:   razorpay_payment_id,
      order_id:     razorpay_order_id,
      plan:         'Tripo4.5Pro',
      activated_at: admin.firestore.FieldValue.serverTimestamp(),
      active:       true,
    };

    // Use payment_id as doc ID to avoid duplicates
    await db.collection('pro_users').doc(razorpay_payment_id).set(proData);

    // 3. If uid known, also update users/{uid}
    if (uid) {
      await db.collection('users').doc(uid).set({
        isPro:     true,
        plan:      'Tripo4.5Pro',
        pro_since: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    res.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err) {
    console.error('verify-payment error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/link-email
// Links a Gmail to a Pro account (can be called before OR after purchase)
// ═══════════════════════════════════════════════════════════════════
app.post('/api/link-email', async (req, res) => {
  try {
    const { uid, email, payment_id } = req.body;
    if (!uid && !payment_id) return res.status(400).json({ success: false, error: 'uid or payment_id required' });

    const updateData = { email, email_linked_at: admin.firestore.FieldValue.serverTimestamp() };

    if (uid) {
      await db.collection('users').doc(uid).set(updateData, { merge: true });
    }
    if (payment_id) {
      await db.collection('pro_users').doc(payment_id).set(updateData, { merge: true });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('link-email error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/check-pro
// Frontend can call this to verify Pro status from server
// ═══════════════════════════════════════════════════════════════════
app.post('/api/check-pro', async (req, res) => {
  try {
    const { uid, email } = req.body;
    let isPro = false;

    if (uid) {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists && doc.data().isPro) isPro = true;
    }
    if (!isPro && email) {
      const snap = await db.collection('pro_users').where('email', '==', email).limit(1).get();
      if (!snap.empty) isPro = true;
    }

    res.json({ success: true, isPro });
  } catch (err) {
    console.error('check-pro error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/pro-count
// Returns count of Pro users (for social proof display)
// ═══════════════════════════════════════════════════════════════════
app.get('/api/pro-count', async (req, res) => {
  try {
    const snap = await db.collection('pro_users').where('active', '==', true).get();
    res.json({ success: true, count: snap.size });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Face Analyzer backend running on port ${PORT}`));

module.exports = app;

/**
 * Netlify Function: verify-payment
 * POST /.netlify/functions/verify-payment
 *
 * Flow:
 * 1. Verify Razorpay signature (HMAC-SHA256)
 * 2. Save to Firestore → pro_users/{payment_id}
 * 3. If email provided → also save to pro_emails/{sanitized_email}
 * 4. If uid provided → update users/{uid}.isPro = true
 * 5. Return success → frontend sets localStorage + shows success screen
 *
 * Email lookup: user can later call /check-pro with email to restore Pro
 * on any device, any browser, forever.
 */

const crypto      = require('crypto');
const admin       = require('firebase-admin');

// Init Firebase once (Netlify keeps functions warm between calls)
function initFirebase() {
  if (admin.apps.length) return;
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential:  admin.credential.cert(sa),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    initFirebase();
    const db = admin.firestore();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      uid,
      email,      // user ki email — Pro lifetime ke liye key
      currency,
      country,
    } = JSON.parse(event.body || '{}');

    // ── 1. VERIFY SIGNATURE ──────────────────────────────────────────
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Signature mismatch — payment tampered' }),
      };
    }

    // ── 2. BUILD PRO RECORD ──────────────────────────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    const proRecord = {
      payment_id:   razorpay_payment_id,
      order_id:     razorpay_order_id,
      plan:         'FaceAIPro_Lifetime',
      currency:     currency || 'INR',
      country:      country  || 'IN',
      uid:          uid   || null,
      email:        email || null,
      activated_at: now,
      active:       true,
    };

    const batch = db.batch();

    // ── 3. pro_users/{payment_id} — main record ──────────────────────
    batch.set(db.collection('pro_users').doc(razorpay_payment_id), proRecord);

    // ── 4. pro_emails/{sanitized_email} — email lookup table ─────────
    // This is how user restores Pro on new device just by entering email
    if (email) {
      const emailKey = email.toLowerCase().replace(/[.#$\/\[\]]/g, '_');
      batch.set(db.collection('pro_emails').doc(emailKey), {
        email:       email,
        payment_id:  razorpay_payment_id,
        plan:        'FaceAIPro_Lifetime',
        uid:         uid || null,
        activated_at: now,
        active:      true,
      });
    }

    // ── 5. users/{uid} — update existing user doc ────────────────────
    if (uid) {
      batch.set(db.collection('users').doc(uid), {
        isPro:     true,
        plan:      'FaceAIPro_Lifetime',
        pro_since: now,
        email:     email || null,
      }, { merge: true });
    }

    await batch.commit();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, payment_id: razorpay_payment_id }),
    };

  } catch (err) {
    console.error('verify-payment error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

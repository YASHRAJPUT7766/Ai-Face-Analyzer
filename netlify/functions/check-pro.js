/**
 * Netlify Function: check-pro
 * POST /.netlify/functions/check-pro
 *
 * User enters email → check Firestore → return isPro
 * Works on any device, any browser, forever.
 *
 * Body: { email: "user@example.com" } OR { uid: "firebaseUID" }
 */

const admin = require('firebase-admin');

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

    const { email, uid } = JSON.parse(event.body || '{}');

    if (!email && !uid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'email or uid required' }),
      };
    }

    let isPro = false;
    let paymentId = null;
    let plan = null;

    // Check by email first (most reliable — works without login)
    if (email) {
      const emailKey = email.toLowerCase().replace(/[.#$\/\[\]]/g, '_');
      const emailDoc = await db.collection('pro_emails').doc(emailKey).get();
      if (emailDoc.exists && emailDoc.data().active) {
        isPro     = true;
        paymentId = emailDoc.data().payment_id;
        plan      = emailDoc.data().plan;
      }
    }

    // Check by uid if email check failed
    if (!isPro && uid) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists && userDoc.data().isPro) {
        isPro = true;
        plan  = userDoc.data().plan;
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, isPro, payment_id: paymentId, plan }),
    };

  } catch (err) {
    console.error('check-pro error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

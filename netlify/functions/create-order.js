/**
 * Netlify Function: create-order
 * POST /.netlify/functions/create-order
 * Creates a Razorpay order and returns order_id to frontend
 */

const Razorpay = require('razorpay');

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

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const { currency = 'INR', country = 'IN' } = JSON.parse(event.body || '{}');

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Always use server-side authoritative amount
    const amount = AMOUNT_MAP[currency] || 1200;

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: { product: 'FaceAIPro', country },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success:   true,
        order_id:  order.id,
        amount:    order.amount,
        currency:  order.currency,
      }),
    };
  } catch (err) {
    console.error('create-order error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};

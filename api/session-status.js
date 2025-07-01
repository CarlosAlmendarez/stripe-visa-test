// api/session-status.js

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS:
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitimos GET para consultar la sesión
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "Falta el parámetro 'session_id' en la query" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    return res.status(200).json({
      status: session.status,
      customer_email: session.customer_details?.email || null,
    });
  } catch (err) {
    console.error('Error en session-status:', err);
    return res.status(500).json({ error: err.message });
  }
};

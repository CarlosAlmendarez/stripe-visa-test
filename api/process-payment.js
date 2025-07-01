// api/create‐checkout‐session.js

// No necesitamos express aquí; basta con un handler que reciba req, res.
// Requerimos Stripe y lo inicializamos con la variable de entorno.
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Función handler para crear la sesión de Checkout.
 * Vercel invocará esto cuando reciba una petición a /api/create‐checkout‐session.
 */
module.exports = async (req, res) => {
  // 1) Configuramos CORS de forma manual:
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Si viene un preflight (OPTIONS), respondemos 200 y terminamos:
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitimos método POST:
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Parseamos el body como JSON (Vercel ya hace JSON.parse automáticamente).
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: "Se requiere un priceId en el body" });
    }

    // Creamos la sesión de Checkout en Stripe:
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      // IMPORTANTE: Vercel no es localhost, así que generamos la return_url dinámicamente
      return_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Enviamos de vuelta el ID de sesión y el client_secret
    return res.status(200).json({
      sessionId: session.id,
      clientSecret: session.client_secret,
    });
  } catch (err) {
    console.error('Error en create‐checkout‐session:', err);
    return res.status(500).json({ error: err.message });
  }
};

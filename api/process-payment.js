require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const cors = require('cors');

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware CORS manual
app.use((req, res, next) => {
  // Configura los headers CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // Específica tu origen Angular
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Si usas cookies/sesión
  
  // Manejo de solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});


app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId } = req.body;  // Recibe el Price ID del frontend

        console.log(priceId);

        if (!priceId) {
            return res.status(400).json({ error: "Se requiere un Price ID" });
        }

        // Crea la sesión con el Price ID recibido
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'payment',
            return_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.json({
            sessionId: session.id,
            clientSecret: session.client_secret
        });

    } catch (error) {
        console.error('Error:', error);
    }
});

// Ruta para verificar el estado de la sesión (para la página de retorno)
app.get('/session-status', async (req, res) => {
    const { session_id } = req.query;

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        res.json({
            status: session.status,
            customer_email: session.customer_details?.email
        });
    } catch (error) {
        console.error('Error al verificar el estado de la sesión:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sirve archivos estáticos
app.use(express.static('public'));

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
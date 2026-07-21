import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client:', err.message);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Debug: Log email configuration
console.log('📧 Email Configuration:');
console.log(`  HOST: ${process.env.EMAIL_HOST}`);
console.log(`  PORT: ${process.env.EMAIL_PORT}`);
console.log(`  USER: ${process.env.EMAIL_USER}`);
console.log(`  FROM: ${process.env.EMAIL_FROM}`);
console.log(`  PASSWORD: ${process.env.EMAIL_PASSWORD ? '✓ (set)' : '✗ (NOT SET)'}`);

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD?.replace(/\s/g, ''), // Remove spaces from app password
  },
  pool: true, // Réutilise les connexions SMTP (envoi beaucoup plus rapide)
  maxConnections: 5,
  maxMessages: 100,
});

// WhatsApp Cloud API (Meta) configuration
console.log('📱 WhatsApp Configuration:');
console.log(`  META_WHATSAPP_TOKEN: ${process.env.META_WHATSAPP_TOKEN ? '✓ (set)' : '✗ (NOT SET)'}`);
console.log(`  META_WHATSAPP_PHONE_NUMBER_ID: ${process.env.META_WHATSAPP_PHONE_NUMBER_ID ? '✓ (set)' : '✗ (NOT SET)'}`);

const META_API_VERSION = 'v22.0';
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || null;
const META_WHATSAPP_PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || null;

// Verify email configuration on startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Email transporter error:', err.message);
  } else if (success) {
    console.log('✅ Email transporter configured successfully');
  }
});

// Function to send confirmation email
const sendConfirmationEmail = async (appointment) => {
  try {
    console.log(`📧 Preparing email for: ${appointment.client_email}`);
    
    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
    .header h1 { color: #d4af37; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
    .content { background-color: white; padding: 20px; border-radius: 5px; }
    .appointment-detail { margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #d4af37; }
    .appointment-detail strong { color: #d4af37; display: block; font-size: 12px; text-transform: uppercase; }
    .appointment-detail span { display: block; font-size: 16px; margin-top: 5px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
    .button { display: inline-block; background-color: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maison <span style="color: #333;">Belle</span></h1>
      <p>Votre rendez-vous a été confirmé ✓</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${appointment.client_name}</strong>,</p>
      
      <p>Nous avons le plaisir de confirmer votre rendez-vous chez <strong>Maison Belle</strong>.</p>
      
      <div class="appointment-detail">
        <strong>📅 Date</strong>
        <span>${formattedDate}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>🕐 Heure</strong>
        <span>${appointment.appointment_time}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>💄 Prestation</strong>
        <span>${appointment.service}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>🏷️ Catégorie</strong>
        <span>${appointment.category}</span>
      </div>
      
      <p style="margin-top: 30px; font-style: italic; color: #666;">
        Si vous devez annuler ou modifier votre rendez-vous, veuillez nous contacter au moins 24 heures à l'avance.
      </p>
      
      <p>Merci de votre confiance !<br><strong>Maison Belle</strong></p>
    </div>
    
    <div class="footer">
      <p>© 2026 Maison Belle. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: appointment.client_email,
      subject: `Rendez-vous confirmé - Maison Belle - ${formattedDate}`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${appointment.client_email} (MessageID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending email to ${appointment.client_email}:`, err.message);
    return false;
  }
};

// Function to send WhatsApp confirmation via Meta Cloud API
const sendWhatsAppConfirmation = async (appointment) => {
  if (!META_WHATSAPP_TOKEN || !META_WHATSAPP_PHONE_NUMBER_ID) {
    console.log('⚠️ WhatsApp non configuré (Meta Cloud API manquante)');
    return false;
  }

  try {
    console.log(`📱 Preparing WhatsApp for: ${appointment.client_phone}`);

    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let phone = appointment.client_phone.trim();
    phone = phone.replace(/[^\d+]/g, '');
    if (phone.startsWith('+')) {
      phone = phone.slice(1);
    }

    const messageBody = `Bonjour ${appointment.client_name} ! ✅

Votre rendez-vous chez *Maison Belle* a été confirmé !

📅 *Date :* ${formattedDate}
🕐 *Heure :* ${appointment.appointment_time}
💄 *Prestation :* ${appointment.service}
🏷️ *Catégorie :* ${appointment.category}

📍 *Adresse :* Cité 1045 logts, Bat 48, N° 08, Bordj Bou Arreridj

Merci de votre confiance et à bientôt ! ✨`;

    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: messageBody },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    console.log(`✅ WhatsApp sent successfully to +${phone}`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending WhatsApp to ${appointment.client_phone}:`, err.message);
    return false;
  }
};

const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log(`📧 Preparing order email for: ${order.client_email}`);
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
    .header h1 { color: #d4af37; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
    .content { background-color: white; padding: 20px; border-radius: 5px; }
    .order-detail { margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #d4af37; }
    .order-detail strong { color: #d4af37; display: block; font-size: 12px; text-transform: uppercase; }
    .order-detail span { display: block; font-size: 16px; margin-top: 5px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maison <span style="color: #333;">Belle</span></h1>
      <p>Votre commande a été reçue ✓</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${order.client_name}</strong>,</p>
      
      <p>Nous avons bien reçu votre commande de <strong>Press On Nails</strong>.</p>
      
      <div class="order-detail">
        <strong>📦 Commande n°</strong>
        <span>PON-${order.id.toString().padStart(4, '0')}</span>
      </div>
      
        <div class="order-detail">
          <strong>💄 Type</strong>
          <span>${order.type === 'hands' ? 'Mains' : 'Pieds'}</span>
        </div>
        
        <div class="order-detail">
          <strong>💅 Forme</strong>
          <span>${order.forme || '-'}</span>
        </div>
        
        <div class="order-detail">
          <strong>📏 Taille</strong>
          <span>${order.taille || '-'}</span>
        </div>
      
      <div class="order-detail">
        <strong>✨ Modèles</strong>
        <span>${order.selected_prestations.join(', ')}</span>
      </div>
      
      <div class="order-detail">
        <strong>🔢 Quantité</strong>
        <span>${order.quantity} set(s)</span>
      </div>
      
      <div class="order-detail">
        <strong>💰 Total</strong>
        <span>${Number(order.total_price).toLocaleString('fr-FR')} DA</span>
      </div>
      
      <div class="order-detail">
        <strong>📍 Adresse de livraison</strong>
        <span>${order.address}, ${order.commune}, ${order.wilaya}</span>
      </div>
      
      <p style="margin-top: 30px; font-style: italic; color: #666;">
        Le temps de préparation est estimé à 3-5 jours ouvrés. Nous vous recontacterons dès que votre commande sera prête à être expédiée.
      </p>
      
      <p>Merci de votre confiance !<br><strong>Maison Belle</strong></p>
    </div>
    
    <div class="footer">
      <p>© 2026 Maison Belle. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: order.client_email,
      subject: `Commande reçue - Maison Belle - PON-${order.id.toString().padStart(4, '0')}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order email sent successfully to ${order.client_email}`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending order email to ${order.client_email}:`, err.message);
    return false;
  }
};

const sendFormationEmail = async (formation, status) => {
  try {
    console.log(`📧 Preparing formation email for: ${formation.client_email}`);

    const typeLabel = formation.type === 'ongles' ? 'Ongles' : 'Cils / Sourcils';
    const accepted = status === 'accepted';

    const decisionLine = accepted
      ? 'Votre demande de formation a été <strong>acceptée</strong> ✅'
      : 'Votre demande de formation a été <strong>refusée</strong> pour le moment ❌';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
    .header h1 { color: #d4af37; margin: 0; font-size: 28px; }
    .header p { color: #666; margin: 5px 0 0 0; font-size: 14px; }
    .content { background-color: white; padding: 20px; border-radius: 5px; }
    .appointment-detail { margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #d4af37; }
    .appointment-detail strong { color: #d4af37; display: block; font-size: 12px; text-transform: uppercase; }
    .appointment-detail span { display: block; font-size: 16px; margin-top: 5px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maison <span style="color: #333;">Belle</span></h1>
      <p>Demande de formation</p>
    </div>

    <div class="content">
      <p>Bonjour <strong>${formation.client_name}</strong>,</p>

      <p>${decisionLine}</p>

      <div class="appointment-detail">
        <strong>💡 Domaine</strong>
        <span>${typeLabel}</span>
      </div>

      ${formation.admin_message ? `
      <div class="appointment-detail">
        <strong>✉️ Message de la formatrice</strong>
        <span>${formation.admin_message}</span>
      </div>` : ''}

      <p style="margin-top: 30px; font-style: italic; color: #666;">
        Merci de votre intérêt pour nos formations. Pour toute question, n'hésitez pas à nous contacter.
      </p>

      <p>Encore merci de votre confiance !<br><strong>Maison Belle</strong></p>
    </div>

    <div class="footer">
      <p>© 2026 Maison Belle. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: formation.client_email,
      subject: `Demande de formation ${accepted ? 'acceptée' : 'refusée'} - Maison Belle - ${typeLabel}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Formation email sent successfully to ${formation.client_email}`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending formation email to ${formation.client_email}:`, err.message);
    return false;
  }
};

// Middleware pour vérifier JWT et rôle
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer les infos complètes de l'utilisateur incluant le rôle
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'User not found' });
    
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
};

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, role',
      [email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message.includes('duplicate') ? 'Email already exists' : err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT id, password, role FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) return res.status(400).json({ error: 'User not found' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get booked slots for a date
app.get('/api/booked-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  try {
    const result = await pool.query(
      'SELECT appointment_time FROM appointments WHERE appointment_date = $1 AND status != $2',
      [date, 'cancelled']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointments
app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments ORDER BY appointment_date, appointment_time'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
  const { category, service, appointment_date, appointment_time, client_name, client_phone, client_email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO appointments (category, service, appointment_date, appointment_time, client_name, client_phone, client_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [category, service, appointment_date, appointment_time, client_name, client_phone, client_email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update appointment status
app.patch('/api/appointments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    console.log(`🔄 Updating appointment ${id} to status: ${status}`);
    
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    const appointment = result.rows[0];
    
    // Send confirmation email + WhatsApp if status changed to confirmed
    if (status === 'confirmed') {
      console.log(`📬 Sending confirmations for appointment ${id}...`);
      await Promise.all([
        sendConfirmationEmail(appointment),
        sendWhatsAppConfirmation(appointment),
      ]);
    }
    
    res.json(appointment);
  } catch (err) {
    console.error(`❌ Error updating appointment ${id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// Delete appointment
app.delete('/api/appointments/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get reviews (only approved ones for public)
app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE approved = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit review (public)
app.post('/api/reviews', async (req, res) => {
  const { client_name, client_email, rating, review_text } = req.body;
  if (!client_name || !rating || !review_text) {
    return res.status(400).json({ error: 'Name, rating and review are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO reviews (client_name, client_email, rating, review_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_name, client_email || null, rating, review_text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting review:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get all reviews (admin)
app.get('/api/reviews/all', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update review status (admin)
app.patch('/api/reviews/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reviews SET approved = $1 WHERE id = $2 RETURNING *',
      [approved, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete review (admin)
app.delete('/api/reviews/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get orders (admin)
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const { 
    type, 
    forme,
    taille,
    selected_prestations, 
    quantity, 
    total_price, 
    client_name, 
    client_phone, 
    client_email, 
    address, 
    wilaya, 
    commune 
  } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO orders (type, forme, taille, selected_prestations, quantity, total_price, client_name, client_phone, client_email, address, wilaya, commune) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [type, forme, taille, selected_prestations, quantity, total_price, client_name, client_phone, client_email, address, wilaya, commune]
    );
    
    const order = result.rows[0];
    
    // Send confirmation email
    await sendOrderConfirmationEmail(order);
    
    res.json(order);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Update order status (admin)
app.patch('/api/orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PRESTATIONS
app.get('/api/prestations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prestations ORDER BY category, id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prestations', verifyToken, async (req, res) => {
  const { category, name, duration, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO prestations (category, name, duration, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, name, duration, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/prestations/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { category, name, duration, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE prestations SET category = $1, name = $2, duration = $3, price = $4 WHERE id = $5 RETURNING *',
      [category, name, duration, price, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/prestations/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM prestations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ITEMS PON
app.get('/api/items-pon', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items_pon ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/items-pon', verifyToken, async (req, res) => {
  const { name, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO items_pon (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/items-pon/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items_pon SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [name, description, price, image_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/items-pon/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items_pon WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GALLERY
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description, display_order, media_type FROM gallery ORDER BY display_order, id');
    const base = `${req.protocol}://${req.get('host')}`;
    const rows = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      display_order: r.display_order,
      media_type: r.media_type,
      image_url: `${base}/api/gallery/${r.id}/media`,
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve gallery media (image/video) directly as a binary HTTP response
app.get('/api/gallery/:id/media', async (req, res) => {
  try {
    const result = await pool.query('SELECT image_url FROM gallery WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).end();
    const url = row.image_url;
    const match = url.match(/^data:(.+?);base64,(.+)$/);
    if (!match) return res.redirect(url);
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    res.status(500).end();
  }
});

// FORMATIONS
// Submit a formation request (public)
app.post('/api/formations', async (req, res) => {
  const { type, client_name, client_phone, client_email } = req.body;
  if (!type || !client_name || !client_phone || !client_email) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (!['ongles', 'cils_sourcils'].includes(type)) {
    return res.status(400).json({ error: 'Type de formation invalide' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO formations (type, client_name, client_phone, client_email) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, client_name, client_phone, client_email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting formation:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get all formation requests (admin)
app.get('/api/formations', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM formations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update formation status (admin) — sends email to requester
app.patch('/api/formations/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status, admin_message } = req.body;
  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  try {
    const result = await pool.query(
      'UPDATE formations SET status = $1, admin_message = $2 WHERE id = $3 RETURNING *',
      [status, admin_message || null, id]
    );
    const formation = result.rows[0];
    if (formation && (status === 'accepted' || status === 'rejected')) {
      await sendFormationEmail(formation, status);
    }
    res.json(formation);
  } catch (err) {
    console.error(`❌ Error updating formation ${id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// Delete formation request (admin)
app.delete('/api/formations/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM formations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/gallery', verifyToken, async (req, res) => {
  const { image_url, title, description, display_order, media_type } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO gallery (image_url, title, description, display_order, media_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [image_url, title, description, display_order || 0, media_type || 'image']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM gallery WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

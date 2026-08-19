import express from 'express';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { validateName, validatePhone, validateEmail, validateMessage, firstError, escapeHtml } from './validation.js';

dotenv.config();

const app = express();
app.set('trust proxy', true);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: true },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client:', err.message);
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const AUTH_COOKIE_NAME = 'bb_session';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const isHttpsRequest = (req) => req.secure || req.headers['x-forwarded-proto'] === 'https';

const setAuthCookie = (res, token, req) => {
  const secure = isHttpsRequest(req);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
};

const clearAuthCookie = (res, req) => {
  const secure = isHttpsRequest(req);
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });
};

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080', 'https://brow-bloom-app.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const mediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const mediaUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Trop d'uploads, réessayez dans 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

const respondError = (req, res, err, status = 400) => {
  console.error(`[${req.method} ${req.originalUrl}] Erreur API:`, err instanceof Error ? err.message : String(err));
  res.status(status).json({ error: 'Une erreur est survenue, veuillez réessayer' });
};

// Vérification des tables requises au démarrage (lecture seule — le rôle
// applicatif n'a PAS de droits DDL en production. Les tables doivent être
// créées au préalable via server/schema.sql + server/setup_limited_role.sql).
const REQUIRED_TABLES = ['users', 'appointments', 'reviews', 'orders', 'prestations', 'items_pon', 'gallery', 'formations', 'client_photos'];
(async () => {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const existing = new Set(result.rows.map(r => r.table_name));
    const missing = REQUIRED_TABLES.filter(t => !existing.has(t));
    if (missing.length > 0) {
      console.error('⚠️ Tables manquantes:', missing.join(', '));
      console.error('   → Exécutez une fois les migrations : psql "$DATABASE_URL" -f server/schema.sql');
      console.error('   → puis utilisez le rôle limité : voir server/setup_limited_role.sql');
    } else {
      console.log('✅ Toutes les tables requises sont présentes');
    }
  } catch (err) {
    console.error('⚠️ Impossible de vérifier les tables:', err.message);
  }
})();

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
      <p>Bonjour <strong>${escapeHtml(appointment.client_name)}</strong>,</p>
      
      <p>Nous avons le plaisir de confirmer votre rendez-vous chez <strong>Maison Belle</strong>.</p>
      
      <div class="appointment-detail">
        <strong>📅 Date</strong>
        <span>${escapeHtml(formattedDate)}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>🕐 Heure</strong>
        <span>${escapeHtml(appointment.appointment_time)}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>💄 Prestation</strong>
        <span>${escapeHtml(appointment.service)}</span>
      </div>
      
      <div class="appointment-detail">
        <strong>🏷️ Catégorie</strong>
        <span>${escapeHtml(appointment.category)}</span>
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

// Shared helper to send any WhatsApp message via Meta Cloud API
async function sendWhatsApp(phoneRaw, messageBody) {
  if (!META_WHATSAPP_TOKEN || !META_WHATSAPP_PHONE_NUMBER_ID) {
    console.log('⚠️ WhatsApp non configuré (Meta Cloud API manquante)');
    return false;
  }
  try {
    let phone = phoneRaw.trim().replace(/[^\d+]/g, '');
    if (phone.startsWith('+')) phone = phone.slice(1);
    if (!phone.startsWith('213') && !phone.startsWith('00')) {
      phone = '213' + phone.replace(/^0+/, '');
    }
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
    console.error(`❌ WhatsApp error to ${phoneRaw}:`, err.message);
    return false;
  }
}

// WhatsApp for appointment confirmation
const sendWhatsAppConfirmation = async (appointment) => {
  const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const msg = `Bonjour ${appointment.client_name} ! ✅

Votre rendez-vous chez *Maison Belle* a été confirmé !

📅 *Date :* ${formattedDate}
🕐 *Heure :* ${appointment.appointment_time}
💄 *Prestation :* ${appointment.service}
🏷️ *Catégorie :* ${appointment.category}

📍 *Adresse :* Cité 1045 logts, Bat 48, N° 08, Bordj Bou Arreridj

Merci de votre confiance et à bientôt ! ✨`;
  return sendWhatsApp(appointment.client_phone, msg);
};

// WhatsApp for order confirmation
const sendWhatsAppOrderConfirmation = async (order) => {
  const msg = `Bonjour ${order.client_name} ! ✅

Votre commande *Press On Nails* chez Maison Belle a été confirmée !

📦 *Commande :* #PON-${order.id}
💅 *Type :* ${order.type === 'hands' ? 'Mains' : 'Pieds'}
💰 *Total :* ${Number(order.total_price).toLocaleString('fr-FR')} DA
📍 *Livraison :* ${order.wilaya}

Nous vous contacterons dès l'expédition. Merci de votre confiance ! ✨`;
  return sendWhatsApp(order.client_phone, msg);
};

// WhatsApp for formation decision
const sendWhatsAppFormationNotification = async (formation, status) => {
  const types = formation.type.split(',').filter(Boolean);
  const typeLabel = types.map(t => t === 'ongles' ? 'Ongles' : 'Cils / Sourcils').join(' et ');
  const decision = status === 'accepted' ? 'acceptée ✅' : 'refusée pour le moment ❌';
  const msg = `Bonjour ${formation.client_name} !

Votre demande de formation en *${typeLabel}* chez Maison Belle a été ${decision}.

${formation.admin_message ? `✉️ Message : ${formation.admin_message}` : ''}

Merci de votre intérêt ! ✨`;
  return sendWhatsApp(formation.client_phone, msg);
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
      <p>Bonjour <strong>${escapeHtml(order.client_name)}</strong>,</p>
      
      <p>Nous avons bien reçu votre commande de <strong>Press On Nails</strong>.</p>
      
      <div class="order-detail">
        <strong>📦 Commande n°</strong>
        <span>PON-${order.id.toString().padStart(4, '0')}</span>
      </div>
      
        <div class="order-detail">
          <strong>💄 Type</strong>
          <span>${escapeHtml(order.type === 'hands' ? 'Mains' : 'Pieds')}</span>
        </div>
        
        <div class="order-detail">
          <strong>💅 Forme</strong>
          <span>${escapeHtml(order.forme || '-')}</span>
        </div>
        
        <div class="order-detail">
          <strong>📏 Taille</strong>
          <span>${escapeHtml(order.taille || '-')}</span>
        </div>
      
      <div class="order-detail">
        <strong>✨ Modèles</strong>
        <span>${escapeHtml(order.selected_prestations.join(', '))}</span>
      </div>
      
      <div class="order-detail">
        <strong>🔢 Quantité</strong>
        <span>${escapeHtml(order.quantity)} set(s)</span>
      </div>
      
      <div class="order-detail">
        <strong>💰 Total</strong>
        <span>${Number(order.total_price).toLocaleString('fr-FR')} DA</span>
      </div>
      
      <div class="order-detail">
        <strong>📍 Adresse de livraison</strong>
        <span>${escapeHtml(order.address)}, ${escapeHtml(order.commune)}, ${escapeHtml(order.wilaya)}</span>
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

    const types = formation.type.split(',').filter(Boolean);
    const typeLabel = types.map(t => t === 'ongles' ? 'Ongles' : 'Cils / Sourcils').join(' et ');
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
      <p>Bonjour <strong>${escapeHtml(formation.client_name)}</strong>,</p>

      <p>${decisionLine}</p>

      <div class="appointment-detail">
        <strong>💡 Domaine</strong>
        <span>${escapeHtml(typeLabel)}</span>
      </div>

      ${formation.admin_message ? `
      <div class="appointment-detail">
        <strong>✉️ Message de la formatrice</strong>
        <span>${escapeHtml(formation.admin_message)}</span>
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

const sendAppointmentCancellationEmail = async (appointment) => {
  try {
    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
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
    .detail { margin: 15px 0; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #d4af37; }
    .detail strong { color: #d4af37; display: block; font-size: 12px; text-transform: uppercase; }
    .detail span { display: block; font-size: 16px; margin-top: 5px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maison <span style="color: #333;">Belle</span></h1>
      <p>Rendez-vous refusé ❌</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${escapeHtml(appointment.client_name)}</strong>,</p>
      <p>Nous sommes désolés, votre rendez-vous du <strong>${escapeHtml(formattedDate)}</strong> à <strong>${escapeHtml(appointment.appointment_time)}</strong> a été <strong>refusé</strong>.</p>
      <p>Veuillez nous contacter pour reprogrammer un créneau.</p>
      <p style="margin-top: 30px; font-style: italic; color: #666;">Merci de votre compréhension.</p>
      <p>L'équipe Maison Belle</p>
    </div>
    <div class="footer">
      <p>© 2026 Maison Belle. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: appointment.client_email,
      subject: `Rendez-vous refusé - Maison Belle - ${formattedDate}`,
      html: emailContent,
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to ${appointment.client_email}`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending cancellation email to ${appointment.client_email}:`, err.message);
    return false;
  }
};

// Order status email (confirmed / cancelled)
const sendOrderDecisionEmail = async (order, status) => {
  try {
    const accepted = status === 'confirmed';
    const decision = accepted ? 'acceptée' : 'refusée';
    const emoji = accepted ? '✅' : '❌';
    const decisionLine = accepted
      ? 'Votre commande a été <strong>acceptée</strong> et est en cours de préparation ✅'
      : 'Votre commande a été <strong>refusée</strong> pour le moment ❌';

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
      <p>Commande ${decision} ${emoji}</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${escapeHtml(order.client_name)}</strong>,</p>
      <p>${decisionLine}</p>
      <div class="order-detail">
        <strong>📦 Commande n°</strong>
        <span>PON-${order.id.toString().padStart(4, '0')}</span>
      </div>
      <div class="order-detail">
        <strong>💄 Type</strong>
        <span>${escapeHtml(order.type === 'hands' ? 'Mains' : 'Pieds')}</span>
      </div>
      <div class="order-detail">
        <strong>✨ Modèles</strong>
        <span>${escapeHtml(order.selected_prestations.join(', '))}</span>
      </div>
      <div class="order-detail">
        <strong>💰 Total</strong>
        <span>${Number(order.total_price).toLocaleString('fr-FR')} DA</span>
      </div>
      ${accepted ? `<p style="margin-top: 30px; font-style: italic; color: #666;">Nous vous contacterons dès l'expédition. Merci de votre confiance !</p>` : ''}
      <p>Merci de votre confiance !<br><strong>Maison Belle</strong></p>
    </div>
    <div class="footer">
      <p>© 2026 Maison Belle. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: order.client_email,
      subject: `Commande ${decision} - Maison Belle - PON-${order.id.toString().padStart(4, '0')}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order decision email sent to ${order.client_email}`);
    return true;
  } catch (err) {
    console.error(`❌ Error sending order decision email to ${order.client_email}:`, err.message);
    return false;
  }
};
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.split(' ')[1];
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
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const error = firstError([
    validateEmail(email, { required: true, max: 120, label: 'Email' }),
    validateName(password, { required: true, min: 6, max: 72, label: 'Mot de passe' }),
  ]);
  if (error) return res.status(400).json({ error: 'Inscription impossible, veuillez réessayer' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, role',
      [email.trim(), hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token, req);
    res.json({ userId: user.id, role: user.role });
  } catch (err) {
    console.error('[POST /api/auth/signup] Erreur:', err.message);
    res.status(400).json({ error: 'Inscription impossible, veuillez réessayer' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT id, password, role FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token, req);
    res.json({ userId: user.id, role: user.role });
  } catch (err) {
    console.error('[POST /api/auth/login] Erreur:', err.message);
    res.status(500).json({ error: 'Une erreur est survenue, veuillez réessayer' });
  }
});

// Logout : supprime le cookie de session
app.post('/api/auth/logout', (req, res) => {
  clearAuthCookie(res, req);
  res.json({ success: true });
});

// Récupérer l'utilisateur courant (vérification réelle côté serveur)
app.get('/api/auth/me', verifyToken, (req, res) => {
  res.json({ userId: req.user.id, email: req.user.email, role: req.user.role });
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
    respondError(req, res, err, 500);
  }
});

// Get appointments
app.get('/api/appointments', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments ORDER BY appointment_date, appointment_time'
    );
    res.json(result.rows);
  } catch (err) {
    respondError(req, res, err, 500);
  }
});

// Create appointment
app.post('/api/appointments', publicFormLimiter, async (req, res) => {
  const { category, service, appointment_date, appointment_time, client_name, client_phone, client_email } = req.body;
  const error = firstError([
    validateName(category, { required: true, min: 2, max: 50, label: 'Catégorie' }),
    validateName(service, { required: true, min: 2, max: 500, label: 'Prestation' }),
    validateName(client_name, { required: true, min: 2, max: 80, label: 'Nom' }),
    validatePhone(client_phone, { required: true, label: 'Téléphone' }),
    validateEmail(client_email, { required: true, label: 'Email' }),
  ]);
  if (error) return res.status(400).json({ error });
  if (!appointment_date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
    return res.status(400).json({ error: 'Date invalide' });
  }
  if (!appointment_time || !/^\d{2}:\d{2}$/.test(appointment_time)) {
    return res.status(400).json({ error: 'Heure invalide' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO appointments (category, service, appointment_date, appointment_time, client_name, client_phone, client_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [category, service, appointment_date, appointment_time, client_name, client_phone, client_email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// Update appointment status
app.patch('/api/appointments/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    console.log(`🔄 Updating appointment ${id} to status: ${status}`);
    
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    const appointment = result.rows[0];
    
    // Send confirmation email + WhatsApp if status changed to confirmed (non-bloquant)
    if (status === 'confirmed') {
      console.log(`📬 Sending confirmations for appointment ${id}...`);
      Promise.all([
        sendConfirmationEmail(appointment),
        sendWhatsAppConfirmation(appointment),
      ]).catch(() => {});
    }
    if (status === 'cancelled') {
      sendAppointmentCancellationEmail(appointment).catch(() => {});
    }
    
    res.json(appointment);
  } catch (err) {
    console.error(`❌ Error updating appointment ${id}:`, err.message);
    respondError(req, res, err, 400);
  }
});

// Delete appointment
app.delete('/api/appointments/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
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
    respondError(req, res, err, 500);
  }
});

// Submit review (public)
app.post('/api/reviews', publicFormLimiter, async (req, res) => {
  const { client_name, client_email, rating, review_text } = req.body;
  const error = firstError([
    validateName(client_name, { required: true, min: 2, max: 50, label: 'Nom' }),
    validateEmail(client_email, { required: false, label: 'Email' }),
    validateMessage(review_text, { required: true, max: 1000, label: 'Avis' }),
  ]);
  if (error) return res.status(400).json({ error });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
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
    respondError(req, res, err, 400);
  }
});

// Get all reviews (admin)
app.get('/api/reviews/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    respondError(req, res, err, 500);
  }
});

// Update review status (admin)
app.patch('/api/reviews/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reviews SET approved = $1 WHERE id = $2 RETURNING *',
      [approved, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// Delete review (admin)
app.delete('/api/reviews/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// Get orders (admin)
app.get('/api/orders', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    respondError(req, res, err, 500);
  }
});

// Create order
app.post('/api/orders', publicFormLimiter, async (req, res) => {
  const { 
    type, 
    forme,
    taille,
    selected_prestations, 
    selected_items,
    client_name, 
    client_phone, 
    client_email, 
    address, 
    wilaya, 
    commune 
  } = req.body;

  const error = firstError([
    validateName(client_name, { required: true, min: 2, max: 50, label: 'Nom' }),
    validatePhone(client_phone, { required: true, label: 'Téléphone' }),
    validateEmail(client_email, { required: true, label: 'Email' }),
    validateMessage(address, { required: true, max: 200, label: 'Adresse' }),
    validateMessage(wilaya, { required: true, max: 100, label: 'Wilaya' }),
    validateMessage(commune, { required: true, max: 100, label: 'Commune' }),
  ]);
  if (error) return res.status(400).json({ error });
  if (!['hands', 'feet'].includes(type)) {
    return res.status(400).json({ error: 'Type de commande invalide' });
  }
  if (!Array.isArray(selected_prestations) || selected_prestations.length === 0) {
    return res.status(400).json({ error: 'Sélectionnez au moins un modèle' });
  }
  if (!Array.isArray(selected_items) || selected_items.length === 0) {
    return res.status(400).json({ error: 'Sélectionnez au moins un modèle' });
  }

  try {
    // Prix calculé côté serveur à partir de la table items_pon (le client ne peut pas le modifier)
    let totalPrice = 0;
    let totalQuantity = 0;
    for (const item of selected_items) {
      const itemId = Number(item.id);
      const qty = Number(item.qty);
      if (!Number.isInteger(itemId) || !Number.isInteger(qty) || qty < 1 || qty > 10) {
        return res.status(400).json({ error: 'Quantité invalide pour un modèle' });
      }
      const ponResult = await pool.query('SELECT price FROM items_pon WHERE id = $1', [itemId]);
      const pon = ponResult.rows[0];
      if (!pon) return res.status(400).json({ error: `Modèle inconnu (id ${itemId})` });
      totalPrice += Number(pon.price) * qty;
      totalQuantity += qty;
    }
    if (!Number.isInteger(totalQuantity) || totalQuantity < 1 || totalQuantity > 50) {
      return res.status(400).json({ error: 'Quantité totale invalide' });
    }

    const result = await pool.query(
      'INSERT INTO orders (type, forme, taille, selected_prestations, quantity, total_price, client_name, client_phone, client_email, address, wilaya, commune) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [type, forme, taille, selected_prestations, totalQuantity, totalPrice, client_name, client_phone, client_email, address, wilaya, commune]
    );
    
    const order = result.rows[0];
    
    res.json(order);
  } catch (err) {
    console.error('Error creating order:', err.message);
    respondError(req, res, err, 400);
  }
});

// Update order status (admin)
app.patch('/api/orders/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    const order = result.rows[0];
    if (status === 'confirmed') {
      sendOrderConfirmationEmail(order).catch(() => {});
      sendWhatsAppOrderConfirmation(order).catch(() => {});
    }
    if (status === 'cancelled') {
      sendOrderDecisionEmail(order, status).catch(() => {});
    }
    res.json(order);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.delete('/api/orders/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// PRESTATIONS
app.get('/api/prestations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prestations ORDER BY category, id');
    res.json(result.rows);
  } catch (err) {
    respondError(req, res, err, 500);
  }
});

app.post('/api/prestations', verifyToken, isAdmin, async (req, res) => {
  const { category, name, duration, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO prestations (category, name, duration, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, name, duration, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.put('/api/prestations/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { category, name, duration, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE prestations SET category = $1, name = $2, duration = $3, price = $4 WHERE id = $5 RETURNING *',
      [category, name, duration, price, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.delete('/api/prestations/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM prestations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// ITEMS PON
app.get('/api/items-pon', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items_pon ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    respondError(req, res, err, 500);
  }
});

app.post('/api/items-pon', verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO items_pon (name, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.put('/api/items-pon/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items_pon SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [name, description, price, image_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.delete('/api/items-pon/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM items_pon WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
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
    respondError(req, res, err, 500);
  }
});

// Serve gallery media (image/video) directly as a binary HTTP response
app.get('/api/gallery/:id/media', mediaLimiter, async (req, res) => {
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
app.post('/api/formations', publicFormLimiter, async (req, res) => {
  const { types, client_name, client_phone, client_email } = req.body;
  const error = firstError([
    validateName(client_name, { required: true, min: 2, max: 50, label: 'Nom' }),
    validatePhone(client_phone, { required: true, label: 'Téléphone' }),
    validateEmail(client_email, { required: true, label: 'Email' }),
  ]);
  if (error) return res.status(400).json({ error });
  if (!types || !Array.isArray(types) || types.length === 0) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  const validTypes = ['ongles', 'cils_sourcils'];
  for (const t of types) {
    if (!validTypes.includes(t)) {
      return res.status(400).json({ error: `Type de formation invalide: ${t}` });
    }
  }
  const typeStr = types.join(',');
  try {
    const result = await pool.query(
      'INSERT INTO formations (type, client_name, client_phone, client_email) VALUES ($1, $2, $3, $4) RETURNING *',
      [typeStr, client_name, client_phone, client_email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting formation:', err.message);
    respondError(req, res, err, 400);
  }
});

// Get all formation requests (admin)
app.get('/api/formations', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM formations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading formations:', err.message);
    respondError(req, res, err, 500);
  }
});

// Update formation status (admin) — sends email to requester
app.patch('/api/formations/:id', verifyToken, isAdmin, async (req, res) => {
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
      Promise.all([
        sendFormationEmail(formation, status),
        sendWhatsAppFormationNotification(formation, status),
      ]).catch(() => {});
    }
    res.json(formation);
  } catch (err) {
    console.error(`❌ Error updating formation ${id}:`, err.message);
    respondError(req, res, err, 400);
  }
});

// Delete formation request (admin)
app.delete('/api/formations/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM formations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

const MAX_MEDIA_BYTES = 7 * 1024 * 1024; // 7 Mo décodés (compatible limite body 10 Mo)

app.post('/api/gallery', verifyToken, isAdmin, mediaUploadLimiter, async (req, res) => {
  const { image_url, title, description, display_order, media_type } = req.body;
  const mt = media_type || 'image';
  if (!['image', 'video'].includes(mt)) {
    return res.status(400).json({ error: 'Type de média invalide' });
  }
  const raw = String(image_url || '');
  if (raw.startsWith('data:')) {
    const match = raw.match(/^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ error: 'Format de média invalide' });
    const mimeType = match[1];
    if (mimeType !== mt) {
      return res.status(400).json({ error: 'Le type de média déclaré ne correspond pas au contenu' });
    }
    const b64 = match[3];
    const decodedBytes = Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
    if (decodedBytes > MAX_MEDIA_BYTES) {
      const label = mt === 'video' ? 'Vidéo' : 'Image';
      return res.status(400).json({ error: `${label} trop volumineuse (max 7 Mo)` });
    }
  } else if (!/^https?:\/\//.test(raw)) {
    return res.status(400).json({ error: 'Format de média invalide' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO gallery (image_url, title, description, display_order, media_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [image_url, title, description, display_order || 0, mt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

app.delete('/api/gallery/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM gallery WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// CLIENT PHOTOS (Vos retours en images)
// Submit a client photo (public)
app.post('/api/client-photos', publicFormLimiter, async (req, res) => {
  const { first_name, last_name, prestation_type, message, photos } = req.body;
  const error = firstError([
    validateName(first_name, { required: true, min: 2, max: 50, label: 'Prénom' }),
    validateName(last_name, { required: true, min: 1, max: 50, label: 'Nom' }),
    validateName(prestation_type, { required: true, min: 2, max: 50, label: 'Type de prestation' }),
    validateMessage(message, { required: false, max: 1000, label: 'Message' }),
  ]);
  if (error) return res.status(400).json({ error });
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return res.status(400).json({ error: 'Au moins une photo est requise' });
  }
  if (photos.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 photos' });
  }
  for (const photo of photos) {
    if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Format de photo invalide' });
    }
    if (photo.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Photo trop volumineuse (max 4 Mo)' });
    }
  }
  try {
    const result = await pool.query(
      'INSERT INTO client_photos (first_name, last_name, prestation_type, message, photos) VALUES ($1, $2, $3, $4, $5) RETURNING id, status, created_at',
      [first_name.trim(), last_name.trim(), prestation_type, message || null, photos]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting client photo:', err.message);
    respondError(req, res, err, 400);
  }
});

// Get approved client photos (public)
app.get('/api/client-photos/approved', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, prestation_type, message, created_at, array_length(photos, 1) as photo_count FROM client_photos WHERE status = 'approved' ORDER BY created_at DESC"
    );
    const base = `${req.protocol}://${req.get('host')}`;
    const rows = result.rows.map(r => ({
      ...r,
      photos: Array.from({ length: r.photo_count || 0 }, (_, i) => `${base}/api/client-photos/${r.id}/photo/${i}`),
    }));
    res.json(rows);
  } catch (err) {
    console.error('Error loading approved photos:', err.message);
    respondError(req, res, err, 500);
  }
});

// Get all client photos (admin)
app.get('/api/client-photos', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM client_photos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error loading client photos:', err.message);
    respondError(req, res, err, 500);
  }
});

// Update client photo (admin)
app.patch('/api/client-photos/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, message } = req.body;
  try {
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const updates = [];
    const values = [];
    let idx = 1;
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (message !== undefined) { updates.push(`message = $${idx++}`); values.push(message); }
    values.push(id);
    const result = await pool.query(
      `UPDATE client_photos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating client photo ${id}:`, err.message);
    respondError(req, res, err, 400);
  }
});

// Delete client photo (admin)
app.delete('/api/client-photos/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM client_photos WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    respondError(req, res, err, 400);
  }
});

// Serve client photo by index
app.get('/api/client-photos/:id/photo/:index', mediaLimiter, async (req, res) => {
  try {
    const idx = Number(req.params.index);
    if (!Number.isInteger(idx) || idx < 0) return res.status(400).end();
    const result = await pool.query('SELECT photos FROM client_photos WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).end();
    const photo = row.photos[idx];
    if (!photo) return res.status(404).end();
    const match = photo.match(/^data:(.+?);base64,(.+)$/);
    if (!match) return res.status(400).end();
    const buffer = Buffer.from(match[2], 'base64');
    res.set('Content-Type', match[1]);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err) {
    res.status(500).end();
  }
});

// Middleware d'erreur générique : journalise les détails côté serveur,
// ne renvoie jamais de message technique/SQL au client.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origine non autorisée' });
  }
  console.error(`[${req.method} ${req.originalUrl}] Erreur non gérée:`, err instanceof Error ? err.stack || err.message : String(err));
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

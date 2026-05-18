import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createReviewsTable() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'create_reviews_table.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Reviews table created successfully');
  } catch (err) {
    console.error('❌ Error creating reviews table:', err.message);
  } finally {
    await pool.end();
  }
}

createReviewsTable();

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

async function createFormationsTable() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'create_formations_table.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Formations table created successfully');
  } catch (err) {
    console.error('❌ Error creating formations table:', err.message);
  } finally {
    await pool.end();
  }
}

createFormationsTable();

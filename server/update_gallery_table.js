import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateGalleryTable() {
  try {
    await pool.query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'");
    console.log('✅ Gallery table updated successfully (added media_type)');
  } catch (err) {
    console.error('❌ Error updating gallery table:', err.message);
  } finally {
    await pool.end();
  }
}

updateGalleryTable();

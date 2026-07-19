import pg from 'pg';
import dotenv from 'dotenv';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_DIM = 1000;
const QUALITY = 70;

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function bufferToDataUrl(mime, buffer) {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function compressGalleryImages() {
  try {
    const { rows } = await pool.query("SELECT id, image_url, media_type FROM gallery WHERE image_url LIKE 'data:image%'");
    console.log(`🖼️  ${rows.length} image(s) à compresser...`);

    let done = 0;
    let skipped = 0;

    for (const row of rows) {
      const decoded = dataUrlToBuffer(row.image_url);
      if (!decoded) { skipped++; continue; }
      try {
        const buf = await sharp(decoded.buffer)
          .rotate()
          .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true })
          .toBuffer();

        const newDataUrl = bufferToDataUrl('image/jpeg', buf);
        await pool.query('UPDATE gallery SET image_url = $1 WHERE id = $2', [newDataUrl, row.id]);

        const oldKb = Math.round(decoded.buffer.length / 1024);
        const newKb = Math.round(buf.length / 1024);
        console.log(`  ✓ #${row.id} : ${oldKb}KB -> ${newKb}KB`);
        done++;
      } catch (err) {
        console.error(`  ✗ #${row.id} échec compression :`, err.message);
        skipped++;
      }
    }

    console.log(`✅ Terminé : ${done} compressée(s), ${skipped} ignorée(s).`);
  } catch (err) {
    console.error('❌ Erreur globale:', err.message);
  } finally {
    await pool.end();
  }
}

compressGalleryImages();

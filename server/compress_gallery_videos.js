import pg from 'pg';
import dotenv from 'dotenv';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';

dotenv.config();
const execFileAsync = promisify(execFile);

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function compressVideos() {
  try {
    const { rows } = await pool.query("SELECT id, image_url FROM gallery WHERE image_url LIKE 'data:video%'");
    console.log(`🎬 ${rows.length} vidéo(s) à compresser...`);

    for (const row of rows) {
      const decoded = dataUrlToBuffer(row.image_url);
      if (!decoded) continue;

      const inPath = path.join(os.tmpdir(), `gal_in_${row.id}.mp4`);
      const outPath = path.join(os.tmpdir(), `gal_out_${row.id}.mp4`);
      fs.writeFileSync(inPath, decoded.buffer);

      try {
        await execFileAsync(ffmpegPath, [
          '-y',
          '-i', inPath,
          '-vf', "scale='min(720,iw)':-2",
          '-c:v', 'libx264',
          '-preset', 'slow',
          '-crf', '30',
          '-c:a', 'aac',
          '-b:a', '96k',
          '-movflags', '+faststart',
          outPath,
        ]);

        const out = fs.readFileSync(outPath);
        const newDataUrl = `data:video/mp4;base64,${out.toString('base64')}`;
        await pool.query('UPDATE gallery SET image_url = $1 WHERE id = $2', [newDataUrl, row.id]);

        const oldKb = Math.round(decoded.buffer.length / 1024);
        const newKb = Math.round(out.length / 1024);
        console.log(`  ✓ #${row.id} : ${oldKb}KB -> ${newKb}KB`);
      } catch (err) {
        console.error(`  ✗ #${row.id} échec :`, err.message);
      } finally {
        fs.rmSync(inPath, { force: true });
        fs.rmSync(outPath, { force: true });
      }
    }

    console.log('✅ Terminé.');
  } catch (err) {
    console.error('❌ Erreur globale:', err.message);
  } finally {
    await pool.end();
  }
}

compressVideos();

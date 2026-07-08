import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ensureDatabase, ensureSchema, getPool, query } from './db.js';
import { SECTIONS } from './seedData.js';

dotenv.config();

// Seed sections + questions only if the sections table is empty.
export async function seedSurvey() {
  const rows = await query('SELECT COUNT(*) AS n FROM sections');
  if (rows[0].n > 0) return false;

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let sOrder = 0;
    for (const section of SECTIONS) {
      const [sRes] = await conn.execute(
        'INSERT INTO sections (code, title, description, sort_order) VALUES (?,?,?,?)',
        [section.code, section.title, section.description || null, sOrder++]
      );
      const sectionId = sRes.insertId;
      let qOrder = 0;
      for (const q of section.questions) {
        const normalized =
          typeof q === 'string'
            ? { text: q, type: 'likert', options: null, required: 1 }
            : q;
        const type = normalized.type || (section.likert ? 'likert' : 'text');
        const options = normalized.options ? JSON.stringify(normalized.options) : null;
        const required = normalized.required === undefined ? 1 : normalized.required;
        await conn.execute(
          'INSERT INTO questions (section_id, text, type, options, required, sort_order, active) VALUES (?,?,?,?,?,?,1)',
          [sectionId, normalized.text, type, options, required, qOrder++]
        );
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return true;
}

export async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const rows = await query('SELECT COUNT(*) AS n FROM admins');
  if (rows[0].n > 0) return false;
  const hash = await bcrypt.hash(password, 10);
  await query('INSERT INTO admins (username, password_hash) VALUES (?,?)', [username, hash]);
  return true;
}

// Allow running `npm run seed` standalone.
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  (async () => {
    await ensureDatabase();
    await ensureSchema();
    const s = await seedSurvey();
    const a = await seedAdmin();
    console.log(`Seed complete. survey=${s ? 'inserted' : 'skipped'} admin=${a ? 'created' : 'skipped'}`);
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

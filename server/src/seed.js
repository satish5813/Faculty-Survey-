import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ensureDatabase, ensureSchema, getPool, query } from './db.js';
import { SECTIONS, SEED_VERSION } from './seedData.js';

dotenv.config();

// Seed sections + questions. Re-seeds automatically when the content version changes
// (e.g. a new language): if the stored seed_version differs from SEED_VERSION, the
// existing survey data (and responses) are wiped and the new content is inserted.
export async function seedSurvey() {
  const verRows = await query('SELECT v FROM settings WHERE k = ?', ['seed_version']);
  const stored = verRows[0]?.v;
  const secRows = await query('SELECT COUNT(*) AS n FROM sections');
  if (stored === SEED_VERSION && secRows[0].n > 0) return false; // already current

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    // Wipe any previous content (safe content refresh — clears old questions/responses).
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('DELETE FROM answers');
    await conn.query('DELETE FROM responses');
    await conn.query('DELETE FROM questions');
    await conn.query('DELETE FROM sections');
    await conn.query('ALTER TABLE sections AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE questions AUTO_INCREMENT = 1');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

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
    await conn.query(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      ['seed_version', SEED_VERSION]
    );
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

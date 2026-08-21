import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ensureDatabase, ensureSchema, getPool, query } from './db.js';
import { SECTIONS, SEED_VERSION } from './seedData.js';

dotenv.config();

function normalizeQ(q, section) {
  const n = typeof q === 'string' ? { text: q, type: 'likert', options: null, required: 1 } : q;
  return {
    text: n.text,
    type: n.type || (section.likert ? 'likert' : 'text'),
    options: n.options ? JSON.stringify(n.options) : null,
    required: n.required === undefined ? 1 : n.required,
  };
}

// Fresh install: insert all sections + questions.
async function insertAll(conn) {
  let sOrder = 0;
  for (const section of SECTIONS) {
    const [sRes] = await conn.execute(
      'INSERT INTO sections (code, title, description, sort_order) VALUES (?,?,?,?)',
      [section.code, section.title, section.description || null, sOrder++]
    );
    const sectionId = sRes.insertId;
    let qOrder = 0;
    for (const q of section.questions) {
      const nq = normalizeQ(q, section);
      await conn.execute(
        'INSERT INTO questions (section_id, text, type, options, required, sort_order, active) VALUES (?,?,?,?,?,?,1)',
        [sectionId, nq.text, nq.type, nq.options, nq.required, qOrder++]
      );
    }
  }
}

// NON-DESTRUCTIVE content update: refresh question/section TEXT in place, matching by
// section code + question position, so question IDs (and therefore all existing responses
// and answers) are preserved. Never deletes responses/answers.
async function syncContent(conn) {
  const [existingSections] = await conn.query('SELECT id, code FROM sections');
  const byCode = new Map(existingSections.map((s) => [s.code, s]));
  let sOrder = 0;
  for (const section of SECTIONS) {
    const ex = byCode.get(section.code);
    if (!ex) continue; // section not present in this DB — skip (avoid duplicating)
    await conn.execute('UPDATE sections SET title = ?, description = ?, sort_order = ? WHERE id = ?', [
      section.title,
      section.description || null,
      sOrder++,
      ex.id,
    ]);
    const [exQs] = await conn.query('SELECT id FROM questions WHERE section_id = ? ORDER BY sort_order, id', [ex.id]);
    const normQs = section.questions.map((q) => normalizeQ(q, section));
    // Only remap text when the question count matches exactly, so answers stay correctly linked.
    if (exQs.length === normQs.length) {
      for (let i = 0; i < normQs.length; i++) {
        const nq = normQs[i];
        await conn.execute(
          'UPDATE questions SET text = ?, type = ?, options = ?, required = ?, sort_order = ?, active = 1 WHERE id = ?',
          [nq.text, nq.type, nq.options, nq.required, i, exQs[i].id]
        );
      }
    }
  }
}

// Seeds on a fresh DB; otherwise refreshes content NON-DESTRUCTIVELY (responses are never deleted).
export async function seedSurvey() {
  const verRows = await query('SELECT v FROM settings WHERE k = ?', ['seed_version']);
  const stored = verRows[0]?.v;
  const secRows = await query('SELECT COUNT(*) AS n FROM sections');
  const empty = secRows[0].n === 0;
  if (!empty && stored === SEED_VERSION) return false; // already up to date

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    if (empty) {
      await insertAll(conn);
    } else {
      await syncContent(conn); // preserves all responses/answers
    }
    await conn.query(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      ['seed_version', SEED_VERSION]
    );
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
    console.log(`Seed complete. survey=${s ? 'updated' : 'skipped'} admin=${a ? 'created' : 'skipped'}`);
    process.exit(0);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

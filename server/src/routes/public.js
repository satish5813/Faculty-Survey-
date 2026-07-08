import { Router } from 'express';
import { getPool, query } from '../db.js';
import { INTRO } from '../seedData.js';

const router = Router();

function parseOptions(row) {
  let options = null;
  if (row.options) {
    options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
  }
  return options;
}

// GET /api/survey - full structure with only active questions
router.get('/survey', async (req, res, next) => {
  try {
    const sections = await query('SELECT * FROM sections ORDER BY sort_order, id');
    const questions = await query(
      'SELECT * FROM questions WHERE active = 1 ORDER BY sort_order, id'
    );
    const bySection = {};
    for (const q of questions) {
      (bySection[q.section_id] ||= []).push({
        id: q.id,
        text: q.text,
        type: q.type,
        options: parseOptions(q),
        required: !!q.required,
      });
    }
    const payload = sections
      .map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        description: s.description,
        questions: bySection[s.id] || [],
      }))
      .filter((s) => s.questions.length > 0);
    res.json({ intro: INTRO, sections: payload });
  } catch (err) {
    next(err);
  }
});

// POST /api/responses - submit a survey response
// body: { answers: { [questionId]: value } }
router.post('/responses', async (req, res, next) => {
  const { answers } = req.body || {};
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'answers object is required' });
  }
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    // Load valid active questions to validate against
    const [qRows] = await conn.query(
      'SELECT id, section_id, type FROM questions WHERE active = 1'
    );
    const qMap = new Map(qRows.map((q) => [q.id, q]));

    await conn.beginTransaction();
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().slice(0, 60);
    const ua = (req.headers['user-agent'] || '').toString().slice(0, 400);
    const [rRes] = await conn.execute(
      'INSERT INTO responses (ip, user_agent) VALUES (?,?)',
      [ip, ua]
    );
    const responseId = rRes.insertId;

    const rows = [];
    for (const [qid, raw] of Object.entries(answers)) {
      const q = qMap.get(Number(qid));
      if (!q) continue; // ignore unknown/inactive questions
      if (raw === null || raw === undefined || raw === '') continue;
      const value = String(raw).slice(0, 4000);
      let numeric = null;
      if (q.type === 'likert' || q.type === 'stars') {
        const n = Number(raw);
        if (!Number.isNaN(n)) numeric = n;
      }
      rows.push([responseId, q.id, q.section_id, value, numeric]);
    }

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'No valid answers submitted' });
    }

    await conn.query(
      'INSERT INTO answers (response_id, question_id, section_id, value, numeric_value) VALUES ?',
      [rows]
    );
    await conn.commit();
    res.status(201).json({ ok: true, responseId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

export default router;

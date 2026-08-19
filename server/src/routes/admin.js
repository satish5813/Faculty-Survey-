import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, query } from '../db.js';
import { requireAdmin, signToken } from '../auth.js';

const router = Router();

const VALID_TYPES = ['text', 'single_choice', 'dropdown', 'likert', 'stars', 'open'];

function parseOptions(row) {
  if (!row.options) return null;
  return typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
}

/* ---------------- Auth ---------------- */

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const rows = await query('SELECT * FROM admins WHERE username = ?', [username]);
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: admin.id, username: admin.username });
    res.json({ token, username: admin.username });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

router.post('/change-password', requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const rows = await query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];
    const ok = await bcrypt.compare(currentPassword || '', admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Sections ---------------- */

router.get('/sections', requireAdmin, async (req, res, next) => {
  try {
    const sections = await query('SELECT * FROM sections ORDER BY sort_order, id');
    const questions = await query('SELECT * FROM questions ORDER BY sort_order, id');
    const counts = await query('SELECT question_id, COUNT(*) AS n FROM answers GROUP BY question_id');
    const countMap = new Map(counts.map((c) => [c.question_id, c.n]));
    const bySection = {};
    for (const q of questions) {
      (bySection[q.section_id] ||= []).push({
        id: q.id,
        section_id: q.section_id,
        text: q.text,
        type: q.type,
        options: parseOptions(q),
        required: !!q.required,
        active: !!q.active,
        sort_order: q.sort_order,
        response_count: countMap.get(q.id) || 0,
      });
    }
    res.json(
      sections.map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        description: s.description,
        sort_order: s.sort_order,
        questions: bySection[s.id] || [],
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/sections', requireAdmin, async (req, res, next) => {
  try {
    const { code, title, description } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const max = await query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM sections');
    const [r] = await getPool().execute(
      'INSERT INTO sections (code, title, description, sort_order) VALUES (?,?,?,?)',
      [code || '', title, description || null, max[0].m + 1]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    next(err);
  }
});

router.put('/sections/:id', requireAdmin, async (req, res, next) => {
  try {
    const { code, title, description } = req.body || {};
    await query('UPDATE sections SET code = ?, title = ?, description = ? WHERE id = ?', [
      code || '',
      title,
      description || null,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/sections/:id', requireAdmin, async (req, res, next) => {
  try {
    await query('DELETE FROM sections WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Questions ---------------- */

router.post('/questions', requireAdmin, async (req, res, next) => {
  try {
    const { section_id, text, type, options, required } = req.body || {};
    if (!section_id || !text) return res.status(400).json({ error: 'section_id and text are required' });
    const qType = VALID_TYPES.includes(type) ? type : 'likert';
    const opts = Array.isArray(options) && options.length ? JSON.stringify(options) : null;
    const max = await query('SELECT COALESCE(MAX(sort_order), -1) AS m FROM questions WHERE section_id = ?', [section_id]);
    const [r] = await getPool().execute(
      'INSERT INTO questions (section_id, text, type, options, required, sort_order, active) VALUES (?,?,?,?,?,?,1)',
      [section_id, text, qType, opts, required ? 1 : 0, max[0].m + 1]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    next(err);
  }
});

router.put('/questions/:id', requireAdmin, async (req, res, next) => {
  try {
    const { text, type, options, required, active, section_id } = req.body || {};
    const existing = (await query('SELECT * FROM questions WHERE id = ?', [req.params.id]))[0];
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    const qType = type !== undefined ? (VALID_TYPES.includes(type) ? type : existing.type) : existing.type;
    let opts = existing.options;
    if (options !== undefined) opts = Array.isArray(options) && options.length ? JSON.stringify(options) : null;
    await query(
      'UPDATE questions SET section_id = ?, text = ?, type = ?, options = ?, required = ?, active = ? WHERE id = ?',
      [
        section_id ?? existing.section_id,
        text ?? existing.text,
        qType,
        opts,
        required !== undefined ? (required ? 1 : 0) : existing.required,
        active !== undefined ? (active ? 1 : 0) : existing.active,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Delete: hard-delete if no responses exist, otherwise soft-deactivate to preserve data.
router.delete('/questions/:id', requireAdmin, async (req, res, next) => {
  try {
    const cnt = await query('SELECT COUNT(*) AS n FROM answers WHERE question_id = ?', [req.params.id]);
    if (cnt[0].n > 0) {
      await query('UPDATE questions SET active = 0 WHERE id = ?', [req.params.id]);
      return res.json({ ok: true, softDeleted: true, message: 'Question had responses; hidden instead of deleted to preserve data.' });
    }
    await query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ ok: true, softDeleted: false });
  } catch (err) {
    next(err);
  }
});

// Reorder: body { order: [{id, sort_order}, ...] }
router.post('/questions/reorder', requireAdmin, async (req, res, next) => {
  try {
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      for (const item of order) {
        await conn.execute('UPDATE questions SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Responses ---------------- */

router.get('/responses', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;
    const totalRow = await query('SELECT COUNT(*) AS n FROM responses');
    const total = totalRow[0].n;
    const responses = await query(
      `SELECT r.id, r.submitted_at,
        (SELECT a.value FROM answers a JOIN questions q ON a.question_id = q.id
           WHERE a.response_id = r.id AND q.type = 'text' ORDER BY q.sort_order LIMIT 1) AS name,
        (SELECT ROUND(AVG(a.numeric_value),2) FROM answers a
           WHERE a.response_id = r.id AND a.numeric_value IS NOT NULL) AS avg_score
       FROM responses r
       ORDER BY r.submitted_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`
    );
    res.json({ total, page, pageSize, responses });
  } catch (err) {
    next(err);
  }
});

router.get('/responses/:id', requireAdmin, async (req, res, next) => {
  try {
    const resp = (await query('SELECT * FROM responses WHERE id = ?', [req.params.id]))[0];
    if (!resp) return res.status(404).json({ error: 'Not found' });
    const answers = await query(
      `SELECT a.question_id, a.value, a.numeric_value, q.text, q.type, s.title AS section_title, s.sort_order AS s_order, q.sort_order AS q_order
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN sections s ON q.section_id = s.id
       WHERE a.response_id = ?
       ORDER BY s.sort_order, q.sort_order`,
      [req.params.id]
    );
    res.json({ ...resp, answers });
  } catch (err) {
    next(err);
  }
});

router.delete('/responses/:id', requireAdmin, async (req, res, next) => {
  try {
    await query('DELETE FROM responses WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Analytics ---------------- */

router.get('/analytics', requireAdmin, async (req, res, next) => {
  try {
    const totalRow = await query('SELECT COUNT(*) AS n FROM responses');
    const totalResponses = totalRow[0].n;

    // Per-question averages for likert & stars
    const scored = await query(
      `SELECT q.id, q.text, q.type, s.title AS section_title, s.code AS section_code, s.sort_order AS s_order, q.sort_order AS q_order,
        ROUND(AVG(a.numeric_value),2) AS avg, COUNT(a.id) AS n
       FROM questions q
       JOIN sections s ON q.section_id = s.id
       LEFT JOIN answers a ON a.question_id = q.id AND a.numeric_value IS NOT NULL
       WHERE q.type IN ('likert','stars')
       GROUP BY q.id
       ORDER BY s.sort_order, q.sort_order`
    );

    // Section-level averages (likert/stars only)
    const sectionAgg = await query(
      `SELECT s.id, s.code, s.title, s.sort_order,
         ROUND(AVG(a.numeric_value),2) AS avg, COUNT(a.id) AS n
       FROM sections s
       JOIN questions q ON q.section_id = s.id AND q.type IN ('likert','stars')
       LEFT JOIN answers a ON a.question_id = q.id AND a.numeric_value IS NOT NULL
       GROUP BY s.id
       HAVING n > 0
       ORDER BY s.sort_order`
    );

    // Choice distributions for single_choice / dropdown
    const choiceRows = await query(
      `SELECT q.id AS question_id, q.text, s.title AS section_title, a.value, COUNT(*) AS n
       FROM questions q
       JOIN sections s ON q.section_id = s.id
       JOIN answers a ON a.question_id = q.id
       WHERE q.type IN ('single_choice','dropdown')
       GROUP BY q.id, a.value
       ORDER BY s.sort_order, q.sort_order, n DESC`
    );
    const choiceMap = {};
    for (const r of choiceRows) {
      (choiceMap[r.question_id] ||= { question_id: r.question_id, text: r.text, section_title: r.section_title, distribution: [] })
        .distribution.push({ value: r.value, count: r.n });
    }

    // Open-ended responses
    const openRows = await query(
      `SELECT q.id AS question_id, q.text, a.value, a.response_id
       FROM questions q
       JOIN answers a ON a.question_id = q.id
       WHERE q.type = 'open' AND a.value <> ''
       ORDER BY q.sort_order, a.response_id DESC`
    );
    const openMap = {};
    for (const r of openRows) {
      (openMap[r.question_id] ||= { question_id: r.question_id, text: r.text, answers: [] })
        .answers.push({ value: r.value, response_id: r.response_id });
    }

    // Responses over time (last 30 days)
    const timeline = await query(
      `SELECT DATE(submitted_at) AS day, COUNT(*) AS n
       FROM responses
       WHERE submitted_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(submitted_at)
       ORDER BY day`
    );

    res.json({
      totalResponses,
      questions: scored,
      sections: sectionAgg,
      choices: Object.values(choiceMap),
      open: Object.values(openMap),
      timeline,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------- Department report ---------------- */

// Department-wise, section-wise average scores (likert/stars questions only),
// for the printable PDF report. A response's department is its answer to the
// "Department" question; responses without one fall under "Not Specified".
router.get('/report', requireAdmin, async (req, res, next) => {
  try {
    const totalRow = await query('SELECT COUNT(*) AS n FROM responses');

    const sections = await query(
      `SELECT DISTINCT s.id, s.code, s.title, s.sort_order
       FROM sections s
       JOIN questions q ON q.section_id = s.id AND q.type IN ('likert','stars')
       ORDER BY s.sort_order`
    );

    const deptOf = `(SELECT a.value FROM answers a JOIN questions q ON a.question_id = q.id
                     WHERE q.text = 'Department' AND a.response_id = r.id LIMIT 1)`;

    // Responses per department
    const deptCounts = await query(
      `SELECT COALESCE(${deptOf}, 'Not Specified') AS department, COUNT(*) AS n
       FROM responses r GROUP BY department ORDER BY n DESC, department`
    );

    // Department x Section score cells
    const cells = await query(
      `SELECT COALESCE(${deptOf}, 'Not Specified') AS department,
              s.id AS section_id, ROUND(AVG(a.numeric_value),2) AS avg, COUNT(a.id) AS n
       FROM responses r
       JOIN answers a ON a.response_id = r.id AND a.numeric_value IS NOT NULL
       JOIN questions q2 ON a.question_id = q2.id AND q2.type IN ('likert','stars')
       JOIN sections s ON q2.section_id = s.id
       GROUP BY department, s.id`
    );

    // Overall per-section averages (all departments together)
    const sectionAvgs = await query(
      `SELECT s.id AS section_id, ROUND(AVG(a.numeric_value),2) AS avg, COUNT(a.id) AS n
       FROM sections s
       JOIN questions q ON q.section_id = s.id AND q.type IN ('likert','stars')
       JOIN answers a ON a.question_id = q.id AND a.numeric_value IS NOT NULL
       GROUP BY s.id`
    );

    res.json({
      generatedAt: new Date().toISOString(),
      totalResponses: totalRow[0].n,
      sections,
      departments: deptCounts,
      cells,
      sectionAvgs,
    });
  } catch (err) {
    next(err);
  }
});

// Full detail for the Excel / PDF reports: every section, question, response and answer.
// The client aggregates faculty-wise / section-wise / question-wise views from this.
router.get('/report/detail', requireAdmin, async (req, res, next) => {
  try {
    const sections = await query('SELECT id, code, title, sort_order FROM sections ORDER BY sort_order, id');
    const questions = await query('SELECT id, section_id, text, type, sort_order, active FROM questions ORDER BY sort_order, id');
    const responses = await query('SELECT id, submitted_at FROM responses ORDER BY id');
    const answers = await query('SELECT response_id, question_id, value, numeric_value FROM answers');
    res.json({ generatedAt: new Date().toISOString(), sections, questions, responses, answers });
  } catch (err) {
    next(err);
  }
});

/* ---------------- CSV export ---------------- */

router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const questions = await query('SELECT q.id, q.text FROM questions q ORDER BY q.section_id, q.sort_order');
    const responses = await query('SELECT id, submitted_at FROM responses ORDER BY submitted_at');
    const answers = await query('SELECT response_id, question_id, value FROM answers');
    const ansMap = new Map();
    for (const a of answers) ansMap.set(`${a.response_id}:${a.question_id}`, a.value);

    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };

    const header = ['Response ID', 'Submitted At', ...questions.map((q) => q.text)];
    const lines = [header.map(esc).join(',')];
    for (const r of responses) {
      const row = [r.id, r.submitted_at, ...questions.map((q) => ansMap.get(`${r.id}:${q.id}`) || '')];
      lines.push(row.map(esc).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="klef_survey_responses.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

export default router;

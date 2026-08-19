import { api } from '../api.js';

const SCORED = ['likert', 'stars'];

// Fetches /admin/report/detail and shapes it into everything the Excel and PDF
// reports need: per-faculty rows, section stats, question stats and the
// department x section matrix.
export async function buildReportData() {
  const { generatedAt, sections, questions, responses, answers } = await api.getReportDetail();

  const secById = new Map(sections.map((s) => [s.id, s]));
  const secOrder = (q) => (secById.get(q.section_id)?.sort_order ?? 0) * 10000 + q.sort_order;
  const orderedQuestions = [...questions].sort((a, b) => secOrder(a) - secOrder(b));
  const qById = new Map(questions.map((q) => [q.id, q]));

  const scoredSections = sections.filter((s) =>
    questions.some((q) => q.section_id === s.id && SCORED.includes(q.type))
  );

  // Demographic questions (name = first short-text question)
  const nameQ = orderedQuestions.find((q) => q.type === 'text');
  const deptQ = questions.find((q) => q.text === 'Department');
  const desigQ = questions.find((q) => q.text === 'Title / Position / Designation');

  // Group answers by response
  const byResp = new Map();
  for (const a of answers) {
    if (!byResp.has(a.response_id)) byResp.set(a.response_id, []);
    byResp.get(a.response_id).push(a);
  }

  // One row per faculty response
  const rows = responses.map((r) => {
    const ans = byResp.get(r.id) || [];
    const answerMap = {};
    const secSum = {};
    const secN = {};
    let sum = 0;
    let n = 0;
    for (const a of ans) {
      answerMap[a.question_id] = a.value;
      const q = qById.get(a.question_id);
      if (q && SCORED.includes(q.type) && a.numeric_value != null) {
        secSum[q.section_id] = (secSum[q.section_id] || 0) + a.numeric_value;
        secN[q.section_id] = (secN[q.section_id] || 0) + 1;
        sum += a.numeric_value;
        n += 1;
      }
    }
    const sectionAvgs = {};
    for (const s of scoredSections) sectionAvgs[s.id] = secN[s.id] ? secSum[s.id] / secN[s.id] : null;
    return {
      id: r.id,
      submitted_at: r.submitted_at,
      name: (nameQ && answerMap[nameQ.id]) || '',
      department: (deptQ && answerMap[deptQ.id]) || 'Not Specified',
      designation: (desigQ && answerMap[desigQ.id]) || '',
      sectionAvgs,
      overall: n ? sum / n : null,
      answers: answerMap,
    };
  });

  // Question-wise stats (scored questions only)
  const qAgg = new Map();
  for (const a of answers) {
    const q = qById.get(a.question_id);
    if (!q || !SCORED.includes(q.type) || a.numeric_value == null) continue;
    const g = qAgg.get(q.id) || { sum: 0, n: 0 };
    g.sum += a.numeric_value;
    g.n += 1;
    qAgg.set(q.id, g);
  }
  const questionStats = orderedQuestions
    .filter((q) => SCORED.includes(q.type))
    .map((q) => {
      const g = qAgg.get(q.id);
      return {
        id: q.id,
        section: secById.get(q.section_id),
        text: q.text,
        avg: g ? g.sum / g.n : null,
        n: g ? g.n : 0,
      };
    });

  // Section overall stats
  const sectionStats = scoredSections.map((s) => {
    let sum = 0;
    let n = 0;
    for (const st of questionStats) {
      if (st.section.id === s.id && st.avg != null) {
        sum += st.avg * st.n;
        n += st.n;
      }
    }
    return { ...s, avg: n ? sum / n : null, n };
  });

  // Department x Section matrix
  const respDept = new Map(rows.map((r) => [r.id, r.department]));
  const deptCell = new Map(); // "dept||sectionId" -> {sum, n}
  for (const a of answers) {
    const q = qById.get(a.question_id);
    if (!q || !SCORED.includes(q.type) || a.numeric_value == null) continue;
    const key = `${respDept.get(a.response_id)}||${q.section_id}`;
    const g = deptCell.get(key) || { sum: 0, n: 0 };
    g.sum += a.numeric_value;
    g.n += 1;
    deptCell.set(key, g);
  }
  const deptCounts = new Map();
  for (const r of rows) deptCounts.set(r.department, (deptCounts.get(r.department) || 0) + 1);
  const departments = [...deptCounts.entries()]
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const cellAvg = (dept, sectionId) => {
    const g = deptCell.get(`${dept}||${sectionId}`);
    return g ? g.sum / g.n : null;
  };
  const deptOverall = (dept) => {
    let sum = 0;
    let n = 0;
    for (const s of scoredSections) {
      const g = deptCell.get(`${dept}||${s.id}`);
      if (g) {
        sum += g.sum;
        n += g.n;
      }
    }
    return n ? sum / n : null;
  };

  return {
    generatedAt,
    totalResponses: responses.length,
    sections,
    orderedQuestions,
    scoredSections,
    rows,
    questionStats,
    sectionStats,
    departments,
    cellAvg,
    deptOverall,
  };
}

export const fmt = (v) => (v == null ? '—' : Number(v).toFixed(2));

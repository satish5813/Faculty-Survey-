import { api } from '../api.js';

const SCORED = ['likert', 'stars'];

// English-only version of a bilingual "English\nTelugu" / "English / తెలుగు" string.
// PDF fonts can't render Telugu, and the analysis report is produced in English.
export const en = (t) =>
  String(t ?? '')
    .split('\n')[0]
    .replace(/[ఀ-౿]+/g, '')
    .replace(/\s*\/\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/* ---------- lightweight lexicon sentiment (NLP) for open-ended comments ---------- */
const POS_WORDS = new Set(
  'good great excellent supportive support satisfied satisfying happy appreciate appreciated appreciation helpful respect respected respectful motivated motivating proud positive best love friendly encouraging encourage transparent fair fairly valued value comfortable opportunity opportunities growth grateful thankful wonderful amazing collaborative collaboration teamwork strong healthy caring care flexible recognition recognized trust belonging inspired nice smooth clear improved improving welcoming professional cooperative safe enjoy enjoyable excellent excellence balanced'.split(
      ' '
    )
);
const NEG_WORDS = new Set(
  'bad poor worst unfair biased bias stress stressful overload overloaded burden lack lacking insufficient delay delayed delays problem problems issue issues difficult difficulty unclear favoritism favouritism politics workload overwork pressure inadequate ignored overlooked disrespect disrespected unhappy dissatisfied concern concerns toxic partial partiality discrimination harassment lower worse worried frustrated frustrating demotivated demotivating neglected unsupported painful hard tough shortage unprofessional slow poorly limited insecure fear unsafe imbalance'.split(
      ' '
    )
);
const NEGATORS = new Set(['not', 'no', 'never', 'dont', 'cannot', 'cant', 'without', 'hardly', 'lack']);

export function analyzeSentiment(text) {
  const tokens = String(text || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  let score = 0;
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    const neg = i > 0 && NEGATORS.has(tokens[i - 1]);
    if (POS_WORDS.has(w)) score += neg ? -1 : 1;
    else if (NEG_WORDS.has(w)) score += neg ? 1 : -1;
  }
  const label = score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
  return { score, label };
}

// Fetches /admin/report/detail and shapes it into everything the Excel and PDF
// reports need: per-faculty rows, section stats, question stats and the
// department x section matrix.
export async function buildReportData() {
  const { generatedAt, sections, questions, responses, answers } = await api.getReportDetail();

  const secById = new Map(sections.map((s) => [s.id, s]));
  const secOrder = (q) => (secById.get(q.section_id)?.sort_order ?? 0) * 10000 + q.sort_order;
  const orderedQuestions = [...questions].sort((a, b) => secOrder(a) - secOrder(b));
  const qById = new Map(questions.map((q) => [q.id, q]));

  const scoredSections = sections
    .filter((s) => questions.some((q) => q.section_id === s.id && SCORED.includes(q.type)))
    .map((s) => ({ ...s, title: en(s.title) }));

  // Demographic questions (matched by the English label prefix so bilingual
  // "Department\nశాఖ" text still resolves).
  const nameQ = orderedQuestions.find((q) => q.type === 'text');
  const deptQ = questions.find((q) => /^\s*Department\b/i.test(q.text));
  const desigQ = questions.find((q) => /^\s*Title\s*\/\s*Position/i.test(q.text));

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
      email: r.email || '',
      name: (nameQ && answerMap[nameQ.id]) || '',
      department: (deptQ && answerMap[deptQ.id]) || 'Not Specified',
      designation: (desigQ && answerMap[desigQ.id]) || '',
      sectionAvgs,
      overall: n ? sum / n : null,
      scoredCount: n,
      answerCount: Object.keys(answerMap).length,
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
      const sec = secById.get(q.section_id);
      return {
        id: q.id,
        section: { ...sec, title: en(sec?.title) },
        text: en(q.text),
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

  // Faculty grouped under each department (best → lowest overall within a dept)
  const byDepartment = departments.map((d) => {
    const faculty = rows
      .filter((r) => r.department === d.name)
      .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
    const sectionAvgs = {};
    for (const s of scoredSections) sectionAvgs[s.id] = cellAvg(d.name, s.id);
    return { name: d.name, n: d.n, faculty, sectionAvgs, overall: deptOverall(d.name) };
  });

  // University-wide summary
  const overallUniversity = (() => {
    let sum = 0;
    let n = 0;
    for (const st of sectionStats) if (st.avg != null) { sum += st.avg * st.n; n += st.n; }
    return n ? sum / n : null;
  })();
  const rankedSections = [...sectionStats].filter((s) => s.avg != null).sort((a, b) => b.avg - a.avg);
  const rankedDepts = [...byDepartment].filter((d) => d.overall != null).sort((a, b) => b.overall - a.overall);
  const universitySummary = {
    totalResponses: responses.length,
    withEmail: rows.filter((r) => r.email).length,
    departmentsCount: departments.length,
    overall: overallUniversity,
    strongest: rankedSections[0] || null,
    weakest: rankedSections[rankedSections.length - 1] || null,
    topDept: rankedDepts[0] || null,
    lowDept: rankedDepts[rankedDepts.length - 1] || null,
  };
  const analysis = buildAnalysis({ universitySummary, sectionStats });

  // Open-ended faculty comments, grouped by question, with sentiment (NLP) per comment.
  const openComments = orderedQuestions
    .filter((q) => q.type === 'open')
    .map((q) => ({
      text: en(q.text),
      items: rows
        .filter((r) => r.answers[q.id] && String(r.answers[q.id]).trim())
        .map((r) => {
          const value = String(r.answers[q.id]).trim();
          const s = analyzeSentiment(value);
          return { email: r.email, name: r.name, department: r.department, value, sentiment: s.label, sScore: s.score };
        }),
    }))
    .filter((o) => o.items.length);

  // Aggregate sentiment across all comments + representative samples
  const allComments = openComments.flatMap((oc) => oc.items.map((it) => ({ ...it, question: oc.text })));
  const commentSentiment = {
    total: allComments.length,
    positive: allComments.filter((c) => c.sentiment === 'Positive').length,
    negative: allComments.filter((c) => c.sentiment === 'Negative').length,
    neutral: allComments.filter((c) => c.sentiment === 'Neutral').length,
    samplesPositive: allComments.filter((c) => c.sentiment === 'Positive').sort((a, b) => b.sScore - a.sScore).slice(0, 6),
    samplesNegative: allComments.filter((c) => c.sentiment === 'Negative').sort((a, b) => a.sScore - b.sScore).slice(0, 6),
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
    openComments,
    commentSentiment,
    departments,
    byDepartment,
    universitySummary,
    analysis,
    cellAvg,
    deptOverall,
  };
}

export const fmt = (v) => (v == null ? '—' : Number(v).toFixed(2));

export const scoreBand = (v) =>
  v == null ? 'No data' : v >= 4 ? 'Very positive' : v >= 3.5 ? 'Positive' : v >= 3 ? 'Moderate' : v >= 2 ? 'Needs attention' : 'Critical';

// Plain-language interpretation of the results, returned as paragraphs.
function buildAnalysis({ universitySummary: u, sectionStats }) {
  if (!u.totalResponses) return ['No responses have been submitted yet, so no analysis is available.'];
  const band = (v) => scoreBand(v).toLowerCase();
  const paras = [];
  paras.push(
    `A total of ${u.totalResponses} faculty and staff across ${u.departmentsCount} department(s) completed the ` +
      `Employee Experience & Culture Survey. The overall institutional experience score is ${fmt(u.overall)} on a 1–5 ` +
      `scale, indicating a ${band(u.overall)} climate on the Great Place to Work dimensions.`
  );
  if (u.strongest && u.weakest && u.strongest.id !== u.weakest.id) {
    paras.push(
      `The strongest domain is "${u.strongest.title}" (${fmt(u.strongest.avg)}), a clear organisational strength. ` +
        `The lowest-scoring domain is "${u.weakest.title}" (${fmt(u.weakest.avg)}), which is the most important area to ` +
        `improve first.`
    );
  }
  if (u.topDept && u.lowDept && u.topDept.name !== u.lowDept.name) {
    paras.push(
      `Across departments, ${u.topDept.name} reports the most positive experience (${fmt(u.topDept.overall)}), while ` +
        `${u.lowDept.name} (${fmt(u.lowDept.overall)}) would benefit from focused leadership attention and follow-up.`
    );
  }
  const low = sectionStats.filter((s) => s.avg != null && s.avg < 3).map((s) => s.title);
  if (low.length) {
    paras.push(`Priority focus areas scoring below 3.0: ${low.join(', ')}. These warrant targeted action plans.`);
  } else {
    paras.push('Encouragingly, no domain scored below 3.0 — the institution has a broadly healthy culture to build on.');
  }
  return paras;
}

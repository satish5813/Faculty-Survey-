import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildReportData, fmt, scoreBand } from './reportData.js';

/* ---------- palette (light, professional) ---------- */
const BRAND = [79, 70, 229]; // indigo-600
const BRAND_D = [55, 48, 163]; // indigo-800
const DARK = [30, 27, 75]; // indigo-950 (headings)
const SLATE = [51, 65, 85]; // slate-700 (body)
const MUTED = [100, 116, 139]; // slate-500
const LINE = [226, 232, 240]; // slate-200 (soft borders)
const TRACK = [226, 232, 240]; // slate-200
const ALT = [248, 250, 253]; // near-white zebra
const HEAD_BG = [238, 242, 255]; // indigo-50 (LIGHT table header)
const HEAD_TX = [67, 56, 202]; // indigo-700 (header text)
const HEAD_LN = [199, 210, 254]; // indigo-200 (header border)
const GROUP_BG = [224, 231, 255]; // indigo-100 (group band)
const GROUP_TX = [55, 48, 163]; // indigo-800 (group text)
const GREEN = [16, 185, 129];
const RED = [244, 63, 94];

/* score → soft fill for table cells */
function scoreFill(v) {
  if (v == null || Number.isNaN(v)) return null;
  if (v >= 4) return [209, 250, 229];
  if (v >= 3) return [236, 252, 203];
  if (v >= 2) return [254, 243, 199];
  return [255, 228, 230];
}
/* score → strong bar color */
function barColor(v) {
  if (v == null) return [203, 213, 225];
  if (v >= 4) return [16, 185, 129]; // emerald-500
  if (v >= 3.5) return [132, 204, 22]; // lime-500
  if (v >= 3) return [245, 158, 11]; // amber-500
  if (v >= 2) return [249, 115, 22]; // orange-500
  return [244, 63, 94]; // rose-500
}

const colorScores = (fromCol) => (h) => {
  if (h.section === 'body' && h.column.index >= fromCol) {
    const fill = scoreFill(parseFloat(h.cell.raw));
    if (fill) {
      h.cell.styles.fillColor = fill;
      h.cell.styles.textColor = DARK;
      h.cell.styles.fontStyle = 'bold';
    }
  }
};

/* shared professional table styling: dark header, defined light-grey grid, zebra rows */
const tableBase = (marginX) => ({
  margin: { left: marginX, right: marginX, top: 64 },
  theme: 'grid',
  styles: { lineColor: LINE, lineWidth: 0.5, textColor: SLATE, cellPadding: 6, fontSize: 9 },
  headStyles: { fillColor: HEAD_BG, textColor: HEAD_TX, lineColor: HEAD_LN, lineWidth: 0.5, fontStyle: 'bold', fontSize: 9 },
  alternateRowStyles: { fillColor: ALT },
});

async function logoDataUrl() {
  try {
    const blob = await fetch('/logos/kl-logo.png').then((r) => (r.ok ? r.blob() : null));
    if (!blob) return null;
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function headerBand(doc, pageW, logo, totalResponses) {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setFillColor(...BRAND_D);
  doc.rect(0, 60, pageW, 3, 'F');
  if (logo) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(34, 12, 92, 38, 6, 6, 'F');
    try {
      doc.addImage(logo, 'PNG', 42, 16, 76, 30, undefined, 'FAST');
    } catch {
      /* ignore */
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Employee Experience & Culture Survey', pageW / 2, 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(224, 231, 255);
  doc.text('Faculty Feedback — Department & Domain Analysis Report', pageW / 2, 46, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generated ${new Date().toLocaleString()}    ·    ${totalResponses} responses    ·    all scores are averages on a 1–5 scale`,
    pageW / 2,
    77,
    { align: 'center' }
  );
}

function sectionTitle(doc, text, y, marginX) {
  doc.setFillColor(...BRAND);
  doc.rect(marginX, y - 11, 4.5, 15, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text(text, marginX + 12, y);
}

function statCard(doc, x, y, w, h, { value, label, sub, accent = BRAND }) {
  doc.setFillColor(...ALT);
  doc.setDrawColor(...HEAD_LN);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, w, h, 6, 6, 'FD');
  doc.setFillColor(...accent);
  doc.roundedRect(x, y, w, 5, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text(String(value), x + 12, y + 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(label, x + 12, y + 49);
  if (sub) {
    doc.setFontSize(8);
    doc.setTextColor(...accent);
    doc.text(String(sub).slice(0, 26), x + 12, y + 60);
  }
}

// Horizontal bar chart drawn with vector primitives. items: [{label, value}]
function hBarChart(doc, x, y, w, items, { max = 5, barH = 15, gap = 11, labelW = 96 } = {}) {
  const trackX = x + labelW;
  const trackW = w - labelW - 34;
  items.forEach((it, i) => {
    const cy = y + i * (barH + gap);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...SLATE);
    const label = it.label.length > 22 ? it.label.slice(0, 21) + '…' : it.label;
    doc.text(label, x, cy + barH * 0.72);
    doc.setFillColor(...TRACK);
    doc.roundedRect(trackX, cy, trackW, barH, barH / 2, barH / 2, 'F');
    const val = it.value == null ? 0 : it.value;
    const fw = Math.max(barH, (val / max) * trackW);
    doc.setFillColor(...barColor(it.value));
    doc.roundedRect(trackX, cy, fw, barH, barH / 2, barH / 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(it.value == null ? '—' : it.value.toFixed(2), trackX + trackW + 6, cy + barH * 0.72);
  });
  return y + items.length * (barH + gap);
}

// Pie chart drawn with vector primitives. segments: [{label, value, color:[r,g,b]}]
function pieChart(doc, cx, cy, r, segments) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const rad = (d) => (d * Math.PI) / 180;
  let a0 = -90;
  segments.forEach((seg) => {
    const sweep = (seg.value / total) * 360;
    const steps = Math.max(1, Math.ceil(sweep / 6));
    const pts = [[cx, cy]];
    for (let i = 0; i <= steps; i++) {
      const a = rad(a0 + (sweep * i) / steps);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const deltas = [];
    for (let i = 1; i < pts.length; i++) deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
    doc.setFillColor(...seg.color);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.2);
    doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'FD', true);
    a0 += sweep;
  });
}

// Legend for a pie chart. segments: [{label, value, color}]
function pieLegend(doc, x, y, segments, total) {
  segments.forEach((seg, i) => {
    const ly = y + i * 16;
    doc.setFillColor(...seg.color);
    doc.roundedRect(x, ly - 7, 10, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    const pct = total ? Math.round((seg.value / total) * 100) : 0;
    doc.text(`${seg.label}`, x + 16, ly);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(`${seg.value} (${pct}%)`, x + 190, ly, { align: 'right' });
  });
}

// A titled card listing sample comments (used for Positive Highlights / Areas of Concern).
function commentCards(doc, x, y, w, title, color, items) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, w, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`${title}  (${items.length})`, x + 10, y + 15);
  let cy = y + 36;
  const maxY = doc.internal.pageSize.getHeight() - 42;
  if (!items.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text('None identified.', x + 14, cy);
    return;
  }
  for (const it of items) {
    if (cy > maxY - 20) break;
    doc.setFillColor(...color);
    doc.circle(x + 6, cy - 3, 1.6, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    const lines = doc.splitTextToSize(`"${it.value}"`, w - 24);
    doc.text(lines, x + 14, cy);
    cy += lines.length * 10.5;
    if (it.department && it.department !== 'Not Specified') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(`— ${it.department}`, x + 14, cy + 2);
      cy += 10;
    }
    cy += 9;
  }
}

const BANDS = [
  { label: 'Very positive (4-5)', color: [16, 185, 129], test: (v) => v >= 4 },
  { label: 'Positive (3.5-4)', color: [132, 204, 22], test: (v) => v >= 3.5 && v < 4 },
  { label: 'Moderate (3-3.5)', color: [245, 158, 11], test: (v) => v >= 3 && v < 3.5 },
  { label: 'Needs attention (2-3)', color: [249, 115, 22], test: (v) => v >= 2 && v < 3 },
  { label: 'Critical (below 2)', color: [244, 63, 94], test: (v) => v != null && v < 2 },
];

export async function downloadDepartmentReport() {
  const data = await buildReportData();
  const logo = await logoDataUrl();
  const doc = buildReportDoc(data, logo);
  doc.save('KLEF_Survey_Report.pdf');
}

// Pure builder (no fetch / no download) so it can be rendered anywhere for preview/testing.
export function buildReportDoc(data, logo) {
  const {
    scoredSections, sectionStats, questionStats, departments, cellAvg, deptOverall, totalResponses,
    universitySummary: U, analysis, byDepartment, openComments = [], rows = [],
    commentSentiment = { total: 0, positive: 0, negative: 0, neutral: 0, samplesPositive: [], samplesNegative: [] },
  } = data;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentW = pageW - marginX * 2;

  /* ================= PAGE 1 — Executive dashboard ================= */
  headerBand(doc, pageW, logo, totalResponses);

  // Metric cards
  const cardY = 92;
  const cardH = 66;
  const gap = 14;
  const cardW = (contentW - gap * 3) / 4;
  statCard(doc, marginX, cardY, cardW, cardH, { value: U.totalResponses, label: 'Total Responses', sub: `${U.withEmail} with email`, accent: BRAND });
  statCard(doc, marginX + (cardW + gap), cardY, cardW, cardH, { value: U.departmentsCount, label: 'Departments', accent: [124, 58, 237] });
  statCard(doc, marginX + (cardW + gap) * 2, cardY, cardW, cardH, { value: fmt(U.overall), label: 'Overall Score / 5', sub: scoreBand(U.overall), accent: [217, 119, 6] });
  statCard(doc, marginX + (cardW + gap) * 3, cardY, cardW, cardH, { value: U.strongest ? fmt(U.strongest.avg) : '—', label: 'Top Domain', sub: U.strongest?.title, accent: [5, 150, 105] });

  // Two columns: analysis (left) + domain chart (right)
  const colY = 186;
  const leftW = 372;
  const rightX = marginX + leftW + 26;
  const rightW = contentW - leftW - 26;

  sectionTitle(doc, 'Executive Summary & Analysis', colY, marginX);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  let ay = colY + 20;
  for (const p of analysis) {
    const lines = doc.splitTextToSize(p, leftW);
    doc.text(lines, marginX, ay);
    ay += lines.length * 13 + 8;
  }

  sectionTitle(doc, 'Domain Scores (1–5)', colY, rightX);
  hBarChart(
    doc,
    rightX,
    colY + 16,
    rightW,
    sectionStats.map((s) => ({ label: s.title, value: s.avg })),
    { labelW: 92 }
  );

  // Faculty performance distribution — pie chart (lower area of page 1)
  const bandSegs = BANDS.map((b) => ({
    label: b.label,
    color: b.color,
    value: rows.filter((r) => b.test(r.overall)).length,
  })).filter((s) => s.value > 0);
  if (bandSegs.length) {
    const pieY = 396;
    sectionTitle(doc, 'Faculty Performance Distribution', pieY, marginX);
    pieChart(doc, marginX + 78, pieY + 84, 58, bandSegs);
    pieLegend(doc, marginX + 175, pieY + 44, bandSegs, rows.length);
  }

  /* ================= PAGE 2 — Department analysis ================= */
  doc.addPage();
  sectionTitle(doc, '1. Department Comparison — Overall Experience', 44, marginX);
  const deptChartItems = byDepartment.slice(0, 12).map((d) => ({ label: d.name, value: d.overall }));
  const chartEndY = hBarChart(doc, marginX, 58, contentW, deptChartItems, { labelW: 200, barH: 14, gap: 9 });

  sectionTitle(doc, '2. Department × Domain Scores', chartEndY + 30, marginX);
  autoTable(doc, {
    ...tableBase(marginX),
    startY: chartEndY + 40,
    head: [['Department', 'Resp.', ...scoredSections.map((s) => s.code || s.title), 'Overall']],
    body: departments.map((d) => [
      d.name,
      d.n,
      ...scoredSections.map((s) => fmt(cellAvg(d.name, s.id))),
      fmt(deptOverall(d.name)),
    ]),
    styles: { ...tableBase(marginX).styles, fontSize: 8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 170 }, 1: { cellWidth: 44 } },
    didParseCell: colorScores(2),
  });

  /* ================= PAGE 3 — Section & question detail ================= */
  doc.addPage();
  sectionTitle(doc, '3. Overall Domain Scores', 44, marginX);
  autoTable(doc, {
    ...tableBase(marginX),
    startY: 54,
    head: [['Code', 'Domain', 'Average / 5', 'Rating', 'Answers']],
    body: sectionStats.map((s) => [s.code || '—', s.title, fmt(s.avg), scoreBand(s.avg), s.n]),
    columnStyles: {
      0: { cellWidth: 50, halign: 'center' },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 90 },
      3: { halign: 'center', cellWidth: 100 },
      4: { halign: 'center', cellWidth: 70 },
    },
    didParseCell: colorScores(2),
  });

  sectionTitle(doc, '4. Question-wise Average Scores', doc.lastAutoTable.finalY + 30, marginX);
  const qBody = [];
  let lastSecId = null;
  for (const st of questionStats) {
    if (st.section.id !== lastSecId) {
      qBody.push([
        {
          content: `${st.section.code ? st.section.code + ' — ' : ''}${st.section.title}`,
          colSpan: 3,
          styles: { fillColor: GROUP_BG, textColor: GROUP_TX, fontStyle: 'bold', halign: 'left', fontSize: 9 },
        },
      ]);
      lastSecId = st.section.id;
    }
    qBody.push([st.text, fmt(st.avg), st.n]);
  }
  autoTable(doc, {
    ...tableBase(marginX),
    startY: doc.lastAutoTable.finalY + 40,
    head: [['Question', 'Average / 5', 'Answers']],
    body: qBody,
    styles: { ...tableBase(marginX).styles, fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold', cellWidth: 90 }, 2: { halign: 'center', cellWidth: 70 } },
    didParseCell: colorScores(1),
  });

  /* ================= PAGE 4+ — Faculty by department ================= */
  doc.addPage();
  sectionTitle(doc, '5. Faculty Responses by Department', 44, marginX);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('Faculty grouped under their department. Email identifies each respondent.', marginX, 58);

  const nCols = scoredSections.length + 4;
  const facBody = [];
  for (const d of byDepartment) {
    facBody.push([
      {
        content: `${d.name}   —   ${d.n} respondent(s)   ·   Overall ${fmt(d.overall)} / 5`,
        colSpan: nCols,
        styles: { fillColor: GROUP_BG, textColor: GROUP_TX, fontStyle: 'bold', halign: 'left', fontSize: 9 },
      },
    ]);
    for (const f of d.faculty) {
      facBody.push([
        f.email || '(no email)',
        f.name || '(anonymous)',
        f.designation || '—',
        ...scoredSections.map((s) => fmt(f.sectionAvgs[s.id])),
        fmt(f.overall),
      ]);
    }
  }
  autoTable(doc, {
    ...tableBase(marginX),
    startY: 68,
    head: [['Email', 'Name', 'Designation', ...scoredSections.map((s) => s.code || s.title), 'Overall']],
    body: facBody,
    styles: { ...tableBase(marginX).styles, fontSize: 7.8, cellPadding: 3.6, halign: 'center' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 150 },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'left', cellWidth: 85 },
      [scoredSections.length + 3]: { fontStyle: 'bold' },
    },
    didParseCell: colorScores(3),
  });

  /* ================= Faculty Sentiment Analysis (NLP) ================= */
  if (commentSentiment.total) {
    doc.addPage();
    sectionTitle(doc, '6. Faculty Sentiment Analysis', 44, marginX);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
      `Automated sentiment of ${commentSentiment.total} open-ended comments (lexicon-based NLP).`,
      marginX,
      60
    );
    const segs = [
      { label: 'Positive', color: GREEN, value: commentSentiment.positive },
      { label: 'Negative', color: RED, value: commentSentiment.negative },
      { label: 'Neutral', color: [148, 163, 184], value: commentSentiment.neutral },
    ].filter((s) => s.value > 0);
    pieChart(doc, marginX + 74, 158, 52, segs);
    pieLegend(doc, marginX + 165, 128, segs, commentSentiment.total);

    const colTop = 230;
    const colW = (contentW - 26) / 2;
    commentCards(doc, marginX, colTop, colW, 'Positive Highlights', GREEN, commentSentiment.samplesPositive);
    commentCards(doc, marginX + colW + 26, colTop, colW, 'Areas of Concern', RED, commentSentiment.samplesNegative);
  }

  /* ================= All Faculty Comments (open-ended) ================= */
  if (openComments.length) {
    doc.addPage();
    sectionTitle(doc, '7. All Faculty Comments', 44, marginX);
    let firstOnPage = true;
    for (const oc of openComments) {
      const startY = firstOnPage ? 60 : doc.lastAutoTable.finalY + 26;
      autoTable(doc, {
        ...tableBase(marginX),
        startY,
        head: [
          [{ content: oc.text, colSpan: 4, styles: { fillColor: GROUP_BG, textColor: GROUP_TX, fontStyle: 'bold', halign: 'left', fontSize: 9.5 } }],
          ['Department', 'Email', 'Sentiment', 'Comment'],
        ],
        body: oc.items.map((it) => [it.department || '—', it.email || '—', it.sentiment || 'Neutral', it.value]),
        styles: { ...tableBase(marginX).styles, fontSize: 8.5, cellPadding: 5, valign: 'top' },
        columnStyles: {
          0: { cellWidth: 110, halign: 'left' },
          1: { cellWidth: 140, halign: 'left' },
          2: { cellWidth: 64, halign: 'center', fontStyle: 'bold' },
          3: { halign: 'left' },
        },
        didParseCell: (h) => {
          if (h.section === 'body' && h.column.index === 2) {
            const v = h.cell.raw;
            if (v === 'Positive') { h.cell.styles.textColor = [5, 122, 85]; h.cell.styles.fillColor = [220, 252, 231]; }
            else if (v === 'Negative') { h.cell.styles.textColor = [190, 24, 60]; h.cell.styles.fillColor = [255, 228, 230]; }
            else { h.cell.styles.textColor = MUTED; }
          }
        },
      });
      firstOnPage = false;
    }
  }

  /* ---- footer + page numbers ---- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageH - 26, pageW - marginX, pageH - 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Employee Experience & Culture Survey — Confidential', marginX, pageH - 14);
    doc.text(`Page ${i} of ${pages}`, pageW - marginX, pageH - 14, { align: 'right' });
    doc.text('KLEF — Great Place to Work', pageW / 2, pageH - 14, { align: 'center' });
  }

  return doc;
}

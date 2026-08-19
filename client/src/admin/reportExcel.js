import ExcelJS from 'exceljs';
import { buildReportData } from './reportData.js';

const BRAND = 'FF4F46E5'; // indigo-600
const SLATE_HDR = 'FF64748B';
const WHITE = 'FFFFFFFF';

function scoreFillColor(v) {
  if (v == null) return null;
  if (v >= 4) return 'FFD1FAE5'; // emerald-100
  if (v >= 3) return 'FFECFCCB'; // lime-100
  if (v >= 2) return 'FFFEF3C7'; // amber-100
  return 'FFFFE4E6'; // rose-100
}

function styleHeaderRow(row, color = BRAND) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });
}

function scoreCell(cell, v) {
  if (v == null) {
    cell.value = '—';
  } else {
    cell.value = Math.round(v * 100) / 100;
    cell.numFmt = '0.00';
    const fill = scoreFillColor(v);
    if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  }
  cell.alignment = { horizontal: 'center' };
}

function addTitle(ws, text, span) {
  ws.mergeCells(1, 1, 1, span);
  const c = ws.getCell(1, 1);
  c.value = text;
  c.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
  ws.getRow(1).height = 22;
}

export async function downloadExcelReport() {
  const data = await buildReportData();
  const { rows, sections, orderedQuestions, scoredSections, sectionStats, questionStats, departments, cellAvg, deptOverall, analysis } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Employee Experience & Culture Survey';
  wb.created = new Date();

  /* ---------- Sheet 1: Summary ---------- */
  const sum = wb.addWorksheet('Summary');
  addTitle(sum, 'Employee Experience & Culture Survey — Report Summary', 6);
  sum.getCell('A2').value = `Generated: ${new Date().toLocaleString()}   ·   Total responses: ${data.totalResponses}   ·   Scores are averages on a 1–5 scale`;
  sum.getCell('A2').font = { size: 9, color: { argb: 'FF64748B' } };

  // Section scores
  sum.getCell('A4').value = 'Overall Section Scores';
  sum.getCell('A4').font = { bold: true, size: 12 };
  const secHead = sum.getRow(5);
  secHead.values = ['Code', 'Section', 'Average / 5', 'Answers'];
  styleHeaderRow(secHead);
  sectionStats.forEach((s, i) => {
    const r = sum.getRow(6 + i);
    r.values = [s.code, s.title, null, s.n];
    scoreCell(r.getCell(3), s.avg);
    r.getCell(4).alignment = { horizontal: 'center' };
  });

  // Department x section matrix
  let mStart = 6 + sectionStats.length + 2;
  sum.getCell(mStart, 1).value = 'Department × Section Scores';
  sum.getCell(mStart, 1).font = { bold: true, size: 12 };
  const mHead = sum.getRow(mStart + 1);
  mHead.values = ['Department', 'Responses', ...scoredSections.map((s) => s.code || s.title), 'Overall'];
  styleHeaderRow(mHead);
  departments.forEach((d, i) => {
    const r = sum.getRow(mStart + 2 + i);
    r.getCell(1).value = d.name;
    r.getCell(2).value = d.n;
    r.getCell(2).alignment = { horizontal: 'center' };
    scoredSections.forEach((s, j) => scoreCell(r.getCell(3 + j), cellAvg(d.name, s.id)));
    scoreCell(r.getCell(3 + scoredSections.length), deptOverall(d.name));
    r.getCell(3 + scoredSections.length).font = { bold: true };
  });
  // Executive Summary & Analysis (appended below the matrix so row math above is untouched)
  const aStart = mStart + 2 + departments.length + 2;
  sum.getCell(aStart, 1).value = 'Executive Summary & Analysis';
  sum.getCell(aStart, 1).font = { bold: true, size: 12 };
  (analysis || []).forEach((p, i) => {
    const row = sum.getRow(aStart + 1 + i);
    sum.mergeCells(aStart + 1 + i, 1, aStart + 1 + i, 6);
    row.getCell(1).value = p;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    row.height = 30;
  });

  sum.columns = [{ width: 34 }, { width: 12 }, ...scoredSections.map(() => ({ width: 10 })), { width: 10 }];
  sum.getColumn(2).width = 30; // section title col in first table

  /* ---------- Sheet 2: Faculty Section Scores ---------- */
  const fac = wb.addWorksheet('Faculty Section Scores', { views: [{ state: 'frozen', ySplit: 2 }] });
  addTitle(fac, 'Faculty-wise Section Scores (each row = one submitted response)', 7 + scoredSections.length);
  const fHead = fac.getRow(2);
  fHead.values = [
    'Response #', 'Email', 'Submitted', 'Name', 'Department', 'Designation',
    ...scoredSections.map((s) => s.code || s.title), 'Overall',
  ];
  styleHeaderRow(fHead);
  // sort by department then overall (desc) so the sheet reads department-wise
  const facRows = [...rows].sort(
    (a, b) => a.department.localeCompare(b.department) || (b.overall ?? -1) - (a.overall ?? -1)
  );
  facRows.forEach((r, i) => {
    const xr = fac.getRow(3 + i);
    xr.values = [r.id, r.email || '', r.submitted_at, r.name || '(anonymous)', r.department, r.designation || '—'];
    xr.getCell(1).alignment = { horizontal: 'center' };
    scoredSections.forEach((s, j) => scoreCell(xr.getCell(7 + j), r.sectionAvgs[s.id]));
    scoreCell(xr.getCell(7 + scoredSections.length), r.overall);
    xr.getCell(7 + scoredSections.length).font = { bold: true };
  });
  fac.columns = [
    { width: 11 }, { width: 26 }, { width: 19 }, { width: 22 }, { width: 28 }, { width: 20 },
    ...scoredSections.map(() => ({ width: 9 })), { width: 10 },
  ];

  /* ---------- Sheet 3: Question Averages ---------- */
  const qa = wb.addWorksheet('Question Averages', { views: [{ state: 'frozen', ySplit: 2 }] });
  addTitle(qa, 'Question-wise Average Scores (grouped by section)', 4);
  const qHead = qa.getRow(2);
  qHead.values = ['Section', 'Question', 'Average / 5', 'Answers'];
  styleHeaderRow(qHead);
  let qRow = 3;
  let lastSec = null;
  for (const st of questionStats) {
    if (st.section.id !== lastSec) {
      const sr = qa.getRow(qRow++);
      sr.getCell(1).value = `${st.section.code}. ${st.section.title}`;
      qa.mergeCells(sr.number, 1, sr.number, 4);
      sr.getCell(1).font = { bold: true, color: { argb: WHITE } };
      sr.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_HDR } };
      lastSec = st.section.id;
    }
    const r = qa.getRow(qRow++);
    r.getCell(1).value = st.section.code;
    r.getCell(2).value = st.text;
    r.getCell(2).alignment = { wrapText: true };
    scoreCell(r.getCell(3), st.avg);
    r.getCell(4).value = st.n;
    r.getCell(4).alignment = { horizontal: 'center' };
  }
  qa.columns = [{ width: 10 }, { width: 80 }, { width: 12 }, { width: 10 }];

  /* ---------- Sheet 4: All Answers (faculty x question) ---------- */
  const all = wb.addWorksheet('All Answers', { views: [{ state: 'frozen', xSplit: 3, ySplit: 3 }] });
  addTitle(all, 'Every answer — one row per faculty response, questions grouped by section', 9);
  // Row 2: merged section headers; Row 3: question text
  const secRow = all.getRow(2);
  const qTextRow = all.getRow(3);
  all.getCell(2, 1).value = '';
  qTextRow.getCell(1).value = 'Response #';
  qTextRow.getCell(2).value = 'Email';
  qTextRow.getCell(3).value = 'Submitted';
  let col = 4;
  for (const s of sections) {
    const qs = orderedQuestions.filter((q) => q.section_id === s.id);
    if (!qs.length) continue;
    all.mergeCells(2, col, 2, col + qs.length - 1);
    const sc = all.getCell(2, col);
    sc.value = s.title;
    sc.font = { bold: true, color: { argb: WHITE }, size: 10 };
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
    sc.alignment = { horizontal: 'center' };
    for (const q of qs) {
      const qc = qTextRow.getCell(col);
      qc.value = q.text;
      all.getColumn(col).width = 26;
      col += 1;
    }
  }
  styleHeaderRow(qTextRow, SLATE_HDR);
  qTextRow.height = 42;
  rows.forEach((r, i) => {
    const xr = all.getRow(4 + i);
    xr.getCell(1).value = r.id;
    xr.getCell(1).alignment = { horizontal: 'center' };
    xr.getCell(2).value = r.email || '';
    xr.getCell(3).value = r.submitted_at;
    let c = 4;
    for (const s of sections) {
      const qs = orderedQuestions.filter((q) => q.section_id === s.id);
      for (const q of qs) {
        const v = r.answers[q.id];
        const cell = xr.getCell(c);
        cell.value = v ?? '';
        if (['likert', 'stars'].includes(q.type) && v !== undefined && v !== '') {
          scoreCell(cell, Number(v));
          cell.numFmt = '0';
        }
        c += 1;
      }
    }
  });
  all.getColumn(1).width = 11;
  all.getColumn(2).width = 26;
  all.getColumn(3).width = 19;

  /* ---------- download ---------- */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Survey_Faculty_Report.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildReportData, fmt, scoreBand } from './reportData.js';

const BRAND = [79, 70, 229]; // indigo-600
const SLATE = [51, 65, 85];
const SLATE_HDR = [100, 116, 139];

// Score → cell background (matches the dashboard's score colors)
function scoreFill(v) {
  if (v == null || Number.isNaN(v)) return null;
  if (v >= 4) return [209, 250, 229]; // emerald-100
  if (v >= 3) return [236, 252, 203]; // lime-100
  if (v >= 2) return [254, 243, 199]; // amber-100
  return [255, 228, 230]; // rose-100
}

const colorScores = (fromCol) => (h) => {
  if (h.section === 'body' && h.column.index >= fromCol) {
    const fill = scoreFill(parseFloat(h.cell.raw));
    if (fill) h.cell.styles.fillColor = fill;
  }
};

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

function sectionHeading(doc, text, y, marginX) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND);
  doc.text(text, marginX, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(1.2);
  doc.line(marginX, y + 5, marginX + 200, y + 5);
}

export async function downloadDepartmentReport() {
  const data = await buildReportData();
  const {
    rows, scoredSections, sectionStats, questionStats, departments, cellAvg, deptOverall, totalResponses,
    universitySummary, analysis, byDepartment,
  } = data;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const baseTable = { margin: { left: marginX, right: marginX, top: 56 } };

  /* ================= Page 1 — Summary ================= */
  const logo = await logoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', marginX, 26, 90, 36, undefined, 'FAST');
    } catch {
      /* skip logo if the image can't be embedded */
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.setFontSize(17);
  doc.text('Employee Experience & Culture Survey', pageW / 2, 40, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...BRAND);
  doc.text('Faculty Feedback Report — Sections, Questions & Departments', pageW / 2, 58, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date().toLocaleString()}    ·    Total responses: ${totalResponses}    ·    All scores are averages on a 1–5 scale`,
    pageW / 2, 74, { align: 'center' }
  );

  // ---- Executive summary & analysis ----
  sectionHeading(doc, '1. Executive Summary & Analysis', 102, marginX);
  const contentW = pageW - marginX * 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  doc.text(
    `Total responses: ${universitySummary.totalResponses}     Departments: ${universitySummary.departmentsCount}` +
      `     Overall score: ${fmt(universitySummary.overall)} / 5  (${scoreBand(universitySummary.overall)})`,
    marginX,
    124
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...SLATE);
  let sy = 146;
  for (const p of analysis) {
    const lines = doc.splitTextToSize(p, contentW);
    doc.text(lines, marginX, sy);
    sy += lines.length * 14 + 9;
  }

  doc.addPage();
  sectionHeading(doc, '2. Overall Section Scores', 48, marginX);
  autoTable(doc, {
    ...baseTable,
    startY: 58,
    head: [['Code', 'Section', 'Average / 5', 'Answers']],
    body: sectionStats.map((s) => [s.code || '—', s.title, fmt(s.avg), s.n]),
    styles: { fontSize: 9, cellPadding: 5, textColor: SLATE },
    headStyles: { fillColor: BRAND, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50, halign: 'center' },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 90 },
      3: { halign: 'center', cellWidth: 70 },
    },
    didParseCell: colorScores(2),
  });

  sectionHeading(doc, '3. Department × Section Scores', doc.lastAutoTable.finalY + 32, marginX);
  autoTable(doc, {
    ...baseTable,
    startY: doc.lastAutoTable.finalY + 42,
    head: [['Department', 'Responses', ...scoredSections.map((s) => s.code || s.title), 'Overall']],
    body: departments.map((d) => [
      d.name,
      d.n,
      ...scoredSections.map((s) => fmt(cellAvg(d.name, s.id))),
      fmt(deptOverall(d.name)),
    ]),
    styles: { fontSize: 8, cellPadding: 4, textColor: SLATE, halign: 'center' },
    headStyles: { fillColor: BRAND, fontSize: 8 },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 160 },
      [scoredSections.length + 2]: { fontStyle: 'bold' },
    },
    didParseCell: colorScores(2),
  });

  /* ================= Page — Question-wise ================= */
  doc.addPage();
  sectionHeading(doc, '4. Question-wise Average Scores', 48, marginX);
  const qBody = [];
  let lastSecId = null;
  for (const st of questionStats) {
    if (st.section.id !== lastSecId) {
      qBody.push([
        {
          content: `Section ${st.section.code} — ${st.section.title}`,
          colSpan: 3,
          styles: { fillColor: SLATE_HDR, textColor: 255, fontStyle: 'bold', halign: 'left', fontSize: 9 },
        },
      ]);
      lastSecId = st.section.id;
    }
    qBody.push([st.text, fmt(st.avg), st.n]);
  }
  autoTable(doc, {
    ...baseTable,
    startY: 58,
    head: [['Question', 'Average / 5', 'Answers']],
    body: qBody,
    styles: { fontSize: 8.5, cellPadding: 4.5, textColor: SLATE },
    headStyles: { fillColor: BRAND, fontSize: 9 },
    columnStyles: {
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 70 },
    },
    didParseCell: colorScores(1),
  });

  /* ================= Faculty responses grouped by department ================= */
  doc.addPage();
  sectionHeading(doc, '5. Faculty Responses by Department', 48, marginX);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text(
    'Faculty are grouped under their department. Email identifies each respondent; name/designation appear when provided.',
    marginX,
    62
  );

  const nCols = scoredSections.length + 4; // Email, Name, Designation, [sections], Overall
  const facBody = [];
  for (const d of byDepartment) {
    facBody.push([
      {
        content: `${d.name}   —   ${d.n} respondent(s)   ·   Overall ${fmt(d.overall)} / 5`,
        colSpan: nCols,
        styles: { fillColor: SLATE_HDR, textColor: 255, fontStyle: 'bold', halign: 'left', fontSize: 9 },
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
    ...baseTable,
    startY: 72,
    head: [['Email', 'Name', 'Designation', ...scoredSections.map((s) => s.code || s.title), 'Overall']],
    body: facBody,
    styles: { fontSize: 7.5, cellPadding: 3.5, textColor: SLATE, halign: 'center' },
    headStyles: { fillColor: BRAND, fontSize: 8 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 150 },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'left', cellWidth: 85 },
      [scoredSections.length + 3]: { fontStyle: 'bold' },
    },
    didParseCell: colorScores(3),
  });

  /* ---- Section legend ---- */
  autoTable(doc, {
    ...baseTable,
    startY: doc.lastAutoTable.finalY + 24,
    head: [['Code', 'Section']],
    body: scoredSections.map((s) => [s.code || '—', s.title]),
    styles: { fontSize: 8, cellPadding: 3.5, textColor: SLATE },
    headStyles: { fillColor: SLATE_HDR, fontSize: 8 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } },
    tableWidth: 320,
  });

  /* ---- Footer with page numbers ---- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Employee Experience & Culture Survey — Confidential    ·    Page ${i} of ${pages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: 'center' }
    );
  }

  doc.save('Survey_Faculty_Report.pdf');
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiLayers,
  FiStar,
  FiTrendingUp,
  FiFileText,
  FiDownload,
  FiChevronDown,
  FiMail,
  FiHelpCircle,
  FiPieChart,
} from 'react-icons/fi';
import { buildReportData, fmt, scoreBand } from './reportData.js';

/* ---------- score → colors ---------- */
function scoreHex(v) {
  if (v == null) return '#cbd5e1';
  if (v >= 4) return '#10b981';
  if (v >= 3.5) return '#84cc16';
  if (v >= 3) return '#f59e0b';
  if (v >= 2) return '#f97316';
  return '#f43f5e';
}
function scoreClasses(v) {
  if (v == null) return 'bg-slate-100 text-slate-400';
  if (v >= 4) return 'bg-emerald-100 text-emerald-700';
  if (v >= 3.5) return 'bg-lime-100 text-lime-700';
  if (v >= 3) return 'bg-amber-100 text-amber-700';
  if (v >= 2) return 'bg-orange-100 text-orange-700';
  return 'bg-rose-100 text-rose-700';
}

const BANDS = [
  { label: 'Very positive', color: '#10b981', test: (v) => v >= 4 },
  { label: 'Positive', color: '#84cc16', test: (v) => v >= 3.5 && v < 4 },
  { label: 'Moderate', color: '#f59e0b', test: (v) => v >= 3 && v < 3.5 },
  { label: 'Needs attention', color: '#f97316', test: (v) => v >= 2 && v < 3 },
  { label: 'Critical', color: '#f43f5e', test: (v) => v != null && v < 2 },
];

function Score({ v }) {
  return (
    <span className={`inline-flex min-w-[3rem] items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${scoreClasses(v)}`}>
      {fmt(v)}
    </span>
  );
}

/* Donut / pie chart (pure SVG) */
function Donut({ segments, size = 132, thickness = 22, center, centerSub }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const dash = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-acc}
            />
          );
          acc += dash;
          return el;
        })}
      </g>
      {center != null && (
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontSize={size * 0.22} fontWeight="800">
          {center}
        </text>
      )}
      {centerSub && (
        <text x="50%" y="62%" textAnchor="middle" fill="#64748b" fontSize={size * 0.09} fontWeight="600">
          {centerSub}
        </text>
      )}
    </svg>
  );
}

/* Small horizontal bar (branch domain performance) */
function MiniBar({ label, value, max = 5 }) {
  const pct = value ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-600" title={label}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreHex(value) }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold text-slate-700">{fmt(value)}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card border border-slate-100">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    buildReportData().then(setData).catch((e) => setError(e.message));
  }, []);

  const run = async (kind) => {
    setBusy(kind);
    try {
      if (kind === 'pdf') {
        const { downloadDepartmentReport } = await import('./reportPdf.js');
        await downloadDepartmentReport();
      } else {
        const { downloadExcelReport } = await import('./reportExcel.js');
        await downloadExcelReport();
      }
    } catch (e) {
      setError(e.message || `Could not generate the ${kind.toUpperCase()} report`);
    } finally {
      setBusy('');
    }
  };

  if (error) return <p className="text-rose-600 font-semibold">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );

  const { universitySummary: U, scoredSections, byDepartment, analysis, sectionStats, orderedQuestions, questionStats } = data;
  const totalQuestions = orderedQuestions.length;
  const scoredQuestions = questionStats.length;

  if (!U.totalResponses) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-14 text-center">
        <FiFileText className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 font-semibold text-slate-600">No responses yet</p>
        <p className="text-sm text-slate-400">The report will appear here once faculty start submitting.</p>
      </div>
    );
  }

  const deptAnswers = (d) => d.faculty.reduce((a, f) => a + (f.answerCount || 0), 0);
  const bandSegments = (faculty) =>
    BANDS.map((b) => ({ label: b.label, color: b.color, value: faculty.filter((f) => b.test(f.overall)).length })).filter(
      (s) => s.value > 0
    );

  return (
    <div className="space-y-8">
      {/* Title + downloads */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900">University Feedback Report</h2>
          <p className="text-sm text-slate-500">Employee Experience &amp; Culture Survey — college, department &amp; faculty analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => run('pdf')} disabled={!!busy} className="btn-primary">
            <FiDownload /> {busy === 'pdf' ? 'Preparing…' : 'PDF report'}
          </button>
          <button onClick={() => run('excel')} disabled={!!busy} className="btn-ghost">
            <FiDownload /> {busy === 'excel' ? 'Preparing…' : 'Excel'}
          </button>
        </div>
      </div>

      {/* University stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Total Faculty" value={U.totalResponses} sub={`${U.withEmail} verified emails`} tint="bg-brand-50 text-brand-600" />
        <StatCard icon={FiLayers} label="Departments" value={U.departmentsCount} tint="bg-violet-50 text-violet-600" />
        <StatCard icon={FiHelpCircle} label="Questions" value={totalQuestions} sub={`${scoredQuestions} scored`} tint="bg-sky-50 text-sky-600" />
        <StatCard icon={FiStar} label="Overall Score / 5" value={fmt(U.overall)} sub={scoreBand(U.overall)} tint="bg-amber-50 text-amber-600" />
      </div>

      {/* 1) College summary by branch */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-1 font-display text-lg font-bold text-slate-900">1. College Summary — by Branch</h3>
        <p className="mb-4 text-xs text-slate-400">
          Faculty participation and overall performance for each branch/department. Survey has {totalQuestions} questions ({scoredQuestions} scored 1–5).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-semibold">Branch / Department</th>
                <th className="py-2 px-3 font-semibold text-center">Faculty</th>
                <th className="py-2 px-3 font-semibold text-center">Answers</th>
                <th className="py-2 px-3 font-semibold text-center">Overall</th>
                <th className="py-2 pl-3 font-semibold text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byDepartment.map((d) => (
                <tr key={d.name}>
                  <td className="py-2.5 pr-4 font-semibold text-slate-800">{d.name}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700">{d.n}</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">{deptAnswers(d)}</td>
                  <td className="py-2.5 px-3 text-center"><Score v={d.overall} /></td>
                  <td className="py-2.5 pl-3 text-center text-xs font-semibold text-slate-500">{scoreBand(d.overall)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50/60">
                <td className="py-2.5 pr-4 font-extrabold text-slate-900">Total (College)</td>
                <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">{U.totalResponses}</td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-600">{byDepartment.reduce((a, d) => a + deptAnswers(d), 0)}</td>
                <td className="py-2.5 px-3 text-center"><Score v={U.overall} /></td>
                <td className="py-2.5 pl-3 text-center text-xs font-semibold text-slate-500">{scoreBand(U.overall)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2) University domain scores */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900">2. Overall Domain Scores (College)</h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {sectionStats.map((s) => (
            <MiniBar key={s.id} label={`${s.code ? s.code + '. ' : ''}${s.title}`} value={s.avg} />
          ))}
        </div>
      </div>

      {/* 3) Department deep-dives: pie + branch performance + individual faculty */}
      <div>
        <h3 className="mb-1 font-display text-lg font-bold text-slate-900">3. Department Performance &amp; Faculty</h3>
        <p className="mb-4 text-xs text-slate-400">Each branch: how many faculty attended, a performance pie, branch domain scores, and individual faculty reports.</p>
        <div className="space-y-5">
          {byDepartment.map((d, di) => {
            const segs = bandSegments(d.faculty);
            return (
              <div key={d.name} className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                    {di + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base font-extrabold text-slate-900">{d.name}</h4>
                    <p className="text-xs text-slate-400">{d.n} faculty attended · Overall {fmt(d.overall)}/5 · {scoreBand(d.overall)}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Pie / performance distribution */}
                  <div className="flex items-center gap-4">
                    <Donut segments={segs} center={fmt(d.overall)} centerSub="overall" />
                    <div className="space-y-1.5">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                        <FiPieChart className="h-3.5 w-3.5" /> Faculty by performance
                      </p>
                      {segs.length === 0 && <p className="text-xs text-slate-400">No scored data.</p>}
                      {segs.map((s) => (
                        <div key={s.label} className="flex items-center gap-2 text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-slate-600">{s.label}</span>
                          <span className="ml-auto font-bold text-slate-800">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Branch domain performance */}
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <FiTrendingUp className="h-3.5 w-3.5" /> Branch domain performance
                    </p>
                    <div className="space-y-2">
                      {scoredSections.map((s) => (
                        <MiniBar key={s.id} label={s.title} value={d.sectionAvgs[s.id]} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual faculty reports */}
                <button
                  onClick={() => setOpen((o) => ({ ...o, [d.name]: !o[d.name] }))}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-600"
                >
                  <FiUsers className="h-4 w-4" />
                  {open[d.name] ? 'Hide' : 'View'} individual faculty reports ({d.faculty.length})
                  <FiChevronDown className={`transition-transform ${open[d.name] ? 'rotate-180' : ''}`} />
                </button>
                {open[d.name] && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                          <th className="py-2 pr-3 font-semibold">Faculty (email)</th>
                          <th className="py-2 px-3 font-semibold">Name</th>
                          <th className="py-2 px-3 font-semibold">Designation</th>
                          {scoredSections.map((s) => (
                            <th key={s.id} className="py-2 px-2 font-semibold text-center" title={s.title}>{s.code || s.title}</th>
                          ))}
                          <th className="py-2 px-3 font-semibold text-center">Overall</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {d.faculty.map((f) => (
                          <tr key={f.id}>
                            <td className="py-2 pr-3 font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <FiMail className="h-3 w-3 text-slate-400" />
                                {f.email || <span className="italic text-slate-400">—</span>}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{f.name || <span className="italic text-slate-300">Anonymous</span>}</td>
                            <td className="py-2 px-3 text-slate-500">{f.designation || '—'}</td>
                            {scoredSections.map((s) => (
                              <td key={s.id} className="py-2 px-2 text-center"><Score v={f.sectionAvgs[s.id]} /></td>
                            ))}
                            <td className="py-2 px-3 text-center"><Score v={f.overall} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4) Final analysis */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
          <FiFileText className="text-brand-500" /> 4. Final Analysis &amp; Recommendations
        </h3>
        <div className="space-y-2.5">
          {analysis.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-600">{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

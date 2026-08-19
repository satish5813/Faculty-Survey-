import { Fragment, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiUsers,
  FiLayers,
  FiStar,
  FiTrendingUp,
  FiFileText,
  FiDownload,
  FiChevronDown,
  FiMail,
} from 'react-icons/fi';
import { buildReportData, fmt, scoreBand } from './reportData.js';

function scoreClasses(v) {
  if (v == null) return 'bg-slate-100 text-slate-400';
  if (v >= 4) return 'bg-emerald-100 text-emerald-700';
  if (v >= 3.5) return 'bg-lime-100 text-lime-700';
  if (v >= 3) return 'bg-amber-100 text-amber-700';
  if (v >= 2) return 'bg-orange-100 text-orange-700';
  return 'bg-rose-100 text-rose-700';
}

function Score({ v }) {
  return (
    <span className={`inline-flex min-w-[3rem] items-center justify-center rounded-lg px-2 py-1 text-xs font-bold ${scoreClasses(v)}`}>
      {fmt(v)}
    </span>
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

  const { universitySummary: u, scoredSections, byDepartment, analysis, sectionStats } = data;

  if (!u.totalResponses) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-14 text-center">
        <FiFileText className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 font-semibold text-slate-600">No responses yet</p>
        <p className="text-sm text-slate-400">The report will appear here once faculty start submitting.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title + downloads */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900">University Feedback Report</h2>
          <p className="text-sm text-slate-500">Employee Experience &amp; Culture Survey — department &amp; faculty analysis</p>
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

      {/* University summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Total Responses" value={u.totalResponses} sub={`${u.withEmail} with email`} tint="bg-brand-50 text-brand-600" />
        <StatCard icon={FiLayers} label="Departments" value={u.departmentsCount} tint="bg-violet-50 text-violet-600" />
        <StatCard icon={FiStar} label="Overall Score / 5" value={fmt(u.overall)} sub={scoreBand(u.overall)} tint="bg-amber-50 text-amber-600" />
        <StatCard
          icon={FiTrendingUp}
          label="Top Domain"
          value={u.strongest ? fmt(u.strongest.avg) : '—'}
          sub={u.strongest?.title}
          tint="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Written analysis */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-slate-900">
          <FiFileText className="text-brand-500" /> Executive Summary &amp; Analysis
        </h3>
        <div className="space-y-2.5">
          {analysis.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-600">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Domain scores */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-900">Domain Scores (University)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-semibold">Domain</th>
                <th className="py-2 px-3 font-semibold text-center">Score</th>
                <th className="py-2 px-3 font-semibold text-center">Rating</th>
                <th className="py-2 pl-3 font-semibold text-right">Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sectionStats.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 pr-4 font-medium text-slate-700">
                    {s.code ? `${s.code}. ` : ''}
                    {s.title}
                  </td>
                  <td className="py-2.5 px-3 text-center"><Score v={s.avg} /></td>
                  <td className="py-2.5 px-3 text-center text-xs font-semibold text-slate-500">{scoreBand(s.avg)}</td>
                  <td className="py-2.5 pl-3 text-right text-slate-400">{s.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department-wise summary + faculty */}
      <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
        <h3 className="mb-1 font-display text-lg font-bold text-slate-900">Department-wise Summary</h3>
        <p className="mb-4 text-xs text-slate-400">
          Click a department to see the faculty who responded and their individual scores.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Department</th>
                <th className="py-2 px-3 font-semibold text-center">Resp.</th>
                {scoredSections.map((s) => (
                  <th key={s.id} className="py-2 px-2 font-semibold text-center" title={s.title}>
                    {s.code || s.title}
                  </th>
                ))}
                <th className="py-2 px-3 font-semibold text-center">Overall</th>
                <th className="py-2 pl-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {byDepartment.map((d) => (
                <Fragment key={d.name}>
                  <tr
                    onClick={() => setOpen((o) => ({ ...o, [d.name]: !o[d.name] }))}
                    className="cursor-pointer transition hover:bg-brand-50/40"
                  >
                    <td className="py-2.5 pr-3 font-semibold text-slate-800">{d.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{d.n}</td>
                    {scoredSections.map((s) => (
                      <td key={s.id} className="py-2.5 px-2 text-center">
                        <Score v={d.sectionAvgs[s.id]} />
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center"><Score v={d.overall} /></td>
                    <td className="py-2.5 pl-2 text-slate-400">
                      <FiChevronDown className={`transition-transform ${open[d.name] ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {open[d.name] && (
                    <tr>
                      <td colSpan={scoredSections.length + 4} className="bg-slate-50/60 px-3 py-3">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[640px] text-left text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="py-1.5 pr-3 font-semibold">Faculty (email)</th>
                                <th className="py-1.5 px-3 font-semibold">Name</th>
                                <th className="py-1.5 px-3 font-semibold">Designation</th>
                                {scoredSections.map((s) => (
                                  <th key={s.id} className="py-1.5 px-2 font-semibold text-center">
                                    {s.code || s.title}
                                  </th>
                                ))}
                                <th className="py-1.5 px-3 font-semibold text-center">Overall</th>
                              </tr>
                            </thead>
                            <tbody>
                              {d.faculty.map((f) => (
                                <tr key={f.id} className="border-t border-slate-200/60">
                                  <td className="py-1.5 pr-3 font-medium text-slate-700">
                                    <span className="inline-flex items-center gap-1.5">
                                      <FiMail className="h-3 w-3 text-slate-400" />
                                      {f.email || <span className="italic text-slate-400">—</span>}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-600">{f.name || <span className="italic text-slate-300">Anonymous</span>}</td>
                                  <td className="py-1.5 px-3 text-slate-500">{f.designation || '—'}</td>
                                  {scoredSections.map((s) => (
                                    <td key={s.id} className="py-1.5 px-2 text-center">
                                      <Score v={f.sectionAvgs[s.id]} />
                                    </td>
                                  ))}
                                  <td className="py-1.5 px-3 text-center"><Score v={f.overall} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

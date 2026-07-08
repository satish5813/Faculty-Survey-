import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiStar, FiLayers, FiHelpCircle, FiMessageSquare } from 'react-icons/fi';
import { api } from '../api.js';

function scoreColor(v) {
  if (v >= 4) return 'bg-emerald-500';
  if (v >= 3) return 'bg-lime-500';
  if (v >= 2) return 'bg-amber-500';
  return 'bg-rose-500';
}

function ScoreBar({ label, value, count, delay = 0 }) {
  const pct = value ? (value / 5) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-base font-extrabold text-slate-900">{value ? value.toFixed(2) : '—'}</span>
          <span className="text-xs text-slate-400">/ 5 · {count || 0}</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${scoreColor(value)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card border border-slate-100">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAnalytics().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-rose-600 font-semibold">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );

  const overall =
    data.questions.filter((q) => q.avg != null).reduce((a, q) => a + Number(q.avg), 0) /
    (data.questions.filter((q) => q.avg != null).length || 1);

  const totalQuestions = data.questions.length + data.choices.length + data.open.length;

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Total Responses" value={data.totalResponses} tint="bg-brand-50 text-brand-600" />
        <StatCard
          icon={FiStar}
          label="Avg Score / 5"
          value={data.totalResponses ? overall.toFixed(2) : '—'}
          tint="bg-amber-50 text-amber-600"
        />
        <StatCard icon={FiLayers} label="Sections" value={data.sections.length} tint="bg-violet-50 text-violet-600" />
        <StatCard
          icon={FiHelpCircle}
          label="Questions"
          value={totalQuestions}
          tint="bg-emerald-50 text-emerald-600"
        />
      </div>

      {data.totalResponses === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <FiMessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-600">No responses yet</p>
          <p className="text-sm text-slate-400">Analytics will appear here once faculty start submitting the survey.</p>
        </div>
      )}

      {data.sections.length > 0 && (
        <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
          <h3 className="mb-5 font-display text-lg font-bold text-slate-900">Section Scores</h3>
          <div className="space-y-4">
            {data.sections.map((s, i) => (
              <ScoreBar key={s.id} label={`${s.code}. ${s.title}`} value={Number(s.avg)} count={s.n} delay={i * 0.06} />
            ))}
          </div>
        </div>
      )}

      {/* Per-question scores */}
      {data.questions.some((q) => q.avg != null) && (
        <div className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
          <h3 className="mb-5 font-display text-lg font-bold text-slate-900">Question Breakdown</h3>
          <div className="space-y-5">
            {data.questions
              .filter((q) => q.avg != null)
              .map((q, i) => (
                <ScoreBar key={q.id} label={q.text} value={Number(q.avg)} count={q.n} delay={Math.min(i * 0.03, 0.5)} />
              ))}
          </div>
        </div>
      )}

      {/* Choice distributions */}
      {data.choices.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {data.choices.map((c) => {
            const total = c.distribution.reduce((a, d) => a + d.count, 0);
            return (
              <div key={c.question_id} className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
                <h4 className="mb-4 font-semibold text-slate-800 text-sm leading-snug">{c.text}</h4>
                <div className="space-y-3">
                  {c.distribution.map((d) => {
                    const pct = total ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={d.value}>
                        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                          <span>{d.value}</span>
                          <span>{d.count} · {pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            className="h-full rounded-full bg-brand-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Open-ended */}
      {data.open.map((o) => (
        <div key={o.question_id} className="rounded-3xl bg-white p-6 shadow-card border border-slate-100">
          <h4 className="mb-4 font-semibold text-slate-800 flex items-center gap-2">
            <FiMessageSquare className="text-brand-500" /> {o.text}
            <span className="ml-auto text-xs font-normal text-slate-400">{o.answers.length} responses</span>
          </h4>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {o.answers.map((a, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                “{a.value}”
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

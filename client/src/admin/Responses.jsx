import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiDownload, FiTrash2, FiX, FiInbox, FiStar, FiClock } from 'react-icons/fi';
import { api } from '../api.js';

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function AnswerValue({ a }) {
  if (a.type === 'likert' || a.type === 'stars') {
    const n = Number(a.numeric_value);
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {n}
        </span>
        {a.type === 'stars' && <FiStar className="text-amber-400" />}
      </span>
    );
  }
  return <span className="text-slate-700">{a.value}</span>;
}

function DetailDrawer({ id, onClose, onDeleted }) {
  const [resp, setResp] = useState(null);

  useEffect(() => {
    api.getResponse(id).then(setResp).catch(() => {});
  }, [id]);

  const del = async () => {
    if (!confirm('Delete this response permanently?')) return;
    await api.deleteResponse(id);
    onDeleted();
  };

  // group answers by section
  const groups = {};
  (resp?.answers || []).forEach((a) => {
    (groups[a.section_title] ||= []).push(a);
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="h-full w-full max-w-xl overflow-y-auto bg-slate-50 shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Response #{id}</h3>
            {resp && <p className="text-xs text-slate-400 flex items-center gap-1"><FiClock /> {fmtDate(resp.submitted_at)}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={del} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
              <FiTrash2 />
            </button>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
              <FiX />
            </button>
          </div>
        </div>

        {!resp ? (
          <div className="flex justify-center py-20">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {Object.entries(groups).map(([section, answers]) => (
              <div key={section} className="rounded-3xl bg-white p-5 shadow-card border border-slate-100">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-600">{section}</h4>
                <div className="space-y-4">
                  {answers.map((a) => (
                    <div key={a.question_id}>
                      <p className="text-sm font-medium text-slate-500">{a.text}</p>
                      <div className="mt-1"><AnswerValue a={a} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Responses() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  const load = (p = page) => {
    api.getResponses(p, 20).then(setData).catch((e) => setError(e.message));
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (error) return <p className="text-rose-600 font-semibold">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{data.total}</span> total responses
        </p>
        <button onClick={() => api.exportCsv()} className="btn-ghost">
          <FiDownload /> Export CSV
        </button>
      </div>

      {data.responses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-14 text-center">
          <FiInbox className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-600">No responses yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">Respondent</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Submitted</th>
                <th className="px-5 py-3 font-semibold text-right">Avg</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.responses.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setDetail(r.id)}
                  className="cursor-pointer transition hover:bg-brand-50/40"
                >
                  <td className="px-5 py-3.5 font-mono text-sm text-slate-400">{r.id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    {r.name || <span className="text-slate-400 italic">Anonymous</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{fmtDate(r.submitted_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {r.avg_score ? (
                      <span className="inline-flex items-center rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">
                        {Number(r.avg_score).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-brand-600">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <AnimatePresence>
        {detail && (
          <DetailDrawer
            id={detail}
            onClose={() => setDetail(null)}
            onDeleted={() => {
              setDetail(null);
              load(page);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

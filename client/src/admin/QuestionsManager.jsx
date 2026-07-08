import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiX,
  FiChevronDown,
  FiFolderPlus,
} from 'react-icons/fi';
import { api } from '../api.js';

const TYPES = [
  { value: 'likert', label: 'Agreement scale (1–5)' },
  { value: 'stars', label: 'Star rating (1–5)' },
  { value: 'single_choice', label: 'Single choice (buttons)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'open', label: 'Long text (open-ended)' },
  { value: 'text', label: 'Short text' },
];

const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));
const needsOptions = (t) => t === 'single_choice' || t === 'dropdown';

function Modal({ children, onClose, title }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <FiX />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function QuestionModal({ initial, sectionId, onSave, onClose }) {
  const [text, setText] = useState(initial?.text || '');
  const [type, setType] = useState(initial?.type || 'likert');
  const [required, setRequired] = useState(initial?.required ?? false);
  const [optionsText, setOptionsText] = useState((initial?.options || []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!text.trim()) return setErr('Question text is required');
    setSaving(true);
    setErr('');
    const options = needsOptions(type)
      ? optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    if (needsOptions(type) && options.length === 0) {
      setSaving(false);
      return setErr('Please add at least one option (one per line)');
    }
    try {
      const payload = { text: text.trim(), type, required, options, section_id: sectionId };
      if (initial) await api.updateQuestion(initial.id, payload);
      else await api.createQuestion(payload);
      onSave();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={initial ? 'Edit Question' : 'Add Question'}>
      <div className="space-y-4">
        <div>
          <label className="label">Question text</label>
          <textarea
            className="field min-h-[5rem]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. My work gives me a sense of purpose"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Answer type</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {needsOptions(type) && (
          <div>
            <label className="label">Options (one per line)</label>
            <textarea
              className="field min-h-[6rem]"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={'Yes\nNo\nMaybe'}
            />
          </div>
        )}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-5 w-5 rounded-md accent-brand-600"
          />
          <span className="text-sm font-semibold text-slate-600">Required question</span>
        </label>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SectionModal({ initial, onSave, onClose }) {
  const [code, setCode] = useState(initial?.code || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!title.trim()) return setErr('Title is required');
    setSaving(true);
    try {
      const payload = { code: code.trim(), title: title.trim(), description: description.trim() };
      if (initial) await api.updateSection(initial.id, payload);
      else await api.createSection(payload);
      onSave();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={initial ? 'Edit Section' : 'Add Section'}>
      <div className="space-y-4">
        <div>
          <label className="label">Short code (optional)</label>
          <input className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. A" />
        </div>
        <div>
          <label className="label">Title</label>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pride & Purpose"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="field min-h-[5rem]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TypeBadge({ type }) {
  const colors = {
    likert: 'bg-brand-50 text-brand-600',
    stars: 'bg-amber-50 text-amber-600',
    single_choice: 'bg-violet-50 text-violet-600',
    dropdown: 'bg-sky-50 text-sky-600',
    open: 'bg-emerald-50 text-emerald-600',
    text: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[type] || colors.text}`}>
      {TYPE_LABEL[type]?.split(' ')[0] || type}
    </span>
  );
}

export default function QuestionsManager() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});
  const [qModal, setQModal] = useState(null); // { sectionId, question? }
  const [sModal, setSModal] = useState(null); // { section? } or 'new'

  const load = async () => {
    try {
      const data = await api.getSections();
      setSections(data);
      setOpen((prev) => (Object.keys(prev).length ? prev : Object.fromEntries(data.map((s) => [s.id, true]))));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (q) => {
    await api.updateQuestion(q.id, { active: !q.active });
    load();
  };

  const del = async (q) => {
    if (!confirm(`Delete "${q.text}"?${q.response_count ? '\n\nThis question has responses and will be hidden instead of deleted to preserve data.' : ''}`))
      return;
    await api.deleteQuestion(q.id);
    load();
  };

  const delSection = async (s) => {
    if (!confirm(`Delete section "${s.title}" and all its questions? This cannot be undone.`)) return;
    await api.deleteSection(s.id);
    load();
  };

  if (error) return <p className="text-rose-600 font-semibold">{error}</p>;
  if (!sections)
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Manage survey sections and questions. Changes appear on the live survey instantly.
        </p>
        <button onClick={() => setSModal('new')} className="btn-primary whitespace-nowrap">
          <FiFolderPlus /> Add Section
        </button>
      </div>

      {sections.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-3xl bg-white shadow-card border border-slate-100">
          <div className="flex items-center gap-3 p-5">
            <button
              onClick={() => setOpen((p) => ({ ...p, [s.id]: !p[s.id] }))}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {s.code || '•'}
              </span>
              <span>
                <span className="block font-bold text-slate-900">{s.title}</span>
                <span className="text-xs text-slate-400">{s.questions.length} questions</span>
              </span>
              <FiChevronDown
                className={`ml-auto text-slate-400 transition-transform ${open[s.id] ? 'rotate-180' : ''}`}
              />
            </button>
            <button onClick={() => setSModal({ section: s })} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" title="Edit section">
              <FiEdit2 />
            </button>
            <button onClick={() => delSection(s)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="Delete section">
              <FiTrash2 />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open[s.id] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-100"
              >
                <div className="divide-y divide-slate-50">
                  {s.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className={`flex items-center gap-3 px-5 py-3.5 ${!q.active ? 'opacity-50' : ''}`}
                    >
                      <span className="w-6 text-center text-xs font-bold text-slate-300">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-700">{q.text}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <TypeBadge type={q.type} />
                          {q.required && <span className="text-[10px] font-bold text-rose-500">REQUIRED</span>}
                          {q.response_count > 0 && (
                            <span className="text-[10px] text-slate-400">{q.response_count} answers</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleActive(q)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                        title={q.active ? 'Hide from survey' : 'Show on survey'}
                      >
                        {q.active ? <FiEye /> : <FiEyeOff />}
                      </button>
                      <button
                        onClick={() => setQModal({ sectionId: s.id, question: q })}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => del(q)}
                        className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button
                    onClick={() => setQModal({ sectionId: s.id })}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600 transition"
                  >
                    <FiPlus /> Add question to {s.title}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <AnimatePresence>
        {qModal && (
          <QuestionModal
            initial={qModal.question}
            sectionId={qModal.sectionId}
            onClose={() => setQModal(null)}
            onSave={() => {
              setQModal(null);
              load();
            }}
          />
        )}
        {sModal && (
          <SectionModal
            initial={sModal === 'new' ? undefined : sModal.section}
            onClose={() => setSModal(null)}
            onSave={() => {
              setSModal(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

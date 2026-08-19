import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiLock,
  FiShield,
  FiUser,
  FiAward,
  FiCheckCircle,
  FiMessageCircle,
  FiHeart,
  FiStar,
  FiUsers,
  FiList,
} from 'react-icons/fi';
import { api } from '../api.js';
import Aurora from '../components/Aurora.jsx';
import QuestionField from '../components/QuestionField.jsx';
import EmailGate from '../components/EmailGate.jsx';

// Per-section accent colors (solid, no gradients) + icons for a premium, varied look.
const ACCENTS = [
  { chip: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-600', solid: 'bg-indigo-600' },
  { chip: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500', ring: 'ring-violet-200', text: 'text-violet-600', solid: 'bg-violet-600' },
  { chip: 'bg-teal-100 text-teal-700', bar: 'bg-teal-500', ring: 'ring-teal-200', text: 'text-teal-600', solid: 'bg-teal-600' },
  { chip: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-600', solid: 'bg-amber-500' },
  { chip: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500', ring: 'ring-rose-200', text: 'text-rose-600', solid: 'bg-rose-600' },
  { chip: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-600', solid: 'bg-emerald-600' },
  { chip: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500', ring: 'ring-sky-200', text: 'text-sky-600', solid: 'bg-sky-600' },
  { chip: 'bg-fuchsia-100 text-fuchsia-700', bar: 'bg-fuchsia-500', ring: 'ring-fuchsia-200', text: 'text-fuchsia-600', solid: 'bg-fuchsia-600' },
];

const SECTION_ICONS = {
  DEMO: FiUser,
  1: FiShield, // Credibility
  2: FiHeart, // Respect
  3: FiCheckCircle, // Fairness
  4: FiAward, // Pride
  5: FiUsers, // Camaraderie
  REF: FiMessageCircle,
  SAT: FiStar,
};
const iconFor = (code) => SECTION_ICONS[code] || FiList;

function ProgressBar({ pct }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
      <motion.div
        className="h-full rounded-full bg-brand-600"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
      />
    </div>
  );
}

function Welcome({ intro, onBegin, sectionCount, questionCount }) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl p-6 sm:p-9 text-center"
    >
      <motion.img
        src="/logos/kl-logo.png"
        alt="KL University"
        className="mx-auto mb-4 h-16 sm:h-20 object-contain"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring' }}
      />
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Great Place to Work
      </span>
      <h1 className="mt-4 font-display text-2xl sm:text-4xl font-extrabold leading-tight text-slate-900">
        {intro.title.split('&')[0]}
        <span className="text-brand-600">&amp;{intro.title.split('&')[1]}</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">{intro.body}</p>

      <div className="mt-6 grid grid-cols-3 gap-2.5 max-w-md mx-auto">
        {[
          { n: sectionCount, l: 'Sections' },
          { n: questionCount, l: 'Questions' },
          { n: '~5', l: 'Minutes' },
        ].map((s) => (
          <div key={s.l} className="rounded-xl bg-slate-50 border border-slate-100 py-3">
            <div className="font-display text-xl sm:text-2xl font-extrabold text-brand-600">{s.n}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>

      <button onClick={onBegin} className="btn-primary mt-7 w-full sm:w-auto px-9">
        Begin Survey <FiArrowRight />
      </button>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
        <FiShield className="text-emerald-500" />
        Your responses are strictly confidential &amp; anonymous.
      </div>
    </motion.div>
  );
}

function ThankYou() {
  return (
    <motion.div
      key="thankyou"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="glass rounded-3xl p-8 sm:p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-sm"
      >
        <FiCheck className="h-10 w-10 text-white" strokeWidth={3} />
      </motion.div>
      <h2 className="mt-6 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">Thank You!</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500 leading-relaxed">
        Thank you for completing the Employee Experience &amp; Culture Survey. Your valuable feedback
        will help us strengthen our workplace culture and enhance the employee experience. All responses
        remain confidential and will be used solely for institutional improvement.
      </p>
      <button onClick={() => window.location.reload()} className="btn-ghost mt-8">
        Submit another response
      </button>
    </motion.div>
  );
}

export default function SurveyPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // 0 = welcome, 1..N = sections
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [missing, setMissing] = useState([]);
  const [email, setEmail] = useState(() => sessionStorage.getItem('klef_survey_email') || '');

  useEffect(() => {
    api
      .getSurvey()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const onVerified = (verifiedEmail) => {
    sessionStorage.setItem('klef_survey_email', verifiedEmail);
    setEmail(verifiedEmail);
  };

  const sections = data?.sections || [];
  const totalQuestions = useMemo(
    () => sections.reduce((n, s) => n + s.questions.length, 0),
    [sections]
  );
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== '' && v !== undefined && v !== null).length,
    [answers]
  );
  const pct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const setAnswer = (qid, val) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    setMissing((prev) => prev.filter((id) => id !== qid));
  };

  const currentSection = step >= 1 ? sections[step - 1] : null;

  // Section accent + progress (computed here to keep the JSX simple and AnimatePresence happy)
  const accent = ACCENTS[Math.max(0, step - 1) % ACCENTS.length];
  const SectionIcon = currentSection ? iconFor(currentSection.code) : null;
  const sectionTotal = currentSection ? currentSection.questions.length : 0;
  const sectionAnswered = currentSection
    ? currentSection.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length
    : 0;
  const sectionPct = sectionTotal ? Math.round((sectionAnswered / sectionTotal) * 100) : 0;
  const showSectionCode = currentSection && !['DEMO', 'SAT', 'REF'].includes(currentSection.code);

  const requiredUnanswered = (section) =>
    section.questions
      .filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === ''))
      .map((q) => q.id);

  const goNext = () => {
    if (currentSection) {
      const miss = requiredUnanswered(currentSection);
      if (miss.length) {
        setMissing(miss);
        const el = document.getElementById(`q-${miss[0]}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    setMissing([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setMissing([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async () => {
    if (currentSection) {
      const miss = requiredUnanswered(currentSection);
      if (miss.length) {
        setMissing(miss);
        return;
      }
    }
    setSubmitting(true);
    setError('');
    try {
      await api.submit(answers, email);
      sessionStorage.removeItem('klef_survey_email');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !data) {
    return (
      <div className="relative min-h-screen">
        <Aurora />
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="glass rounded-3xl p-8 text-center max-w-md">
            <p className="text-lg font-bold text-slate-800">Unable to load the survey</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <p className="mt-3 text-xs text-slate-400">
              Please ensure the API server is running on port 4000.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative min-h-screen">
        <Aurora />
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-slate-500 font-medium">Loading your survey…</p>
          </div>
        </div>
      </div>
    );
  }

  const isLast = step === sections.length;

  return (
    <div className="relative min-h-screen">
      <Aurora />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <img src="/logos/kl-logo.png" alt="KL" className="h-9 w-auto object-contain" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 leading-tight">Employee Experience &amp; Culture Survey</p>
            {email && !submitted && (
              <p className="text-[11px] font-medium text-slate-400 truncate" title={email}>
                Signed in as {email}
              </p>
            )}
          </div>
          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-brand-600 transition"
          >
            <FiLock className="h-3.5 w-3.5" /> Admin
          </Link>
        </div>
        {step >= 1 && !submitted && (
          <div className="mx-auto max-w-3xl px-4 pb-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>
                Section {step} of {sections.length} · {currentSection?.title}
              </span>
              <span className="text-brand-600">{pct}% complete</span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 sm:py-7 pb-40 sm:pb-44">
        {/* Keyed remount per step gives a smooth entrance animation without an exit-wait
            that could deadlock if the tab is backgrounded mid-transition. */}
        <div>
          {submitted ? (
            <ThankYou key="ty" />
          ) : !email ? (
            <EmailGate key="gate" allowedDomains={data.allowedDomains || []} onVerified={onVerified} />
          ) : step === 0 ? (
            <Welcome
              key="wel"
              intro={data.intro}
              onBegin={goNext}
              sectionCount={sections.length}
              questionCount={totalQuestions}
            />
          ) : (
            <motion.div
              key={`sec-${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                  {/* Section header card */}
                  <div className="mb-5 glass rounded-2xl p-4 sm:p-5">
                    <div className="flex items-start gap-3.5">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${accent.chip}`}
                      >
                        <SectionIcon className="h-6 w-6" />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {showSectionCode && (
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${accent.solid} text-[10px] font-bold text-white`}>
                              {currentSection.code}
                            </span>
                          )}
                          <h2 className="font-display text-lg sm:text-xl font-extrabold leading-tight text-slate-900">
                            {currentSection.title}
                          </h2>
                        </div>
                        {currentSection.description && (
                          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                            {currentSection.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* per-section progress */}
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className={`h-full rounded-full ${accent.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${sectionPct}%` }}
                          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                        {sectionAnswered}/{sectionTotal} done
                      </span>
                    </div>
                  </div>

                  {/* Likert legend */}
                  {currentSection.questions.some((q) => q.type === 'likert') && (
                    <div className="mb-3 hidden sm:flex items-center justify-end gap-4 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Strongly Disagree
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Strongly Agree
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {currentSection.questions.map((q, i) => {
                      const isMissing = missing.includes(q.id);
                      const answered = answers[q.id] !== undefined && answers[q.id] !== '';
                      return (
                        <motion.div
                          key={q.id}
                          id={`q-${q.id}`}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.05, 0.35), ease: 'easeOut' }}
                          className={[
                            // no overflow-hidden here — the searchable dropdown list must be able to
                            // extend past the card; focus-within lifts the open card above later cards.
                            'group relative glass rounded-2xl p-4 sm:p-5 pl-5 transition-all duration-300',
                            'hover:shadow-lg hover:-translate-y-0.5 focus-within:z-30',
                            isMissing ? 'ring-2 ring-rose-400' : answered ? `ring-1 ${accent.ring}` : '',
                          ].join(' ')}
                        >
                          {/* left accent bar */}
                          <span
                            className={`absolute left-1.5 top-3 bottom-3 w-1.5 rounded-full transition-colors duration-300 ${
                              isMissing ? 'bg-rose-400' : answered ? accent.bar : 'bg-slate-200'
                            }`}
                          />
                          <div className="mb-3 flex items-start gap-2.5">
                            <span
                              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                answered ? `${accent.solid} text-white` : accent.chip
                              }`}
                            >
                              {i + 1}
                            </span>
                            <label className="flex-1 text-sm sm:text-base font-semibold leading-snug text-slate-800">
                              {q.text}
                              {q.required && <span className="ml-1 text-rose-500">*</span>}
                            </label>
                            <AnimatePresence>
                              {answered && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                  className={accent.text}
                                >
                                  <FiCheckCircle className="h-5 w-5" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="pl-0 sm:pl-8">
                            <QuestionField
                              question={q}
                              value={answers[q.id]}
                              onChange={(v) => setAnswer(q.id, v)}
                              accentSolid={accent.solid}
                            />
                            {isMissing && (
                              <p className="mt-2 text-xs font-semibold text-rose-500">This question is required.</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {error && (
                    <p className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600">
                      {error}
                    </p>
                  )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Sticky footer nav */}
      {!submitted && step >= 1 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_-8px_30px_-12px_rgba(30,27,75,0.15)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
            <button onClick={goBack} className="btn-ghost">
              <FiArrowLeft /> Back
            </button>
            {isLast ? (
              <button onClick={submit} disabled={submitting} className="btn-primary flex-1 sm:flex-none">
                {submitting ? 'Submitting…' : 'Submit Survey'} <FiCheck />
              </button>
            ) : (
              <button onClick={goNext} className="btn-primary flex-1 sm:flex-none">
                Continue <FiArrowRight />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import LikertScale from './LikertScale.jsx';
import StarRating from './StarRating.jsx';

export default function QuestionField({ question, value, onChange, accentSolid = 'bg-brand-600' }) {
  const { type, options } = question;

  if (type === 'likert') {
    return <LikertScale value={value ? Number(value) : 0} onChange={(v) => onChange(String(v))} />;
  }

  if (type === 'stars') {
    return <StarRating value={value ? Number(value) : 0} onChange={(v) => onChange(String(v))} />;
  }

  if (type === 'single_choice') {
    return (
      <div className="flex flex-wrap gap-2.5">
        {(options || []).map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={[
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95',
                active
                  ? `${accentSolid} text-white shadow-sm`
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5',
              ].join(' ')}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'dropdown') {
    return (
      <div className="relative">
        <select
          className="field appearance-none pr-10 cursor-pointer"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option…</option>
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  if (type === 'open') {
    return (
      <textarea
        className="field min-h-[7rem] resize-y leading-relaxed"
        placeholder="Share your thoughts…"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={4000}
      />
    );
  }

  // default: short text
  return (
    <input
      type="text"
      className="field"
      placeholder="Type your answer…"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={500}
    />
  );
}

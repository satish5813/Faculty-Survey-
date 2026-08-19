import LikertScale from './LikertScale.jsx';
import StarRating from './StarRating.jsx';
import SearchableSelect from './SearchableSelect.jsx';

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
    return <SearchableSelect options={options || []} value={value} onChange={onChange} />;
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

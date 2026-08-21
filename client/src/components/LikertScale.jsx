import { motion } from 'framer-motion';

const OPTIONS = [
  { value: 1, label: 'Strongly Disagree\nపూర్తిగా విభేదిస్తాను', short: 'SD', bg: 'bg-rose-500', ring: 'ring-rose-200' },
  { value: 2, label: 'Disagree\nవిభేదిస్తాను', short: 'D', bg: 'bg-orange-500', ring: 'ring-orange-200' },
  { value: 3, label: 'Neutral\nతటస్థం', short: 'N', bg: 'bg-amber-400', ring: 'ring-amber-200' },
  { value: 4, label: 'Agree\nఅంగీకరిస్తాను', short: 'A', bg: 'bg-lime-500', ring: 'ring-lime-200' },
  { value: 5, label: 'Strongly Agree\nపూర్తిగా అంగీకరిస్తాను', short: 'SA', bg: 'bg-emerald-500', ring: 'ring-emerald-200' },
];

export default function LikertScale({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="group flex flex-col items-center gap-1.5 focus:outline-none"
            aria-pressed={active}
            aria-label={opt.label}
          >
            <motion.span
              whileTap={{ scale: 0.9 }}
              className={[
                'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl font-bold text-sm transition-all duration-200',
                active
                  ? `${opt.bg} text-white shadow-sm ring-2 ${opt.ring}`
                  : 'bg-white text-slate-400 border border-slate-200 group-hover:border-brand-300 group-hover:text-brand-500',
              ].join(' ')}
            >
              {opt.value}
            </motion.span>
            <span
              className={[
                'text-[9px] sm:text-[10px] font-semibold leading-tight text-center transition-colors',
                active ? 'text-slate-700' : 'text-slate-400',
              ].join(' ')}
            >
              <span className="sm:hidden">{opt.short}</span>
              <span className="hidden sm:block leading-tight">
                <span className="block">{opt.label.split('\n')[0]}</span>
                <span className="block font-telugu text-[0.95em] opacity-80">{opt.label.split('\n')[1]}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

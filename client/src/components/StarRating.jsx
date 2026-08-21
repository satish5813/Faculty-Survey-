import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

const LABELS = ['', 'Poor / బలహీనం', 'Fair / ఫర్వాలేదు', 'Good / బాగుంది', 'Very Good / చాలా బాగుంది', 'Excellent / అద్భుతం'];

export default function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.2, rotate: -6 }}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className="p-0.5 focus:outline-none"
          >
            <FaStar
              className={[
                'h-8 w-8 sm:h-9 sm:w-9 transition-colors duration-150',
                star <= shown ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]' : 'text-slate-200',
              ].join(' ')}
            />
          </motion.button>
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-500 min-w-[4.5rem]">
        {shown ? LABELS[shown] : 'Tap to rate / నొక్కండి'}
      </span>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';

// Option entries formatted as "--- Label ---" are treated as non-selectable group headers.
const HEADER_RE = /^---\s*(.+?)\s*---$/;

export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Search / వెతకండి…' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  // Keep the input display in sync when the value changes from outside.
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Parse the flat options list into { label, items } groups.
  const groups = useMemo(() => {
    const out = [];
    let current = { label: null, items: [] };
    for (const opt of options) {
      const m = typeof opt === 'string' && opt.match(HEADER_RE);
      if (m) {
        if (current.items.length) out.push(current);
        current = { label: m[1], items: [] };
      } else {
        current.items.push(opt);
      }
    }
    if (current.items.length) out.push(current);
    return out;
  }, [options]);

  // Filter only while the user is actively typing something different from the chosen value.
  const q = query.trim().toLowerCase();
  const filtering = open && q && query !== (value || '');
  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: filtering ? g.items.filter((o) => o.toLowerCase().includes(q)) : g.items }))
        .filter((g) => g.items.length),
    [groups, filtering, q]
  );
  const flat = useMemo(() => visibleGroups.flatMap((g) => g.items), [visibleGroups]);

  // Reset the highlight to the best match whenever the visible list changes.
  useEffect(() => {
    if (!open) return;
    setHighlight(filtering && flat.length ? 0 : flat.indexOf(value));
  }, [open, filtering, flat, value]);

  // Close on outside click / tap and restore the display text.
  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || '');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [value]);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    if (!open || highlight < 0) return;
    listRef.current?.querySelector(`[data-idx="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, highlight]);

  const select = (opt) => {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(flat.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[highlight]) select(flat[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value || '');
    }
  };

  let idx = -1;

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        className="field pr-16 cursor-text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
      />
      <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-slate-400">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <svg className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
        >
          {flat.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">No matches / సరిపోలేదు</p>
          )}
          {visibleGroups.map((g, gi) => (
            <div key={g.label ?? gi}>
              {g.label && (
                <p className="sticky top-0 bg-white/95 px-4 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {g.label}
                </p>
              )}
              {g.items.map((opt) => {
                idx += 1;
                const i = idx;
                const active = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => select(opt)}
                    className={[
                      'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors',
                      active
                        ? 'font-semibold text-brand-600'
                        : highlight === i
                          ? 'bg-slate-100 text-slate-800'
                          : 'text-slate-600',
                    ].join(' ')}
                  >
                    <span className="truncate">{opt}</span>
                    {active && (
                      <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

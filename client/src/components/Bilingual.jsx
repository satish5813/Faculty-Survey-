// Renders "English\nTelugu" as a primary English line and a lighter Telugu line
// (in the Telugu font). Falls back gracefully if there is only one line.
export default function Bilingual({ text, className = '', enClassName = '', teClassName = '', enSuffix = null }) {
  const raw = String(text ?? '');
  const nl = raw.indexOf('\n');
  const en = nl === -1 ? raw : raw.slice(0, nl);
  const te = nl === -1 ? '' : raw.slice(nl + 1).trim();
  return (
    <span className={className}>
      <span className={`block ${enClassName}`}>
        {en}
        {enSuffix}
      </span>
      {te && (
        <span className={`block font-telugu font-medium text-slate-500 whitespace-pre-line ${teClassName}`}>
          {te}
        </span>
      )}
    </span>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiArrowRight, FiShield, FiLock } from 'react-icons/fi';
import { api } from '../api.js';

export default function EmailGate({ allowedDomains = [], onVerified }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const domainsLabel = allowedDomains.map((d) => '@' + d).join(' or ');

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return setError('Please enter your institutional email.');
    // quick client-side domain check for instant feedback
    const domain = value.split('@')[1];
    if (allowedDomains.length && (!domain || !allowedDomains.includes(domain))) {
      return setError(`Only ${domainsLabel} email addresses can take this survey.`);
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyEmail(value);
      onVerified(res.email || value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="gate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 sm:p-9 text-center"
    >
      <img src="/logos/kl-logo.png" alt="KL University" className="mx-auto mb-4 h-16 sm:h-20 object-contain" />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <FiLock className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">Sign in to continue</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        This survey is for KLEF faculty and staff. Please sign in with your institutional email
        {allowedDomains.length ? (
          <>
            {' '}
            (<span className="font-semibold text-slate-700">{domainsLabel}</span>)
          </>
        ) : null}{' '}
        to begin.
      </p>

      <form onSubmit={submit} className="mx-auto mt-6 max-w-sm text-left">
        <label className="label">Institutional email</label>
        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            className="field pl-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={allowedDomains[0] ? `yourname@${allowedDomains[0]}` : 'you@institution.edu'}
            autoFocus
            autoComplete="email"
          />
        </div>
        {error && (
          <p className="mt-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
          {loading ? 'Verifying…' : 'Continue'} <FiArrowRight />
        </button>
      </form>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
        <FiShield className="text-emerald-500" />
        Your responses are confidential and used only for institutional improvement.
      </div>
    </motion.div>
  );
}

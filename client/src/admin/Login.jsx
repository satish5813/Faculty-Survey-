import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Aurora from '../components/Aurora.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(username, password);
      localStorage.setItem('klef_admin_token', res.token);
      onLogin(res.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Aurora />
      <div className="flex min-h-screen items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md rounded-[2rem] p-8 sm:p-10"
        >
          <div className="text-center">
            <img src="/logos/kl-logo.png" alt="KL" className="mx-auto h-16 object-contain" />
            <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">Admin Console</h1>
            <p className="mt-1 text-sm text-slate-500">KLEF Survey Management</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="field pl-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="field pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign In'} <FiArrowRight />
            </button>
          </form>

          <Link to="/" className="mt-6 block text-center text-sm font-semibold text-brand-600 hover:underline">
            ← Back to survey
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

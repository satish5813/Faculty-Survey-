import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiList, FiInbox, FiLogOut, FiExternalLink } from 'react-icons/fi';
import { api } from '../api.js';
import Login from './Login.jsx';
import Overview from './Overview.jsx';
import QuestionsManager from './QuestionsManager.jsx';
import Responses from './Responses.jsx';

const TABS = [
  { key: 'overview', label: 'Analytics', icon: FiBarChart2 },
  { key: 'questions', label: 'Questions', icon: FiList },
  { key: 'responses', label: 'Responses', icon: FiInbox },
];

export default function AdminApp() {
  const [authed, setAuthed] = useState(null); // null = checking
  const [username, setUsername] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('klef_admin_token');
    if (!token) return setAuthed(false);
    api
      .me()
      .then((r) => {
        setUsername(r.username);
        setAuthed(true);
      })
      .catch(() => {
        localStorage.removeItem('klef_admin_token');
        setAuthed(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem('klef_admin_token');
    setAuthed(false);
  };

  if (authed === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );

  if (!authed)
    return (
      <Login
        onLogin={(u) => {
          setUsername(u);
          setAuthed(true);
        }}
      />
    );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src="/logos/kl-logo.png" alt="KL" className="h-10 w-auto object-contain" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 leading-none">KLEF Survey</p>
            <p className="font-display text-base font-bold text-slate-900 leading-tight">Admin Console</p>
          </div>
          <Link
            to="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            <FiExternalLink className="h-3.5 w-3.5" /> View survey
          </Link>
          <span className="hidden md:block text-sm font-semibold text-slate-500">Hi, {username}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
          >
            <FiLogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                    active ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === 'overview' && <Overview />}
          {tab === 'questions' && <QuestionsManager />}
          {tab === 'responses' && <Responses />}
        </motion.div>
      </main>
    </div>
  );
}

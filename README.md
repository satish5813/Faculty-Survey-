# KLEF Employee Experience & Culture Survey

A full-stack React + MySQL application for the KL University (KLEF) faculty survey — a
beautiful, mobile-first survey wizard for faculty plus a complete admin console to manage
questions and read responses.

Built from the *Employee Experience & Culture Survey* questionnaire (7 sections,
Pride & Purpose → Satisfaction & Outlook).

```
faculty-survey/
├── server/   Express + MySQL API (schema auto-create + auto-seed on first run)
└── client/   React (Vite + Tailwind + Framer Motion) survey wizard + admin dashboard
```

## Features

**Faculty survey (`/`)**
- Animated welcome screen, multi-step wizard with a live progress bar
- Beautiful 1–5 agreement scale (color coded), animated star ratings, choice pills,
  dropdowns and open-ended text
- Fully responsive / mobile-fit, sticky navigation, required-field validation
- Anonymous — no login needed

**Admin console (`/admin`)**
- Secure JWT login (bcrypt-hashed passwords)
- **Analytics**: total responses, average scores, per-section & per-question breakdowns,
  choice distributions, and all open-ended answers
- **Questions**: add / edit / delete / show-hide questions and whole sections, choose
  answer type and options — changes appear on the live survey instantly
- **Responses**: browse every submission, open a full per-response detail view, delete,
  and export everything to CSV

## Prerequisites
- Node.js 18+
- MySQL 8 running locally

## Setup & Run

**1. Backend**
```bash
cd server
npm install
# edit .env with your MySQL password (already set for this machine)
npm start          # http://localhost:4000
```
On first start it creates the `klef_survey` database, all tables, seeds the survey
questions, and creates the default admin.

**2. Frontend** (in a second terminal)
```bash
cd client
npm install
npm run dev        # http://localhost:5173
```
The Vite dev server proxies `/api` → `http://localhost:4000`, so no CORS setup is needed.

## Default admin login
```
username: admin
password: admin123
```
Configure these in `server/.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`). They are only used
to create the admin on first run. Change the password from the API after first login for
production use, and set a strong `JWT_SECRET`.

## Tech
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, React Router, React Icons
- **Backend**: Express, mysql2, JWT, bcryptjs
- **Database**: MySQL 8 (`sections`, `questions`, `responses`, `answers`, `admins`)

## Data model notes
Every answer is stored generically (`answers` links a `response` to a `question`), so admins
can freely add, edit or remove questions without breaking existing responses. A question that
already has responses is hidden (soft-deleted) instead of hard-deleted to preserve historical
data.

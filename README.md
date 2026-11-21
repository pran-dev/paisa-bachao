# 💰 Paisa Bachao — Student Budget Manager

> A clean, Indian student-friendly pocket money and budget management platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- A Google OAuth 2.0 Client ID (optional, for Google Sign-In)
- Off Campus Code:  MZMCUW

---

## 1. MySQL Database Setup

```bash
# Login to MySQL and run the schema
mysql -u root -p < server/schema.sql
```

Or manually:
```sql
CREATE DATABASE IF NOT EXISTS paisa_bachao;
USE paisa_bachao;
-- then run the contents of server/schema.sql
```

---

## 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and secrets
```

**Edit `server/.env`:**
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=pranathi
DB_NAME=paisa_bachao
JWT_SECRET=happybirthdaybitch
GOOGLE_CLIENT_ID=your_google_client_id   # optional
CLIENT_URL=http://localhost:3000
```

```bash
# Start server (development with auto-reload)
npm run dev

# OR production start
npm start
```

Server runs at: **http://localhost:5000**
Health check: **http://localhost:5000/api/health**

---

## 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env if needed
```

**Edit `client/.env`:**
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id   # optional
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
# Start client
npm start
```

Client runs at: **http://localhost:3000**

---

## 4. Demo Account

After running the schema (which seeds a demo user):
- **Email:** `demo@paisabachao.app`
- **Password:** `demo1234`

---

## 📁 Project Structure

```
paisa-bachao/
├── server/                     # Node.js + Express backend
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js             # Register / Login / Google OAuth
│   │   ├── transactions.js     # CRUD + summary APIs
│   │   └── user.js             # Profile APIs
│   ├── schema.sql              # MySQL schema + demo seed
│   ├── index.js                # Express app entry
│   ├── .env.example
│   └── package.json
│
└── client/                     # React frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   └── axios.js        # Axios instance with JWT interceptor
        ├── components/
        │   ├── AppLayout.js    # Sidebar + topbar shell
        │   ├── AddTransactionModal.js
        │   └── CautionAlert.js # Dynamic spending alert
        ├── context/
        │   └── AuthContext.js  # Global auth state
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js    # Main budget overview
        │   ├── Transactions.js # CRUD table with filters
        │   ├── Analytics.js    # Chart.js Doughnut + Line
        │   └── Settings.js     # Profile & budget config
        ├── App.js              # Routes
        ├── index.js
        └── index.css           # Global design system
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Email/password registration |
| POST | `/api/auth/login` | ❌ | Email/password login |
| POST | `/api/auth/google` | ❌ | Google id_token login |
| POST | `/api/auth/google-access` | ❌ | Google access_token login |
| GET | `/api/user/profile` | ✅ JWT | Get user profile |
| PUT | `/api/user/profile` | ✅ JWT | Update allowance & split |
| GET | `/api/transactions` | ✅ JWT | List transactions (filterable) |
| GET | `/api/transactions/summary` | ✅ JWT | Monthly spending summary |
| POST | `/api/transactions` | ✅ JWT | Add transaction |
| PUT | `/api/transactions/:id` | ✅ JWT | Update transaction |
| DELETE | `/api/transactions/:id` | ✅ JWT | Delete transaction |

### Query Parameters (GET /api/transactions)
| Param | Type | Example |
|-------|------|---------|
| `month` | number | `10` |
| `year` | number | `2026` |
| `type` | `needs`\|`wants` | `needs` |
| `search` | string | `lunch` |
| `startDate` | date string | `2026-10-01` |
| `endDate` | date string | `2026-10-31` |

---

## ✨ Features

- **🔐 Auth** — JWT email/password + Google OAuth 2.0
- **💰 Allowance Split** — Auto 60/40 Needs/Wants buckets (configurable)
- **📋 Transactions** — Full CRUD with title, amount, type, sub-category, date, note
- **⚠️ Caution Alerts** — Dynamic warnings when savings drop below 20% or Wants near exhaustion
- **📊 Chart.js Analytics** — Doughnut (Needs vs Wants ratio) + Line chart (savings trend)
- **🔍 Live Search & Filter** — Real-time debounced search, type/sub-category/date filters
- **📱 Responsive** — Works on mobile, tablet, and desktop

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Chart.js 4, React Icons |
| Styling | Pure CSS (custom design system, no Bootstrap dependency in CSS) |
| HTTP | Axios with JWT interceptors |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 with `mysql2` |
| Auth | bcryptjs, jsonwebtoken, Google Auth Library |

---

## 🔒 Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000` to Authorized JavaScript origins
5. Copy the Client ID to both `.env` files

---

*Built with ❤️ for Indian college students.*


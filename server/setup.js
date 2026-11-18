/**
 * Paisa Bachao — Smart Database Bootstrapper
 * ─────────────────────────────────────────────────────────────────
 * Supports two modes:
 *   Interactive:  node setup.js            (prompts for credentials)
 *   Silent:       node setup.js --silent   (uses existing .env only)
 *
 * Auto-detects MySQL in common Windows locations:
 *   • MySQL Server (Program Files)
 *   • XAMPP
 *   • WAMP / WAMP64
 *   • Laragon
 *   • PATH
 */

const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');
const rl     = require('readline');
const { execSync } = require('child_process');

// ─── Colours ────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
};
const log = {
  info:    (m) => console.log(`${C.cyan}ℹ${C.reset}  ${m}`),
  ok:      (m) => console.log(`${C.green}✅${C.reset} ${m}`),
  warn:    (m) => console.log(`${C.yellow}⚠️${C.reset}  ${m}`),
  err:     (m) => console.log(`${C.red}❌${C.reset} ${m}`),
  step:    (m) => console.log(`\n${C.bold}${C.cyan}▶ ${m}${C.reset}`),
  line:    ()  => console.log(`${C.dim}${'─'.repeat(58)}${C.reset}`),
};

const SILENT = process.argv.includes('--silent');

// ─── Paths ───────────────────────────────────────────────────────────────────
const SERVER_ROOT = __dirname;
const PROJECT_ROOT = path.join(SERVER_ROOT, '..');
const ENV_PATH        = path.join(SERVER_ROOT, '.env');
const CLIENT_ENV_PATH = path.join(PROJECT_ROOT, 'client', '.env');

// ─── Parse .env ──────────────────────────────────────────────────────────────
function parseEnv(file) {
  const cfg = {};
  if (!fs.existsSync(file)) return cfg;
  fs.readFileSync(file, 'utf-8').split('\n').forEach(line => {
    const l = line.trim();
    if (!l || l.startsWith('#')) return;
    const i = l.indexOf('=');
    if (i < 0) return;
    cfg[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  });
  return cfg;
}

// ─── Prompt ──────────────────────────────────────────────────────────────────
function ask(question, def = '') {
  if (SILENT) return Promise.resolve(def);
  const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
  const q = def ? `${question} [${C.dim}${def}${C.reset}]: ` : `${question}: `;
  return new Promise(res => iface.question(q, ans => { iface.close(); res(ans.trim() || def); }));
}

// ─── Write server .env ───────────────────────────────────────────────────────
function writeServerEnv(cfg) {
  const ts = new Date().toISOString();
  fs.writeFileSync(ENV_PATH, `# Paisa Bachao — Server .env  (generated ${ts})
PORT=${cfg.PORT}
NODE_ENV=development

# MySQL
DB_HOST=${cfg.DB_HOST}
DB_PORT=${cfg.DB_PORT}
DB_USER=${cfg.DB_USER}
DB_PASSWORD=${cfg.DB_PASSWORD}
DB_NAME=${cfg.DB_NAME}

# JWT
JWT_SECRET=${cfg.JWT_SECRET}

# Google OAuth (optional)
GOOGLE_CLIENT_ID=${cfg.GOOGLE_CLIENT_ID}

# CORS
CLIENT_URL=${cfg.CLIENT_URL}
`);
  log.ok(`server/.env written`);
}

// ─── Write client .env ───────────────────────────────────────────────────────
function writeClientEnv(googleId) {
  fs.writeFileSync(CLIENT_ENV_PATH, `# Paisa Bachao — Client .env  (generated ${new Date().toISOString()})
REACT_APP_GOOGLE_CLIENT_ID=${googleId || ''}
REACT_APP_API_URL=http://localhost:5000/api
`);
  log.ok(`client/.env written`);
}

// ─── Auto-detect MySQL binary ────────────────────────────────────────────────
function findMysqlBin() {
  const candidates = [
    'mysql',   // in PATH
    'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.3\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
    'C:\\xampp\\mysql\\bin\\mysql.exe',
    'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysql.exe',
    'C:\\wamp\\bin\\mysql\\mysql8.0.31\\bin\\mysql.exe',
    'C:\\laragon\\bin\\mysql\\mysql-8.1.0-winx64\\bin\\mysql.exe',
    'C:\\laragon\\bin\\mysql\\mysql-5.7.33-winx64\\bin\\mysql.exe',
  ];
  for (const bin of candidates) {
    try {
      execSync(`"${bin}" --version`, { stdio: 'pipe' });
      return bin;
    } catch {}
  }
  return null;
}

// ─── Generate JWT secret ──────────────────────────────────────────────────────
function genJwt() {
  return `pb_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.green}╔══════════════════════════════════════════════════════╗`);
  console.log(`║   💰  Paisa Bachao — Database Auto-Setup             ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${C.reset}\n`);

  if (SILENT) log.info('Running in --silent mode (using existing .env values).\n');

  // ── STEP 1: Credentials ────────────────────────────────────────────────────
  log.step('Step 1 · Configure credentials');
  log.line();

  const existing = parseEnv(ENV_PATH);
  const isConfigured = !!existing.DB_HOST && existing.DB_PASSWORD !== 'your_mysql_password_here';

  let cfg = {
    PORT:             existing.PORT             || '5000',
    DB_HOST:          existing.DB_HOST          || 'localhost',
    DB_PORT:          existing.DB_PORT          || '3306',
    DB_USER:          existing.DB_USER          || 'root',
    DB_PASSWORD:      existing.DB_PASSWORD      || '',
    DB_NAME:          existing.DB_NAME          || 'paisa_bachao',
    JWT_SECRET:       existing.JWT_SECRET       || genJwt(),
    GOOGLE_CLIENT_ID: existing.GOOGLE_CLIENT_ID || '',
    CLIENT_URL:       existing.CLIENT_URL       || 'http://localhost:3000',
  };

  if (isConfigured && !SILENT) {
    log.info(`Found existing credentials → Host: ${cfg.DB_HOST}  User: ${cfg.DB_USER}  DB: ${cfg.DB_NAME}`);
    const redo = await ask('Reconfigure? (y/N)', 'N');
    if (redo.toLowerCase() === 'y') {
      cfg.DB_HOST     = await ask('MySQL Host',     cfg.DB_HOST);
      cfg.DB_PORT     = await ask('MySQL Port',     cfg.DB_PORT);
      cfg.DB_USER     = await ask('MySQL Username', cfg.DB_USER);
      cfg.DB_PASSWORD = await ask('MySQL Password (blank = none)', cfg.DB_PASSWORD);
      cfg.DB_NAME     = await ask('Database name',  cfg.DB_NAME);
      cfg.GOOGLE_CLIENT_ID = await ask('Google OAuth Client ID (optional)', cfg.GOOGLE_CLIENT_ID);
    }
  } else if (!isConfigured && !SILENT) {
    console.log(`\n${C.dim}Press Enter to accept the value shown in [ brackets ].${C.reset}\n`);
    cfg.DB_HOST     = await ask('MySQL Host',     cfg.DB_HOST);
    cfg.DB_PORT     = await ask('MySQL Port',     cfg.DB_PORT);
    cfg.DB_USER     = await ask('MySQL Username', cfg.DB_USER);
    cfg.DB_PASSWORD = await ask('MySQL Password (blank = none)', '');
    cfg.DB_NAME     = await ask('Database name',  cfg.DB_NAME);
    cfg.GOOGLE_CLIENT_ID = await ask('Google OAuth Client ID (optional, Enter to skip)', '');
  }

  writeServerEnv(cfg);
  writeClientEnv(cfg.GOOGLE_CLIENT_ID);

  // ── STEP 2: Connect ────────────────────────────────────────────────────────
  log.step('Step 2 · Connect to MySQL');
  log.line();

  let conn;
  try {
    conn = await mysql.createConnection({
      host:               cfg.DB_HOST,
      port:               parseInt(cfg.DB_PORT),
      user:               cfg.DB_USER,
      password:           cfg.DB_PASSWORD,
      multipleStatements: true,
      connectTimeout:     8000,
    });
    log.ok(`Connected → ${cfg.DB_HOST}:${cfg.DB_PORT} as "${cfg.DB_USER}"`);
  } catch (err) {
    log.err(`MySQL connection failed: ${err.message}`);
    log.warn('');
    log.warn('Common fixes:');
    log.warn('  • Make sure MySQL service is running (Services → MySQL80)');
    log.warn('  • Check username / password in server/.env');
    log.warn('  • For XAMPP: start the MySQL module in the control panel');
    log.warn('');
    log.warn('Then re-run:  node setup.js');
    process.exit(1);
  }

  // ── STEP 3: Database ───────────────────────────────────────────────────────
  log.step(`Step 3 · Create database "${cfg.DB_NAME}"`);
  log.line();

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${cfg.DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${cfg.DB_NAME}\``);
  log.ok(`Database "${cfg.DB_NAME}" ready`);

  // ── STEP 4: Tables ────────────────────────────────────────────────────────
  log.step('Step 4 · Create tables');
  log.line();

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                 INT AUTO_INCREMENT PRIMARY KEY,
      name               VARCHAR(100)  NOT NULL,
      email              VARCHAR(150)  NOT NULL UNIQUE,
      password_hash      VARCHAR(255)  DEFAULT NULL,
      google_id          VARCHAR(255)  DEFAULT NULL,
      avatar_url         VARCHAR(500)  DEFAULT NULL,
      monthly_allowance  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      needs_percentage   INT           NOT NULL DEFAULT 60,
      wants_percentage   INT           NOT NULL DEFAULT 40,
      currency           VARCHAR(10)   NOT NULL DEFAULT '₹',
      created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  log.ok('Table "users" ✓');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT           NOT NULL,
      title       VARCHAR(200)  NOT NULL,
      amount      DECIMAL(10,2) NOT NULL,
      type        ENUM('needs','wants') NOT NULL,
      subcategory VARCHAR(100)  NOT NULL,
      date        DATE          NOT NULL,
      note        TEXT          DEFAULT NULL,
      created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  log.ok('Table "transactions" ✓');

  // ── STEP 5: Indexes ───────────────────────────────────────────────────────
  log.step('Step 5 · Create indexes');
  log.line();

  for (const [name, sql] of [
    ['idx_tx_user_id', 'CREATE INDEX idx_tx_user_id ON transactions (user_id)'],
    ['idx_tx_date',    'CREATE INDEX idx_tx_date    ON transactions (date)'],
    ['idx_tx_type',    'CREATE INDEX idx_tx_type    ON transactions (type)'],
  ]) {
    try {
      await conn.query(sql);
      log.ok(`Index "${name}" created`);
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') log.info(`Index "${name}" already exists — OK`);
      else log.warn(`Index "${name}": ${e.message}`);
    }
  }

  // ── STEP 6: Demo Seed ─────────────────────────────────────────────────────
  log.step('Step 6 · Seed demo account');
  log.line();

  // bcrypt("demo1234", 10)
  const DEMO_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const DEMO_EMAIL = 'demo@paisabachao.app';

  const [[demoCheck]] = await conn.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);

  if (!demoCheck) {
    await conn.query(
      `INSERT INTO users (name, email, password_hash, monthly_allowance, needs_percentage, wants_percentage)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Demo Student', DEMO_EMAIL, DEMO_HASH, 5000.00, 60, 40]
    );

    const [[{ id: uid }]] = await conn.query('SELECT id FROM users WHERE email = ?', [DEMO_EMAIL]);

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = (n) => `${y}-${m}-${String(n).padStart(2,'0')}`;

    const txSeed = [
      ['PG Rent',            3500, 'needs', 'PG/Rent',        d(1)],
      ['Netflix',             149, 'wants', 'Subscriptions',   d(1)],
      ['Metro Pass',          800, 'needs', 'Travel/Commute',  d(2)],
      ['Notebook & Pen',       85, 'needs', 'Stationery',      d(3)],
      ['Canteen Lunch',        120, 'needs', 'Food',            d(4)],
      ['Canteen Dinner',        90, 'needs', 'Food',            d(5)],
      ['Movie Night',          250, 'wants', 'Movies',          d(5)],
      ['Grocery Run',          320, 'needs', 'Groceries',       d(7)],
      ['Doctor Visit',         200, 'needs', 'Medical',         d(8)],
      ['Dominos Pizza',        399, 'wants', 'Fast Food',       d(9)],
      ['Outing with friends',  600, 'wants', 'Outings',        d(12)],
      ['Laundry',               80, 'needs', 'Laundry',        d(14)],
      ['Canteen Lunch',        115, 'needs', 'Food',           d(15)],
      ['Shopping - T-shirt',   599, 'wants', 'Shopping',       d(18)],
    ];

    for (const [title, amount, type, subcat, date] of txSeed) {
      await conn.query(
        'INSERT INTO transactions (user_id, title, amount, type, subcategory, date) VALUES (?, ?, ?, ?, ?, ?)',
        [uid, title, amount, type, subcat, date]
      );
    }

    log.ok(`Demo user created  →  ${DEMO_EMAIL} / demo1234`);
    log.ok(`${txSeed.length} sample transactions seeded`);
  } else {
    log.info('Demo user already exists — skipped seeding.');
  }

  // ── STEP 7: Verify ────────────────────────────────────────────────────────
  log.step('Step 7 · Verify database');
  log.line();

  const [[{ tables }]] = await conn.query(
    `SELECT GROUP_CONCAT(table_name ORDER BY table_name) AS tables
     FROM information_schema.tables WHERE table_schema = ?`,
    [cfg.DB_NAME]
  );
  const [[{ users }]]  = await conn.query('SELECT COUNT(*) AS users FROM users');
  const [[{ txns }]]   = await conn.query('SELECT COUNT(*) AS txns  FROM transactions');

  log.ok(`Tables:       ${tables}`);
  log.ok(`Users:        ${users}`);
  log.ok(`Transactions: ${txns}`);

  await conn.end();

  // ── MySQL binary tip ──────────────────────────────────────────────────────
  const mysqlBin = findMysqlBin();
  if (mysqlBin) {
    log.info(`\nMySQL CLI found at: ${C.cyan}${mysqlBin}${C.reset}`);
    log.info(`Manual connect:  "${mysqlBin}" -u ${cfg.DB_USER} -p ${cfg.DB_NAME}`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log(`\n${C.bold}${C.green}╔══════════════════════════════════════════════════════╗`);
  console.log(`║   🎉  Setup Complete — Ready to Launch!               ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${C.reset}\n`);

  console.log(`${C.bold}Run the app:${C.reset}`);
  console.log(`  Terminal 1  ${C.cyan}cd server  →  npm run dev${C.reset}`);
  console.log(`  Terminal 2  ${C.cyan}cd client  →  npm start${C.reset}`);
  console.log(`\n  Browser     ${C.cyan}http://localhost:3000${C.reset}`);
  console.log(`  Demo login  ${C.cyan}demo@paisabachao.app${C.reset}  /  ${C.cyan}demo1234${C.reset}\n`);
}

main().catch(e => { log.err(e.message); process.exit(1); });

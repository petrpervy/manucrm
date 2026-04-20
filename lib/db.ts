import postgres from 'postgres';

// Singleton — reuse across hot-reloads in dev, one instance per serverless worker in prod
let _sql: ReturnType<typeof postgres> | null = null;

export function getDB() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Create a .env.local file — see .env.local.example'
    );
  }
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL);
  }
  return _sql;
}

export type DB = ReturnType<typeof getDB>;

// Module-level flag so schema only initializes once per server instance
let initialized = false;

export async function ensureSchema(db: DB): Promise<void> {
  if (initialized) return;

  await db`
    CREATE TABLE IF NOT EXISTS customers (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      company     TEXT    DEFAULT '',
      email       TEXT    DEFAULT '',
      phone       TEXT    DEFAULT '',
      address     TEXT    DEFAULT '',
      notes       TEXT    DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id              SERIAL PRIMARY KEY,
      customer_id     INTEGER NOT NULL REFERENCES customers(id),
      order_number    TEXT UNIQUE NOT NULL,
      product_name    TEXT NOT NULL,
      quantity        INTEGER NOT NULL DEFAULT 1,
      specifications  TEXT    DEFAULT '',
      deadline        DATE,
      status          TEXT NOT NULL DEFAULT 'Received'
                      CHECK(status IN ('Received','In Production','Completed','Delivered')),
      notes           TEXT    DEFAULT '',
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS order_status_log (
      id          SERIAL PRIMARY KEY,
      order_id    INTEGER NOT NULL REFERENCES orders(id),
      old_status  TEXT,
      new_status  TEXT NOT NULL,
      changed_by  TEXT,
      changed_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Idempotent updated_at trigger
  await db`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$
  `;

  await db`DROP TRIGGER IF EXISTS orders_updated_at ON orders`;
  await db`
    CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `;

  // Seed demo data on first run
  const [{ count }] = await db`SELECT COUNT(*)::int as count FROM customers`;
  if (count === 0) {
    await seedDemoData(db);
  }

  initialized = true;
}

async function seedDemoData(db: DB): Promise<void> {
  const customers = [
    { name: 'Acme Industries',            company: 'Acme Corp',            email: 'john.smith@acme.com',        phone: '555-0101', address: '123 Industrial Blvd, Rochester NY', notes: 'Long-term account. Prefers weekly updates.' },
    { name: 'Rochester Metals',           company: 'Rochester Metals LLC', email: 'orders@rochestermetals.com', phone: '555-0182', address: '456 Factory Rd, Rochester NY',      notes: 'Rush orders common. Always confirm deadline.' },
    { name: 'Great Lakes Fabrication',    company: 'GL Fab Inc',           email: 'procurement@glfab.com',      phone: '555-0247', address: '789 Mill St, Buffalo NY',           notes: 'New client as of Jan 2026.' },
    { name: 'Empire State Manufacturing', company: 'ESM Group',            email: 'buying@esmgroup.net',        phone: '555-0315', address: '321 Commerce Ave, Syracuse NY',     notes: 'High-volume orders. Net-30 terms.' },
  ];

  const ids: number[] = [];
  for (const c of customers) {
    const [row] = await db`
      INSERT INTO customers (name, company, email, phone, address, notes)
      VALUES (${c.name}, ${c.company}, ${c.email}, ${c.phone}, ${c.address}, ${c.notes})
      RETURNING id
    `;
    ids.push(row.id as number);
  }

  const orders = [
    { cid: ids[0], num: 'ORD-2026-001', product: 'Steel Brackets',     qty: 500,  specs: 'Grade A steel, 4-hole bracket, 2" x 4"',              deadline: '2026-04-25', status: 'Delivered',     notes: 'Completed ahead of schedule.' },
    { cid: ids[0], num: 'ORD-2026-002', product: 'Mounting Plates',    qty: 200,  specs: 'Stainless, 1/4" thick, 6" x 6"',                       deadline: '2026-05-10', status: 'In Production', notes: '' },
    { cid: ids[1], num: 'ORD-2026-003', product: 'Custom Flanges',     qty: 75,   specs: 'Carbon steel, ASME B16.5 standard',                     deadline: '2026-04-30', status: 'Completed',     notes: 'QC passed 4/15.' },
    { cid: ids[1], num: 'ORD-2026-004', product: 'Pipe Fittings',      qty: 1000, specs: 'Schedule 40, 1" NPT threads',                           deadline: '2026-05-20', status: 'Received',      notes: 'Rush order confirmed.' },
    { cid: ids[2], num: 'ORD-2026-005', product: 'Welded Frames',      qty: 30,   specs: 'Square tube, 1.5" x 1.5", powder coated black',         deadline: '2026-05-05', status: 'In Production', notes: '' },
    { cid: ids[3], num: 'ORD-2026-006', product: 'Sheet Metal Panels', qty: 400,  specs: '16-gauge cold-rolled, laser cut to spec',               deadline: '2026-05-15', status: 'Received',      notes: 'Drawings attached to email.' },
  ];

  for (const o of orders) {
    const [row] = await db`
      INSERT INTO orders (customer_id, order_number, product_name, quantity, specifications, deadline, status, notes)
      VALUES (${o.cid}, ${o.num}, ${o.product}, ${o.qty}, ${o.specs}, ${o.deadline}, ${o.status}, ${o.notes})
      RETURNING id
    `;
    await db`
      INSERT INTO order_status_log (order_id, old_status, new_status, changed_by)
      VALUES (${row.id as number}, null, ${o.status}, 'System (seed)')
    `;
  }
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function fmtDate(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'string') return d.split('T')[0];
  return null;
}

function fmtTs(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return null;
}

export function formatRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    deadline:        fmtDate(row.deadline),
    created_at:      fmtTs(row.created_at),
    updated_at:      fmtTs(row.updated_at),
    changed_at:      fmtTs(row.changed_at),
    last_order_date: fmtTs(row.last_order_date),
  };
}

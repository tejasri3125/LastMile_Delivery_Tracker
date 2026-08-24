const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Use /tmp directory on Vercel serverless environment to avoid read-only filesystem errors
const dbPath = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME 
  ? path.join('/tmp', 'delivery_tracker.sqlite') 
  : path.resolve(__dirname, 'delivery_tracker.sqlite');

let dbInstance = null;

function saveDB() {
  if (dbInstance) {
    try {
      const data = dbInstance.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.warn('DB Save warning:', e.message);
    }
  }
}

async function getDB() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(filebuffer);
  } else {
    dbInstance = new SQL.Database();
  }
  return dbInstance;
}

async function run(sql, params = []) {
  const db = await getDB();
  db.run(sql, params);
  saveDB();
  const res = db.exec("SELECT last_insert_rowid() as id");
  const lastID = (res && res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) || 0;
  return { lastID };
}

async function get(sql, params = []) {
  const db = await getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

async function all(sql, params = []) {
  const db = await getDB();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function initDB() {
  console.log('Initializing database schema (sql.js WASM Engine)...');

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'customer', 'agent')) NOT NULL,
      phone TEXT,
      assigned_zone_id INTEGER,
      is_available INTEGER DEFAULT 1,
      current_lat REAL,
      current_lng REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Zones Table
  await run(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Pincodes Mapping Table
  await run(`
    CREATE TABLE IF NOT EXISTS pincodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pincode TEXT UNIQUE NOT NULL,
      area_name TEXT NOT NULL,
      zone_id INTEGER NOT NULL,
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE
    )
  `);

  // Rate Cards Table
  await run(`
    CREATE TABLE IF NOT EXISTS rate_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_type TEXT CHECK(order_type IN ('B2B', 'B2C')) NOT NULL,
      scope TEXT CHECK(scope IN ('INTRA_ZONE', 'INTER_ZONE')) NOT NULL,
      base_weight_kg REAL NOT NULL,
      base_rate REAL NOT NULL,
      per_kg_rate REAL NOT NULL,
      min_charge REAL NOT NULL,
      UNIQUE(order_type, scope)
    )
  `);

  // System Configuration Table
  await run(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    )
  `);

  // Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      agent_id INTEGER,
      order_type TEXT CHECK(order_type IN ('B2B', 'B2C')) NOT NULL,
      payment_type TEXT CHECK(payment_type IN ('Prepaid', 'COD')) NOT NULL,
      pickup_address TEXT NOT NULL,
      pickup_pincode TEXT NOT NULL,
      pickup_zone_id INTEGER,
      drop_address TEXT NOT NULL,
      drop_pincode TEXT NOT NULL,
      drop_zone_id INTEGER,
      length_cm REAL NOT NULL,
      width_cm REAL NOT NULL,
      height_cm REAL NOT NULL,
      actual_weight_kg REAL NOT NULL,
      volumetric_weight_kg REAL NOT NULL,
      billed_weight_kg REAL NOT NULL,
      base_charge REAL NOT NULL,
      cod_surcharge REAL DEFAULT 0,
      total_charge REAL NOT NULL,
      status TEXT CHECK(status IN ('CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED')) NOT NULL DEFAULT 'CREATED',
      reschedule_reason TEXT,
      rescheduled_date TEXT,
      scheduled_delivery_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    )
  `);

  // Order Tracking Logs (Immutable Audit History)
  await run(`
    CREATE TABLE IF NOT EXISTS order_tracking_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      notes TEXT,
      location_lat REAL,
      location_lng REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // System Notification Sandbox Log Table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT,
      recipient_phone TEXT,
      subject TEXT,
      body TEXT NOT NULL,
      channel TEXT CHECK(channel IN ('EMAIL', 'SMS')) NOT NULL,
      order_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default data if empty
  await seedInitialData();
  console.log('Database initialized successfully with WASM engine!');
}

async function seedInitialData() {
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (userCount.count > 0) return; // already seeded

  console.log('Seeding initial system data...');

  // 1. Seed Zones
  await run(`INSERT INTO zones (code, name, description) VALUES 
    ('ZONE-N', 'North Zone', 'Delhi NCR, Gurgaon, Noida region'),
    ('ZONE-S', 'South Zone', 'Bangalore, Chennai, Hyderabad hub'),
    ('ZONE-W', 'West Zone', 'Mumbai, Pune, Ahmedabad corridor'),
    ('ZONE-E', 'East Zone', 'Kolkata, Howrah, Guwahati region')
  `);

  // 2. Seed Pincodes
  await run(`INSERT INTO pincodes (pincode, area_name, zone_id) VALUES 
    ('110001', 'Connaught Place, Delhi', 1),
    ('110002', 'Daryaganj, Delhi', 1),
    ('122001', 'Cyber City, Gurgaon', 1),
    ('560001', 'MG Road, Bangalore', 2),
    ('560002', 'Indiranagar, Bangalore', 2),
    ('560003', 'Koramangala, Bangalore', 2),
    ('400001', 'Fort, Mumbai', 3),
    ('400002', 'Kalbadevi, Mumbai', 3),
    ('400051', 'Bandra Kurla Complex, Mumbai', 3),
    ('700001', 'BBD Bagh, Kolkata', 4),
    ('700002', 'Cossipore, Kolkata', 4)
  `);

  // 3. Seed Rate Cards (Admin Configurable)
  await run(`INSERT INTO rate_cards (order_type, scope, base_weight_kg, base_rate, per_kg_rate, min_charge) VALUES 
    ('B2B', 'INTRA_ZONE', 5.0, 50.0, 5.0, 50.0),
    ('B2B', 'INTER_ZONE', 5.0, 120.0, 12.0, 120.0),
    ('B2C', 'INTRA_ZONE', 1.0, 40.0, 15.0, 40.0),
    ('B2C', 'INTER_ZONE', 1.0, 80.0, 25.0, 80.0)
  `);

  // 4. Seed Config
  await run(`INSERT INTO system_config (key, value, description) VALUES 
    ('volumetric_divisor', '5000', 'Volumetric weight calculation divisor (L x W x H in cm / divisor)'),
    ('b2b_cod_surcharge', '50', 'Flat COD surcharge in currency for B2B orders'),
    ('b2c_cod_surcharge', '25', 'Flat COD surcharge in currency for B2C orders')
  `);

  // 5. Seed Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Admin
  await run(`INSERT INTO users (name, email, password, role, phone) VALUES 
    ('Logistics Admin', 'admin@logistics.com', '${hashedPassword}', 'admin', '+18005550199')
  `);

  // Customers
  await run(`INSERT INTO users (name, email, password, role, phone) VALUES 
    ('Acme Enterprise Solutions', 'customer@acme.com', '${hashedPassword}', 'customer', '+18004443322'),
    ('Sarah Jenkins', 'sarah@gmail.com', '${hashedPassword}', 'customer', '+19876543210')
  `);

  // Delivery Agents
  await run(`INSERT INTO users (name, email, password, role, phone, assigned_zone_id, is_available, current_lat, current_lng) VALUES 
    ('Rajesh Kumar (Agent)', 'agent.rajesh@logistics.com', '${hashedPassword}', 'agent', '+919811122233', 1, 1, 28.6139, 77.2090),
    ('Vikram Singh (Agent)', 'agent.vikram@logistics.com', '${hashedPassword}', 'agent', '+919822233344', 3, 1, 19.0760, 72.8777),
    ('Anita Roy (Agent)', 'agent.anita@logistics.com', '${hashedPassword}', 'agent', '+919833344455', 2, 1, 12.9716, 77.5946)
  `);

  // 6. Seed Sample Orders with Immutable Tracking Logs
  // Order 1: Delivered
  await run(`INSERT INTO orders (
    tracking_number, customer_id, agent_id, order_type, payment_type, 
    pickup_address, pickup_pincode, pickup_zone_id, drop_address, drop_pincode, drop_zone_id, 
    length_cm, width_cm, height_cm, actual_weight_kg, volumetric_weight_kg, billed_weight_kg, 
    base_charge, cod_surcharge, total_charge, status, scheduled_delivery_date
  ) VALUES (
    'TRK-1001-DEL', 2, 1, 'B2B', 'Prepaid',
    'Acme Warehouse, Connaught Place', '110001', 1, 'Tech Hub, Daryaganj', '110002', 1,
    40, 30, 20, 2.5, 4.8, 4.8, 50.0, 0.0, 50.0, 'DELIVERED', '2026-08-23'
  )`);

  await run(`INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes) VALUES 
    (1, 'CREATED', 'customer', 'Acme Enterprise Solutions', 'Order placed with prepaid auto-calculated charge ₹50'),
    (1, 'ASSIGNED', 'system', 'Auto Assignment Engine', 'Assigned to nearest available agent Rajesh Kumar'),
    (1, 'PICKED_UP', 'agent', 'Rajesh Kumar (Agent)', 'Package collected from Acme Warehouse'),
    (1, 'IN_TRANSIT', 'agent', 'Rajesh Kumar (Agent)', 'Departed North Hub toward destination'),
    (1, 'OUT_FOR_DELIVERY', 'agent', 'Rajesh Kumar (Agent)', 'Out for delivery in Daryaganj area'),
    (1, 'DELIVERED', 'agent', 'Rajesh Kumar (Agent)', 'Delivered to recipient with digital signature')
  `);

  // Order 2: Failed Delivery (Demonstrating Reschedule Flow!)
  await run(`INSERT INTO orders (
    tracking_number, customer_id, agent_id, order_type, payment_type, 
    pickup_address, pickup_pincode, pickup_zone_id, drop_address, drop_pincode, drop_zone_id, 
    length_cm, width_cm, height_cm, actual_weight_kg, volumetric_weight_kg, billed_weight_kg, 
    base_charge, cod_surcharge, total_charge, status, reschedule_reason, scheduled_delivery_date
  ) VALUES (
    'TRK-1002-FLD', 3, 2, 'B2C', 'COD',
    'Sarah Residency, Fort', '400001', 3, 'BKC Office Tower, Bandra', '400051', 3,
    25, 20, 15, 1.2, 1.5, 1.5, 47.5, 25.0, 72.5, 'FAILED', 'Customer door locked / unreachable on phone', '2026-08-24'
  )`);

  await run(`INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes) VALUES 
    (2, 'CREATED', 'customer', 'Sarah Jenkins', 'Order created with COD payment'),
    (2, 'ASSIGNED', 'system', 'Auto Assignment Engine', 'Assigned to Agent Vikram Singh'),
    (2, 'PICKED_UP', 'agent', 'Vikram Singh (Agent)', 'Picked up from Fort address'),
    (2, 'OUT_FOR_DELIVERY', 'agent', 'Vikram Singh (Agent)', 'Agent arrived at drop location'),
    (2, 'FAILED', 'agent', 'Vikram Singh (Agent)', 'Delivery failed: Customer door locked / unreachable on phone. Notification sent for rescheduling.')
  `);

  await run(`INSERT INTO notifications (recipient_email, recipient_phone, subject, body, channel, order_id) VALUES 
    ('sarah@gmail.com', '+19876543210', 'Delivery Failed - Action Required', 'Your order TRK-1002-FLD could not be delivered today. Reason: Customer door locked. Please log in to your account to reschedule a new delivery date.', 'EMAIL', 2)
  `);

  // Order 3: Active In Transit
  await run(`INSERT INTO orders (
    tracking_number, customer_id, agent_id, order_type, payment_type, 
    pickup_address, pickup_pincode, pickup_zone_id, drop_address, drop_pincode, drop_zone_id, 
    length_cm, width_cm, height_cm, actual_weight_kg, volumetric_weight_kg, billed_weight_kg, 
    base_charge, cod_surcharge, total_charge, status, scheduled_delivery_date
  ) VALUES (
    'TRK-1003-ACT', 2, 3, 'B2B', 'Prepaid',
    'MG Road Electronics', '560001', 2, 'Koramangala Retail', '560003', 2,
    50, 40, 30, 8.0, 12.0, 12.0, 85.0, 0.0, 85.0, 'IN_TRANSIT', '2026-08-25'
  )`);

  await run(`INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes) VALUES 
    (3, 'CREATED', 'customer', 'Acme Enterprise Solutions', 'Order created with volumetric billing (12kg > 8kg actual)'),
    (3, 'ASSIGNED', 'system', 'Auto Assignment Engine', 'Assigned to Agent Anita Roy'),
    (3, 'PICKED_UP', 'agent', 'Anita Roy (Agent)', 'Package loaded into delivery van'),
    (3, 'IN_TRANSIT', 'agent', 'Anita Roy (Agent)', 'In transit to South Bangalore sorting hub')
  `);
}

module.exports = {
  run,
  get,
  all,
  initDB
};

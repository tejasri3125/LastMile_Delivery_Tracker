const express = require('express');
const router = express.Router();
const { get, run, all } = require('../db');
const { authenticateToken } = require('./auth');

// Middleware to ensure Admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role privilege required' });
  }
  next();
}

router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard Analytics Overview Metrics
router.get('/metrics', async (req, res) => {
  try {
    const totalOrders = await get(`SELECT COUNT(*) as count FROM orders`);
    const activeOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE status IN ('CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')`);
    const deliveredOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE status = 'DELIVERED'`);
    const failedOrders = await get(`SELECT COUNT(*) as count FROM orders WHERE status = 'FAILED'`);
    const totalRevenue = await get(`SELECT SUM(total_charge) as revenue FROM orders WHERE status = 'DELIVERED'`);
    const activeAgents = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'agent' AND is_available = 1`);

    res.json({
      totalOrders: totalOrders.count,
      activeOrders: activeOrders.count,
      deliveredOrders: deliveredOrders.count,
      failedOrders: failedOrders.count,
      totalRevenue: totalRevenue.revenue || 0,
      activeAgents: activeAgents.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zones API
router.get('/zones', async (req, res) => {
  try {
    const zones = await all(`
      SELECT z.*, COUNT(p.id) as pincode_count 
      FROM zones z
      LEFT JOIN pincodes p ON z.id = p.zone_id
      GROUP BY z.id
    `);
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/zones', async (req, res) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Code and name required' });

    const result = await run(`INSERT INTO zones (code, name, description) VALUES (?, ?, ?)`, [code, name, description || '']);
    const zone = await get(`SELECT * FROM zones WHERE id = ?`, [result.lastID]);
    res.json(zone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pincode Area Mappings
router.get('/pincodes', async (req, res) => {
  try {
    const pincodes = await all(`
      SELECT p.*, z.name as zone_name, z.code as zone_code
      FROM pincodes p
      JOIN zones z ON p.zone_id = z.id
      ORDER BY p.pincode ASC
    `);
    res.json(pincodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pincodes', async (req, res) => {
  try {
    const { pincode, areaName, zoneId } = req.body;
    if (!pincode || !areaName || !zoneId) {
      return res.status(400).json({ error: 'Pincode, areaName, and zoneId required' });
    }

    await run(`
      INSERT INTO pincodes (pincode, area_name, zone_id) VALUES (?, ?, ?)
      ON CONFLICT(pincode) DO UPDATE SET area_name = excluded.area_name, zone_id = excluded.zone_id
    `, [pincode, areaName, zoneId]);

    const record = await get(`SELECT p.*, z.name as zone_name FROM pincodes p JOIN zones z ON p.zone_id = z.id WHERE p.pincode = ?`, [pincode]);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rate Cards Configuration
router.get('/rate-cards', async (req, res) => {
  try {
    const rateCards = await all(`SELECT * FROM rate_cards ORDER BY order_type, scope`);
    res.json(rateCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rate-cards/:id', async (req, res) => {
  try {
    const { baseWeightKg, baseRate, perKgRate, minCharge } = req.body;
    await run(`
      UPDATE rate_cards 
      SET base_weight_kg = ?, base_rate = ?, per_kg_rate = ?, min_charge = ?
      WHERE id = ?
    `, [baseWeightKg, baseRate, perKgRate, minCharge, req.params.id]);

    const updated = await get(`SELECT * FROM rate_cards WHERE id = ?`, [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Configuration (Volumetric divisor, COD surcharges)
router.get('/config', async (req, res) => {
  try {
    const configs = await all(`SELECT * FROM system_config`);
    const configMap = {};
    configs.forEach(c => { configMap[c.key] = c.value; });
    res.json(configMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    await run(`
      INSERT INTO system_config (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, [key, String(value)]);

    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Agent Fleet Management
router.get('/agents', async (req, res) => {
  try {
    const agents = await all(`
      SELECT u.id, u.name, u.email, u.phone, u.assigned_zone_id, u.is_available, u.current_lat, u.current_lng,
             z.name as zone_name, z.code as zone_code,
             COUNT(o.id) as active_orders_count
      FROM users u
      LEFT JOIN zones z ON u.assigned_zone_id = z.id
      LEFT JOIN orders o ON u.id = o.agent_id AND o.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')
      WHERE u.role = 'agent'
      GROUP BY u.id
    `);
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/agents/:id', async (req, res) => {
  try {
    const { assignedZoneId, isAvailable } = req.body;
    await run(`
      UPDATE users 
      SET assigned_zone_id = ?, is_available = ?
      WHERE id = ? AND role = 'agent'
    `, [assignedZoneId, isAvailable ? 1 : 0, req.params.id]);

    const updated = await get(`SELECT id, name, assigned_zone_id, is_available FROM users WHERE id = ?`, [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notification Log Sandbox
router.get('/notifications', async (req, res) => {
  try {
    const logs = await all(`
      SELECT n.*, o.tracking_number 
      FROM notifications n
      LEFT JOIN orders o ON n.order_id = o.id
      ORDER BY n.timestamp DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

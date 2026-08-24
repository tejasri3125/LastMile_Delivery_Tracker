const express = require('express');
const router = express.Router();
const { get, run, all } = require('../db');
const { calculateOrderCharge, detectZone } = require('../rateEngine');
const { autoAssignAgent } = require('../assignmentEngine');
const { sendOrderStatusNotification } = require('../notificationEngine');
const { authenticateToken } = require('./auth');

// Price Estimate Endpoint (Calculates volumetric weight, zone scope, & line items)
router.post('/estimate', async (req, res) => {
  try {
    const { pickupPincode, dropPincode, lengthCm, widthCm, heightCm, actualWeightKg, orderType, paymentType } = req.body;
    
    if (!pickupPincode || !dropPincode || !lengthCm || !widthCm || !heightCm || !actualWeightKg || !orderType || !paymentType) {
      return res.status(400).json({ error: 'All dimensional, weight, location, and order parameters are required for estimation.' });
    }

    const estimation = await calculateOrderCharge({
      pickupPincode,
      dropPincode,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType
    });

    res.json(estimation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create New Order (Customer or Admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customerId, // optional for Admin creating on behalf of customer
      orderType,
      paymentType,
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      scheduledDeliveryDate
    } = req.body;

    const targetCustomerId = (req.user.role === 'admin' && customerId) ? customerId : req.user.id;

    // Perform Price Engine Calculation
    const calc = await calculateOrderCharge({
      pickupPincode,
      dropPincode,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType
    });

    // Generate unique tracking number
    const trackingNumber = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Insert Order
    const result = await run(`
      INSERT INTO orders (
        tracking_number, customer_id, order_type, payment_type,
        pickup_address, pickup_pincode, pickup_zone_id,
        drop_address, drop_pincode, drop_zone_id,
        length_cm, width_cm, height_cm, actual_weight_kg, volumetric_weight_kg, billed_weight_kg,
        base_charge, cod_surcharge, total_charge, status, scheduled_delivery_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CREATED', ?)
    `, [
      trackingNumber,
      targetCustomerId,
      orderType,
      paymentType,
      pickupAddress,
      pickupPincode,
      calc.pickupZone.zoneId,
      dropAddress,
      dropPincode,
      calc.dropZone.zoneId,
      calc.dimensions.lengthCm,
      calc.dimensions.widthCm,
      calc.dimensions.heightCm,
      calc.weightBreakdown.actualWeightKg,
      calc.weightBreakdown.volumetricWeightKg,
      calc.weightBreakdown.billedWeightKg,
      calc.chargeBreakdown.baseCharge,
      calc.chargeBreakdown.codSurcharge,
      calc.chargeBreakdown.totalCharge,
      scheduledDeliveryDate || new Date().toISOString().split('T')[0]
    ]);

    const orderId = result.lastID;

    // Log CREATED event in Immutable Tracking History
    await run(`
      INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes)
      VALUES (?, 'CREATED', ?, ?, ?)
    `, [
      orderId,
      req.user.role,
      req.user.name,
      `Order created with ${calc.scope} pricing. Billed weight: ${calc.weightBreakdown.billedWeightKg}kg (${calc.weightBreakdown.billedOnVolumetric ? 'Volumetric Higher' : 'Actual Weight'}). Total: ₹${calc.chargeBreakdown.totalCharge}`
    ]);

    // Trigger Auto-Assignment Engine
    const assignResult = await autoAssignAgent(orderId);

    // Fetch customer details for notification
    const customer = await get(`SELECT email, phone FROM users WHERE id = ?`, [targetCustomerId]);

    // Send Notification
    await sendOrderStatusNotification({
      orderId,
      trackingNumber,
      customerEmail: customer ? customer.email : null,
      customerPhone: customer ? customer.phone : null,
      status: assignResult.assigned ? 'ASSIGNED' : 'CREATED',
      notes: assignResult.assigned ? assignResult.message : 'Awaiting delivery agent assignment'
    });

    const newOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({
      success: true,
      order: newOrder,
      calculation: calc,
      assignment: assignResult
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Order List with Filters & Role Scoping
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, zoneId, agentId, orderType } = req.query;
    let sql = `
      SELECT o.*, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             a.name as agent_name, a.phone as agent_phone,
             pz.name as pickup_zone_name, dz.name as drop_zone_name
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users a ON o.agent_id = a.id
      LEFT JOIN zones pz ON o.pickup_zone_id = pz.id
      LEFT JOIN zones dz ON o.drop_zone_id = dz.id
      WHERE 1=1
    `;
    const params = [];

    // Role Restrictions
    if (req.user.role === 'customer') {
      sql += ` AND o.customer_id = ?`;
      params.push(req.user.id);
    } else if (req.user.role === 'agent') {
      sql += ` AND o.agent_id = ?`;
      params.push(req.user.id);
    }

    // Query Filters
    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }
    if (zoneId) {
      sql += ` AND (o.pickup_zone_id = ? OR o.drop_zone_id = ?)`;
      params.push(zoneId, zoneId);
    }
    if (agentId) {
      sql += ` AND o.agent_id = ?`;
      params.push(agentId);
    }
    if (orderType) {
      sql += ` AND o.order_type = ?`;
      params.push(orderType);
    }

    sql += ` ORDER BY o.created_at DESC`;
    const orders = await all(sql, params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Order Details + Immutable Tracking History Logs
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await get(`
      SELECT o.*, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             a.name as agent_name, a.phone as agent_phone,
             pz.name as pickup_zone_name, dz.name as drop_zone_name
      FROM orders o
      LEFT JOIN users c ON o.customer_id = c.id
      LEFT JOIN users a ON o.agent_id = a.id
      LEFT JOIN zones pz ON o.pickup_zone_id = pz.id
      LEFT JOIN zones dz ON o.drop_zone_id = dz.id
      WHERE o.id = ? OR o.tracking_number = ?
    `, [orderId, orderId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security Check: Customers can only view their own orders
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await all(`
      SELECT * FROM order_tracking_logs 
      WHERE order_id = ? 
      ORDER BY timestamp ASC
    `, [order.id]);

    res.json({ order, trackingHistory: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent / Admin Status Update Endpoint
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes, failureReason, locationLat, locationLng } = req.body;

    const validStatuses = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Status Update Query
    if (status === 'FAILED') {
      const reason = failureReason || notes || 'Customer unavailable / door locked';
      await run(`
        UPDATE orders 
        SET status = 'FAILED', reschedule_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reason, orderId]);
    } else {
      await run(`
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, orderId]);
    }

    // Add Immutable Audit History Log
    await run(`
      INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes, location_lat, location_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      orderId,
      status,
      req.user.role,
      req.user.name,
      status === 'FAILED' ? `Failed: ${failureReason || notes}` : (notes || `Status updated to ${status}`),
      locationLat || null,
      locationLng || null
    ]);

    // Send Notification to Customer
    const customer = await get(`SELECT email, phone FROM users WHERE id = ?`, [order.customer_id]);
    await sendOrderStatusNotification({
      orderId,
      trackingNumber: order.tracking_number,
      customerEmail: customer ? customer.email : null,
      customerPhone: customer ? customer.phone : null,
      status,
      notes: status === 'FAILED' ? (failureReason || notes) : notes
    });

    const updatedOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Reschedule Failed Delivery Endpoint
router.post('/:id/reschedule', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { newDate, notes } = req.body;

    if (!newDate) {
      return res.status(400).json({ error: 'Preferred rescheduling date is required' });
    }

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only failed deliveries can be rescheduled' });
    }

    // Update Order to RESCHEDULED
    await run(`
      UPDATE orders 
      SET status = 'RESCHEDULED', scheduled_delivery_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newDate, orderId]);

    // Add Immutable Log Entry
    await run(`
      INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes)
      VALUES (?, 'RESCHEDULED', ?, ?, ?)
    `, [
      orderId,
      req.user.role,
      req.user.name,
      `Customer requested rescheduling for date ${newDate}. Notes: ${notes || 'None'}`
    ]);

    // Trigger Intelligent Re-assignment Engine for Rescheduled Attempt
    const assignResult = await autoAssignAgent(orderId);

    // Notify Customer & System
    const customer = await get(`SELECT email, phone FROM users WHERE id = ?`, [order.customer_id]);
    await sendOrderStatusNotification({
      orderId,
      trackingNumber: order.tracking_number,
      customerEmail: customer ? customer.email : null,
      customerPhone: customer ? customer.phone : null,
      status: 'RESCHEDULED',
      notes: `Rescheduled for ${newDate}. Delivery agent reassigned.`,
      scheduledDate: newDate
    });

    const updatedOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({
      success: true,
      message: 'Delivery rescheduled successfully!',
      order: updatedOrder,
      reassignment: assignResult
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Manual Agent Assignment
router.post('/:id/assign', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orderId = req.params.id;
    const { agentId } = req.body;

    const agent = await get(`SELECT * FROM users WHERE id = ? AND role = 'agent'`, [agentId]);
    if (!agent) return res.status(404).json({ error: 'Delivery agent not found' });

    await run(`
      UPDATE orders 
      SET agent_id = ?, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [agentId, orderId]);

    await run(`
      INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes)
      VALUES (?, 'ASSIGNED', 'admin', ?, ?)
    `, [orderId, req.user.name, `Admin manually assigned order to agent ${agent.name}`]);

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Manual Status Override
router.post('/:id/override', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const orderId = req.params.id;
    const { status, notes } = req.body;

    await run(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, orderId]);

    await run(`
      INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes)
      VALUES (?, ?, 'admin', ?, ?)
    `, [orderId, status, req.user.name, `Admin override: ${notes || 'Status updated by admin'}`]);

    const order = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const { run, get, all } = require('./db');

/**
 * Intelligent Delivery Agent Auto-Assignment
 * Scores available agents based on zone matching & current active workload
 */
async function autoAssignAgent(orderId) {
  // 1. Fetch Order Details
  const order = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!order) throw new Error('Order not found');

  // 2. Query Available Agents with their active order counts
  const availableAgents = await all(`
    SELECT u.id, u.name, u.email, u.phone, u.assigned_zone_id, u.current_lat, u.current_lng,
           COUNT(o.id) as active_orders_count
    FROM users u
    LEFT JOIN orders o ON u.id = o.agent_id 
      AND o.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')
    WHERE u.role = 'agent' AND u.is_available = 1
    GROUP BY u.id
  `);

  if (!availableAgents || availableAgents.length === 0) {
    return {
      assigned: false,
      reason: 'No active agents available currently. Order remains in CREATED status for manual admin assignment.'
    };
  }

  // 3. Selection Scoring:
  // Step A: Prefer agents whose assigned_zone_id matches pickup_zone_id
  const zoneAgents = availableAgents.filter(a => a.assigned_zone_id === order.pickup_zone_id);
  
  let selectedAgent = null;
  if (zoneAgents.length > 0) {
    // Pick agent in zone with minimum active orders
    zoneAgents.sort((a, b) => a.active_orders_count - b.active_orders_count);
    selectedAgent = zoneAgents[0];
  } else {
    // Fallback: Pick any available agent with minimum active orders
    availableAgents.sort((a, b) => a.active_orders_count - b.active_orders_count);
    selectedAgent = availableAgents[0];
  }

  // 4. Assign Agent to Order
  await run(`
    UPDATE orders 
    SET agent_id = ?, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [selectedAgent.id, orderId]);

  // 5. Add Immutable Audit History Log
  await run(`
    INSERT INTO order_tracking_logs (order_id, status, actor_role, actor_name, notes)
    VALUES (?, 'ASSIGNED', 'system', 'Auto Assignment Engine', ?)
  `, [
    orderId, 
    `Auto-assigned to agent ${selectedAgent.name} (Zone: ${selectedAgent.assigned_zone_id === order.pickup_zone_id ? 'In-Zone Match' : 'System Wide Fallback'}, Active Workload: ${selectedAgent.active_orders_count} orders)`
  ]);

  return {
    assigned: true,
    agent: selectedAgent,
    message: `Successfully assigned order ${order.tracking_number} to ${selectedAgent.name}`
  };
}

module.exports = {
  autoAssignAgent
};

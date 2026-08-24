# System Design Write-Up: Last-Mile Delivery Management Platform

## 1. Rate Calculation Engine & Volumetric Logic
Logistics pricing requires balancing package volume (space utilization) with dead weight. Our rate calculation engine implements standard IATA volumetric weight pricing alongside a fully dynamic, database-driven rate matrix.

### Volumetric Weight Formula
When creating an order, package dimensions ($L \times B \times H$ in centimeters) are converted into volumetric weight using an admin-configurable divisor (default: $5000$):
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$

The billable chargeable weight is derived via:
$$\text{Billed Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### Dynamic Pricing & Rate Cards
Zero pricing constants are hardcoded. Rate cards are stored in the database matrix indexed by `(order_type, scope)` where:
- `order_type`: `B2B` or `B2C`
- `scope`: `INTRA_ZONE` (pickup & drop in same zone) or `INTER_ZONE` (cross-zone)

Base freight charge covers weight up to `base_weight_kg`. Weight exceeding the base limit is billed at `per_kg_rate`:
$$\text{Freight Charge} = \max\left(\text{min\_charge}, \text{base\_rate} + \max(0, \text{Billed Weight} - \text{base\_weight}) \times \text{per\_kg\_rate}\right)$$

For Cash on Delivery (`COD`) orders, a flat surcharge (`b2b_cod_surcharge` or `b2c_cod_surcharge`) is appended. The engine outputs an itemized breakdown prior to order confirmation.

---

## 2. Dynamic Zone Detection Approach
To avoid rigid hardcoding of geographic boundaries, locations are modeled using relational pincode mappings:
- `zones`: `(id, code, name, description)`
- `pincodes`: `(id, pincode, area_name, zone_id)`

When an order is created with pickup pincode $P_A$ and drop pincode $P_B$:
1. The system executes a fast lookup query against `pincodes`.
2. If mapped, the associated `zone_id` is assigned. If unmapped, a regional fallback heuristic estimates the zone code from the pincode prefix or assigns the primary hub zone.
3. The scope rule evaluates:
   $$\text{Scope} = \begin{cases} \text{INTRA\_ZONE} & \text{if } \text{pickup\_zone\_id} = \text{drop\_zone\_id} \\ \text{INTER\_ZONE} & \text{if } \text{pickup\_zone\_id} \neq \text{drop\_zone\_id} \end{cases}$$

Admins can dynamically map new pincodes or create operational zones without requiring server restarts.

---

## 3. Intelligent Auto-Assignment & Availability Model
The auto-assignment engine balances driver proximity and current active workload to prevent bottlenecking.

### Agent Availability Model
Delivery agents have an operational status `is_available` ($1$ for On Duty, $0$ for Offline) and an `assigned_zone_id`. Active workload $W_A$ is defined as the count of orders currently in states `['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']`.

### Selection Algorithm
When an order is placed:
1. **In-Zone Filter**: Query available agents ($is\_available = 1$) whose `assigned_zone_id` matches `order.pickup_zone_id`.
2. **Workload Sorting**: If in-zone agents exist, select the agent with the lowest active workload $W_A$.
3. **System Fallback**: If no in-zone agent is available, query all available agents across the network and select the agent with the minimum $W_A$.
4. **State Transition**: Order transitions to `ASSIGNED`, and an immutable tracking record is written to `order_tracking_logs`. Admin manual override is supported.

---

## 4. Failed Delivery & Reschedule Lifecycle
Failed delivery attempts are treated as high-priority exceptions managed through an explicit, immutable state lifecycle:

```
[OUT_FOR_DELIVERY] --> (Agent flags failure with reason) --> [FAILED] 
                                                                |
                                                                v
[ASSIGNED] <-- (Auto-Reassignment Engine) <-- [RESCHEDULED] <-- (Customer selects new date)
```

1. **Failure Flagging**: An agent marks an order as `FAILED`, supplying a structured failure reason (e.g., *Customer Door Locked*).
2. **Notification Dispatch**: An urgent notification (Email & SMS logged to `notifications` table) is sent to the customer detailing the failure reason.
3. **Customer Reschedule**: The customer logs into their portal and selects a new delivery date and address instructions.
4. **State Transition & Re-assignment**: Order status transitions to `RESCHEDULED`. The assignment engine is automatically re-invoked to assign a fresh agent attempt for the target delivery date.

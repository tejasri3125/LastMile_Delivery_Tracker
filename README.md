# Last-Mile Delivery Management Platform

> A full-stack delivery management platform featuring dynamic rate calculation, volumetric weight estimation, dynamic zone detection, intelligent agent auto-assignment, immutable tracking history, failed delivery rescheduling flow, and role-based portals for Customers, Delivery Agents, and Admins.

---

## 🌟 Key Features

1. **Dynamic Rate Calculation Engine**:
   - Computes Volumetric Weight: $(L \times B \times H) / 5000$.
   - Bills on higher of Actual Dead Weight vs Volumetric Weight.
   - Detects **Intra-Zone** vs **Inter-Zone** delivery based on postal pincodes.
   - Admin-configurable B2B & B2C rate cards (base rate, per-kg rate, min charge).
   - Dynamic Cash on Delivery (COD) surcharges per order type.
   - Itemized transparent fee breakdown preview modal before order confirmation.

2. **Intelligent Auto-Assignment Engine**:
   - Automatically assigns orders to available agents based on zone matching and active workload balancing.
   - Fallback mechanism for system-wide available agents.
   - Manual admin assignment override support.

3. **Immutable Lifecycle Tracking History**:
   - Order Statuses: `CREATED` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED` / `FAILED` → `RESCHEDULED`.
   - Audit trail table (`order_tracking_logs`) logs every status change with exact timestamp, actor role, actor name, notes, and coordinates.

4. **Failed Delivery & Rescheduling Flow**:
   - Delivery agents flag failed attempts with structured reasons.
   - Customers receive instant automated notifications (Email/SMS) with direct rescheduling prompt.
   - Customers pick new delivery date & address correction notes.
   - System updates status to `RESCHEDULED` and triggers agent re-assignment.

5. **Role-Based Portals & Quick Role Switcher**:
   - **Customer Portal**: Create shipments with live estimation, track timeline, reschedule failed orders.
   - **Agent Portal**: Toggle duty status, view assigned tasks, update order statuses (Picked Up, In Transit, Delivered, Flag Failed).
   - **Admin Dashboard**: Logistics analytics metrics, order manager with filters & overrides, zone & area pincode mapper, rate card editor, fleet manager, live notification sandbox.

---

## 📁 Project Directory Structure

```
last-mile-delivery-tracker/
├── package.json               # Root runner script
├── README.md                  # Comprehensive setup & API documentation
├── SYSTEM_DESIGN.md           # 800-word System Design write-up
├── .env.example               # Environment configuration template
├── server/                    # Node.js + Express Backend
│   ├── index.js               # Main Express app & server startup
│   ├── db.js                  # SQLite database connection & seed initializer
│   ├── rateEngine.js          # Volumetric & Zone Rate Calculation Engine
│   ├── assignmentEngine.js    # Workload-balanced Agent Auto-Assignment
│   ├── notificationEngine.js  # Email/SMS Notification dispatcher & sandbox logger
│   └── routes/
│       ├── auth.js            # User authentication & demo role switcher
│       ├── orders.js          # Order CRUD, estimation, status, reschedule APIs
│       └── admin.js           # Admin analytics, zones, rate cards, config APIs
└── client/                    # React + Vite + Tailwind CSS Frontend
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Main app shell & role switcher
        ├── api.js             # Axios API client bindings
        └── components/
            ├── Navbar.jsx
            ├── CustomerPortal.jsx
            ├── AgentPortal.jsx
            ├── AdminPortal.jsx
            ├── RateCalculatorModal.jsx
            ├── TrackingTimelineModal.jsx
            ├── RescheduleModal.jsx
            ├── NotificationSandbox.jsx
            └── SystemDesignDocView.jsx
```

---

## 🚀 Quick Setup & Local Running Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step 1: Install Dependencies
From the root project folder, run:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Environment Configuration
Copy the `.env.example` file in `/server`:
```bash
cp .env.example .env
```
*(Default settings use SQLite and local memory logging so no external database or SMTP configuration is required).*

### Step 3: Run the Application

**Option A: Development Mode (2 Terminals)**
- **Terminal 1 (Backend API Server - Port 5000)**:
  ```bash
  cd server
  npm start
  ```
- **Terminal 2 (Frontend Client - Port 3000)**:
  ```bash
  cd client
  npm run dev
  ```

Access the Web Application in your browser at: **`http://localhost:3000`**

---

## 🔑 Demo Login Accounts

The application includes a built-in 1-click **Role Switcher Bar** in the top navigation bar. You can also log in manually using the pre-seeded credentials:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@logistics.com` | `password123` | Full logistics management & rate card configuration access |
| **Customer (B2B)** | `customer@acme.com` | `password123` | Acme Enterprise Solutions account |
| **Customer (B2C)** | `sarah@gmail.com` | `password123` | Sarah Jenkins account (has demo failed order ready for rescheduling) |
| **Delivery Agent** | `agent.rajesh@logistics.com` | `password123` | North Zone Delivery Agent |

---

## 🗄️ Database Schema & Data Model

### Tables Overview
1. **`users`**: Role-based users (`admin`, `customer`, `agent`). Stores zone assignments and agent availability status (`is_available`).
2. **`zones`**: Regional operational hubs (`ZONE-N`, `ZONE-S`, `ZONE-W`, `ZONE-E`).
3. **`pincodes`**: Area mapping linking postal pincodes to zones (`pincode`, `area_name`, `zone_id`).
4. **`rate_cards`**: Dynamic rate matrix (`order_type` [B2B/B2C], `scope` [INTRA_ZONE/INTER_ZONE], `base_weight_kg`, `base_rate`, `per_kg_rate`, `min_charge`).
5. **`system_config`**: Global settings (`volumetric_divisor`, `b2b_cod_surcharge`, `b2c_cod_surcharge`).
6. **`orders`**: Core orders storage with actual vs volumetric weight, pickup/drop zones, base charge, COD surcharge, total charge, and status.
7. **`order_tracking_logs`**: Immutable audit logs capturing every status transition with timestamp, actor name, actor role, notes, and lat/lng.
8. **`notifications`**: Real-time dispatch log for Email & SMS customer alerts.

---

## 📡 API Documentation

### 1. Auth & Demo APIs
- `POST /api/auth/login`: Authenticates user and returns JWT token.
- `POST /api/auth/register`: Registers new customer or agent account.
- `GET /api/auth/demo-users`: Fetches list of pre-seeded accounts for 1-click role switching.

### 2. Orders APIs
- `POST /api/orders/estimate`: Calculates dimensional volumetric weight, zone scope, base rate, COD surcharge, and returns itemized breakdown.
- `POST /api/orders`: Creates new shipment, triggers auto-assignment, logs `CREATED` status, and sends customer notification.
- `GET /api/orders`: Returns order list (filtered by status, zone, agent, order type). Scoped automatically to customer or agent if applicable.
- `GET /api/orders/:id`: Fetches order detail and full immutable tracking history timeline.
- `POST /api/orders/:id/status`: Updates order status (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`).
- `POST /api/orders/:id/reschedule`: Captures new preferred date, updates status to `RESCHEDULED`, and re-triggers agent auto-assignment.

### 3. Admin APIs
- `GET /api/admin/metrics`: Returns executive dashboard analytics metrics.
- `GET /api/admin/zones` & `POST /api/admin/zones`: Zone management endpoints.
- `GET /api/admin/pincodes` & `POST /api/admin/pincodes`: Pincode to zone mapping endpoints.
- `GET /api/admin/rate-cards` & `PUT /api/admin/rate-cards/:id`: Configurable rate matrix editor endpoints.
- `GET /api/admin/config` & `POST /api/admin/config`: System configuration parameters.
- `GET /api/admin/agents` & `PUT /api/admin/agents/:id`: Fleet management & agent availability endpoints.
- `GET /api/admin/notifications`: Fetches live notification dispatch logs for visual UI sandbox.

---

## 🧮 Rate Calculation Engine Logic

```
1. Calculate Volumetric Weight:
   Volumetric Weight = (Length * Width * Height) / Volumetric Divisor (5000)

2. Determine Billed Weight:
   Billed Weight = MAX(Actual Dead Weight, Volumetric Weight)

3. Detect Pickup and Drop Zones:
   Pickup Zone = Lookup(Pickup Pincode)
   Drop Zone = Lookup(Drop Pincode)
   Scope = (Pickup Zone == Drop Zone) ? 'INTRA_ZONE' : 'INTER_ZONE'

4. Fetch Rate Card:
   Lookup rate_cards WHERE order_type = OrderType AND scope = Scope

5. Compute Freight Charge:
   Base Charge = base_rate + MAX(0, Billed Weight - base_weight_kg) * per_kg_rate
   Freight Charge = MAX(base_charge, min_charge)

6. Compute COD Surcharge:
   COD Surcharge = (PaymentType == 'COD') ? cod_surcharge_config : 0

7. Total Charge:
   Total Charge = Freight Charge + COD Surcharge
```

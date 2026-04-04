☕ POS Cafe System — Full Stack (Claude README)
🚀 Overview

A complete real-time POS system for cafes with:

Admin dashboard
POS terminal (cashier UI)
Kitchen display (real-time)
Customer display
QR-based self ordering
Reporting dashboard

Built with:

Frontend: React + Vite
Backend: Node.js + Express
Database: PostgreSQL (Knex ORM)
Realtime: Socket.io
Auth: JWT + Zod validation
🧠 System Architecture
Express REST API + Socket server
PostgreSQL with migrations
Modular backend (auth, orders, payments, etc.)
Real-time kitchen updates via sockets
Multi-role system (admin, staff, kitchen)
📦 Project Structure
root/
 ├── backend/
 │   ├── src/
 │   │   ├── modules/
 │   │   ├── middleware/
 │   │   ├── utils/
 │   │   └── db/
 │   └── knexfile.js
 │
 ├── frontend/
 │   ├── src/
 │   │   ├── pages/
 │   │   ├── components/
 │   │   ├── store/
 │   │   └── api/
 │
 └── README.md

heres the github repo that you have to make commmits on each step basis: 
build from scratch 
POS Cafe build checklist
0%
reset
1
Git setup
git init, create main and develop branches, push to GitHub
Create .gitignore (node_modules, .env, dist)
Create /backend and /frontend folders at root
Write root README.md
git checkout -b feature/backend-setup
2
Backend initial setup
cd backend && npm init -y
Install: express, dotenv, cors, helmet, cookie-parser, express-rate-limit
Install: bcryptjs, jsonwebtoken, zod, knex, pg, winston, socket.io, nodemailer, qrcode
Install devDeps: nodemon, eslint
Create .env.example — DB creds, JWT secrets, PORT 4000, FRONTEND_URL
Create knexfile.js — dev/prod configs pointing to local PostgreSQL
Create src/db/index.js — single Knex instance
Create src/utils/logger.js — Winston (colorized dev, JSON prod)
Create src/utils/response.js — ok(), created(), badRequest(), unauthorized(), notFound(), conflict() helpers
Create src/middleware/errorHandler.js — Zod errors (400), PG unique (409), JWT (401), generic 500
Create src/middleware/validate.js — validate(schema) and validateQuery(schema) Zod factories
Create src/middleware/auth.js — requireAuth (JWT verify → req.user) + requireRole(...roles)
Create src/app.js — Express with helmet, cors, json, cookie-parser, rate limiter, Socket.io attached
Test: npm run dev → server running on 4000
3
Database — PostgreSQL + migrations
createdb pos_cafe in PostgreSQL, set DB_PASSWORD in .env
Migration 001_users: id (uuid), name, email (unique), password_hash, role enum (admin/staff/kitchen), is_active, refresh_token_hash, timestamps
Migration 002_pos_configs: id, name, enable_cash (bool), enable_digital (bool), enable_upi (bool), upi_id (varchar), last_session_id FK nullable
Migration 003_sessions: id, pos_config_id FK, opened_by FK users, opened_at, closed_at, opening_cash, closing_cash, status enum (open/closed)
Migration 004_floors_tables: floors (id, name, pos_config_id FK, sequence, is_active) + tables (id, floor_id FK, table_number, seats, active, qr_token unique)
Migration 005_products: product_categories (id, name, color, sequence) + products (id, name, category_id FK, price decimal, tax_percent, unit_of_measure, description, is_active)
Migration 006_product_variants: product_variants (id, product_id FK, attribute_name, value, unit, extra_price) — e.g Pack/6/Unit/+$20
Migration 007_customers: id, name, email nullable, phone, street1, street2, city, state, country, total_sales decimal default 0
Migration 008_orders: id, session_id FK, table_id FK nullable, customer_id FK nullable, order_number (auto increment per session), status enum (draft/paid), subtotal, tax_amount, total, notes, created_by FK, timestamps
Migration 009_order_lines: id, order_id FK (CASCADE), product_id FK, variant_id FK nullable, quantity decimal, unit_price, tax_percent, subtotal, total, notes
Migration 010_payments: id, order_id FK, method enum (cash/digital/upi), amount decimal, reference varchar nullable, status enum (pending/confirmed), created_at
Migration 011_kitchen: kitchen_tickets (id, order_id FK unique, status enum to_cook/preparing/completed, sent_at, completed_at) + kitchen_ticket_items (id, ticket_id FK CASCADE, order_line_id FK, product_name, quantity, is_prepared bool default false)
Migration 012_self_order_tokens: id, table_id FK, session_id FK, token (unique random string), is_active bool, created_at
Add indexes: orders(session_id), orders(status), order_lines(order_id), kitchen_tickets(status), payments(order_id), tables(qr_token)
npm run migrate — confirm all 12 tables created with no errors
Create seeds/01_demo.js — 1 admin user, 1 pos_config (Odoo Cafe), 1 floor (Ground Floor), 5 tables, 3 categories (Food/Drink/Dessert), 8 products with prices and tax
npm run seed — verify data in each table via psql or pgAdmin
4
Backend — Auth module
validation.js — signupSchema (name, email valid, password 8+ upper+lower+digit+special, role enum), loginSchema
service.js — signup(): check email unique → "This email is already registered", bcrypt hash (salt 12), insert user
service.js — login(): find by email, bcrypt compare → "Invalid email or password", sign JWT access (15m) + refresh (7d httpOnly cookie), store hashed refresh in DB
service.js — refreshToken(), logout() (clear DB hash + cookie)
routes.js — POST /auth/signup, POST /auth/login, POST /auth/logout (requireAuth), POST /auth/refresh
Test signup with bad email → 400 field error. Test login wrong password → 401. Test duplicate email → 409
5
Backend — POS config + sessions
POS config service: list(), getById(), create(name), update(id, {enable_cash, enable_digital, enable_upi, upi_id})
POS config routes: GET /pos-configs, POST /pos-configs, GET /pos-configs/:id, PUT /pos-configs/:id — all requireRole(admin)
Sessions service: openSession(pos_config_id, user_id, opening_cash) — creates session, updates pos_config.last_session_id
Sessions service: closeSession(id, user_id, closing_cash) — status=closed, closes session
Sessions service: getActiveSession(pos_config_id) — returns current open session or null
Sessions routes: POST /sessions/open, POST /sessions/:id/close, GET /sessions/active/:pos_config_id, GET /sessions/:id
6
Backend — Floors, tables, self-order tokens
Floors service + routes: GET /floors, POST /floors (name, pos_config_id), PUT /floors/:id, DELETE /floors/:id
Tables service: list(floor_id), create(floor_id, table_number, seats), update(id), toggleActive(id)
Tables routes: GET /tables?floor_id=, POST /tables, PUT /tables/:id, PATCH /tables/:id/toggle
Self-order token service: generateToken(table_id, session_id) — creates unique token, returns URL e.g. /s/:token
Self-order routes: POST /tables/:id/generate-token, GET /self-order/:token (public — returns table + session + pos_config info)
QR PDF route: GET /tables/qr-pdf — generates PDF with one QR per table using qrcode library
7
Backend — Products and categories
Categories service: list(), create(name, color, sequence), update(id), resequence([{id,sequence}])
Categories routes: GET /categories, POST /categories, PUT /categories/:id, PUT /categories/resequence
Products service: list({search, category_id, is_active, page, limit}), getById(id), create(data), update(id, data), toggleActive(id)
Products service: addVariant(product_id, {attribute_name, value, unit, extra_price}), removeVariant(variant_id)
Products routes: GET /products, POST /products, GET /products/:id, PUT /products/:id, PATCH /products/:id/toggle, POST /products/:id/variants, DELETE /products/variants/:id
Test: create product with duplicate name → still works (only SKU not unique here). Create variant for Burger (Pack/6/Unit/$20). List products with category filter.
8
Backend — Customers
Customers service: list({search, page, limit}), getById(id), create(data), update(id, data)
Customers validation: name required, email valid format or empty, phone optional, state autocomplete (return list of Indian states)
Customers routes: GET /customers, POST /customers, GET /customers/:id, PUT /customers/:id, GET /customers/states (returns state list for dropdown)
9
Backend — Orders (core POS logic)
Orders service: create(session_id, table_id, created_by) — auto-generate order_number per session (SELECT MAX(order_number)+1), insert order with status=draft
Orders service: addLine(order_id, {product_id, variant_id, quantity, notes}) — insert order_line, recalculate order subtotal/tax/total atomically
Orders service: updateLine(line_id, {quantity}) — update qty, recalculate totals
Orders service: removeLine(line_id) — delete line, recalculate totals
Orders service: setCustomer(order_id, customer_id)
Orders service: list({session_id, status, search, page, limit}) with JOIN session + table + customer
Orders service: getById(id) — returns order + all lines with product name + variant details
Orders routes: GET /orders, POST /orders, GET /orders/:id, POST /orders/:id/lines, PUT /orders/:id/lines/:line_id, DELETE /orders/:id/lines/:line_id, PATCH /orders/:id/customer
Archive/delete: only draft orders can be deleted. POST /orders/:id/archive (soft delete), DELETE /orders/:id (hard, only draft)
10
Backend — Payments
Payments service: createPayment(order_id, method, amount) — validates method is enabled in pos_config, validates total matches, inserts payment
Payments service: validatePayment(payment_id) — sets status=confirmed, sets order status=paid, adds amount to customer.total_sales if customer set
Payments service: generateUpiQr(order_id) — reads upi_id from pos_config, generates QR string using qrcode library, returns base64 PNG
Payments service: list({method, date_from, date_to}) — group by payment method for reporting
Payments routes: POST /payments, POST /payments/:id/validate, GET /payments/upi-qr/:order_id, GET /payments
11
Backend — Kitchen display (real-time)
Kitchen service: sendToKitchen(order_id) — creates kitchen_ticket (status=to_cook) + kitchen_ticket_items from order_lines, emits Socket.io event "new_ticket" to room kitchen_:session_id
Kitchen service: updateTicketStatus(ticket_id, status) — to_cook→preparing→completed, emits "ticket_updated" socket event
Kitchen service: markItemPrepared(item_id) — sets is_prepared=true on ticket item, emits "item_prepared" socket event
Kitchen service: listTickets(session_id, status) — returns tickets with items, product names, quantities
Socket.io setup: on connection, join room kitchen_:session_id. Rooms isolate each POS terminal kitchen.
Kitchen routes: POST /kitchen/send/:order_id, PATCH /kitchen/tickets/:id/status, PATCH /kitchen/items/:id/prepare, GET /kitchen/tickets?session_id=&status=
Test: send order to kitchen → ticket appears in to_cook. Click ticket → moves to preparing. Click item → strikethrough (is_prepared=true).
12
Backend — Reporting dashboard
Reports service: getDashboard({pos_config_id, period, session_id, responsible_id, product_id}) — returns total_orders, revenue, avg_order
Reports service: getSalesChart(filters) — returns data points grouped by hour/day/week/month based on period
Reports service: getTopSellingCategory(filters) — GROUP BY category, SUM revenue
Reports service: getTopProducts(filters) — top 5 products by qty and revenue
Reports service: getTopOrders(filters) — highest value orders with order number, date, session, total
Reports routes: GET /reports/dashboard, GET /reports/sales-chart, GET /reports/top-categories, GET /reports/top-products, GET /reports/top-orders
13
Frontend — setup
cd frontend && npm create vite@latest . -- --template react
Install: @tanstack/react-query, zustand, react-router-dom, react-hook-form, zod, @hookform/resolvers, axios
Install: socket.io-client, recharts, react-hot-toast, date-fns
Create src/api/axios.js — base URL from env, Bearer token interceptor, 401 refresh + retry
Create src/store/authStore.js — Zustand: user, accessToken, setAuth(), clearAuth()
Create src/store/posStore.js — Zustand: activeSession, activePosConfig, activeTable, currentOrder
Create src/socket.js — Socket.io client connecting to backend, joins kitchen room on session open
Create .env — VITE_API_URL=http://localhost:4000/api, VITE_SOCKET_URL=http://localhost:4000
Wrap App in QueryClientProvider + BrowserRouter + Toaster
Create ProtectedRoute component — redirects to /login if no token. Create RoleRoute — redirects if wrong role.
14
Frontend — UI atoms
Button — variants: primary, secondary, danger, ghost. Loading spinner state.
Input — label, error message, forward ref, focus ring
Select — label, options array, error message
Modal — overlay wrapper, title, children, footer slot
Badge — draft(gray), paid(green), to_cook(amber), preparing(blue), completed(green), cancelled(red)
DataTable — columns config, rows, onRowClick, checkbox selection, bulk action slot, empty state, pagination
Navbar — top nav: Orders / Products / Reporting, user avatar dropdown (back to home, logout)
ColorPicker — 5-6 fixed color circles for category color selection
15
Frontend — Auth pages
Login page — Email/Username + Password (toggle show/hide), Login button, "Sign Up here" link
Signup page — Name, Email, Password (show/hide), Sign Up button, "Login" link. Inline field errors on blur.
Email validation: "Please enter a valid email address". Password: show 4 live rule hints (upper/lower/digit/special).
16
Frontend — Admin backend pages
POS Config page — shows "Odoo Cafe" terminal card (last open, last sell amount). "Open Session" button. "+ New" button opens popup modal with Name field + Save/Discard.
POS Config settings: Payment Method section — Cash toggle, Digital toggle, UPI toggle + UPI ID input field. Save settings.
Orders list page — DataTable: Order No, Session, Date, Total, Customer, Status badge. Checkbox selection. Action dropdown (Archive, Delete — delete only for draft). Click row → order detail.
Order detail page — Order Number header, Date, Session, Customer fields. Products tab: table with Product, QTY, Amount, Tax, UOM, Sub-Total, Total. Extra Info tab. Footer: Total w/t, Tax, Final Total. Status buttons: Draft / Paid.
Payments page — DataTable grouped by payment method (Cash, Card, UPI). Each group shows subtotal. Columns: Payment method, Date, Amount.
Customers list page — DataTable: Name, Contact (email + phone), Total Sales. Search bar. "New" button → customer form modal.
Customer form modal — Name, Email, Phone, Address (Street 1, Street 2, City, State dropdown with autocomplete, Country dropdown). Save.
Products list page — DataTable: Product, Sale Price, Tax, UOM, Category badge (colored). Checkbox + Action (Archive, Delete). "New" button → product form.
Product form page — General Info tab: Name, Category dropdown, Price, UOM dropdown, Tax dropdown (5%/18%/28%), Description. Variant tab: add rows (Attribute, Value, Unit dropdown, Extra Prices). Save.
Product Categories page — list with drag-drop resequencing. New row inline on "New" click. Color picker widget (5 fixed colors). Delete button per row.
Floor Plan settings page — Floor Plan checkbox toggle. "+ Plan" button opens floor form: Floor Name, Point of Sale dropdown, Tables table (Number, Seats, Active toggle, Appointment Resource). Bulk action: Duplicate, Delete.
17
Frontend — POS terminal
Open Session flow — click "Open Session" on config card → sets activeSession in posStore → redirect to POS terminal /pos/:config_id
POS terminal top menu — Table tab (→ floor view), Register tab (→ register/order screen), Orders tab (→ orders list). Right side: Reload Data, Go to Back-end, Close Register buttons.
Floor view — grid of table cards (Table 1…N). Table card shows number. Selected table highlighted. Click table → go to order screen for that table.
Order screen — Left: product grid filtered by category tabs (Quick Bites, Drinks, Dessert, All). Search bar. Each product card shows name + price. Right: order cart (lines with qty +/- controls, price, remove). Bottom: Customer button, Notes button, Prices button, Send button (→ kitchen), Payment button. Total shown.
Category filter tabs — clicking category filters product grid. "All" shows everything. Categories come from GET /categories.
Product click → adds to cart. If product has variants, open variant selection popup before adding.
Send button → POST /kitchen/send/:order_id → shows "Sent to kitchen" toast. Button shows qty badge.
Payment screen — shows total amount. Three payment method buttons: Cash, Digital (Bank, Card), UPI. Click method to enter amount. Validate button. Customer field. Notes field. Is Invoice checkbox. Number pad.
UPI QR flow — click UPI method → modal opens showing QR code (from GET /payments/upi-qr/:order_id), amount, Confirmed + Cancel buttons. On Confirmed → POST /payments/:id/validate → payment confirmation screen ("Amount Paid $X", Email Receipt, Continue). Click anywhere → back to floor view.
Payment confirmation screen — shows logo, "Amount Paid $580". Click anywhere → dismisses → redirect to floor view automatically.
18
Frontend — Kitchen display
Kitchen display route /kitchen/:session_id — connects Socket.io, joins room kitchen_:session_id on mount
Top bar — All count, To Cook count (badge), Preparing count (badge), Completed count (badge). Search bar. Pagination (1-3 <> arrows).
Filter sidebar — Products list (only products in active tickets). Categories list. Clicking filters visible tickets.
Ticket cards — card shows order number (#2205), items list (3x Burger, 3x Pizza etc). Click card → moves entire ticket to next stage (to_cook→preparing→completed). Click individual item line → marks is_prepared=true (strike-through).
Real-time updates — Socket.io "new_ticket" event → new card appears instantly. "ticket_updated" → card moves stage. "item_prepared" → item gets strikethrough.
19
Frontend — Customer display
Customer display route /customer-display — accessible by appending /customer-display to DB URL. No auth required.
Shows current order items list (product name, qty, price). Sub-total, Tax, Total. Left side: logo + "Welcome to Store Name".
UPI QR state — when payment method is UPI, show QR modal overlay on customer display simultaneously.
"Thank you for shopping with us" screen shown after order is paid.
20
Frontend — Reporting dashboard
Reports page /reporting — top filter bar: Period dropdown (Today/Weekly/Monthly/365 days/Custom), Responsible dropdown, Session dropdown, Product dropdown.
KPI cards row — Total Orders, Revenue (with % vs last period), Average Order (with % vs last period). Dynamic based on filters.
Sales line chart (Recharts) — Y axis = revenue, X axis = time. Updates dynamically when period changes.
Top Selling Category pie chart (Recharts) — legend shows category names with % (Pizza 45%, Burger 30%, Drink 25% etc).
Top Orders table — Order, Session, Amount/Date, Sale, In-session, Employee, Time columns. Highest value orders shown.
Top Products table — Product name, Qty, Revenue columns. Top 5 by revenue.
Top Category table — Category, Revenue columns.
21
Validation & security checklist
Email field: "Please enter a valid email address" on blur
Password: show 4 rule hints live (uppercase ✗ → ✓ as user types)
Duplicate email on signup: "This email is already registered"
Order cannot be validated without at least 1 product line
Payment amount must equal order total — reject if mismatch
Only admin can: create/edit pos_config, manage products, manage floors, view reports
Only open session orders are editable — paid orders are read-only
Delete only allowed on draft orders — paid orders can only be archived
Access token in Zustand memory only — NEVER localStorage. Refresh token httpOnly cookie.
All routes require requireAuth. Admin routes require requireRole("admin").
Rate limiter on /api/auth — 20 req per 15 min. Helmet.js headers. CORS restricted.
22
Testing & submission
Fresh DB: drop + recreate pos_cafe, run migrate, run seed — confirm no errors
Full POS flow: login → open session → select table → add products → send to kitchen → pay (cash) → confirm paid
UPI QR flow: add products → payment → click UPI → QR appears → confirm → paid → back to floor
Kitchen display: open /kitchen/:session_id in second tab → send order → ticket appears in real time
Kitchen actions: click ticket → moves to preparing. Click item → strikethrough. Click again → completed.
Reports: change period to Weekly → charts + KPIs update dynamically
Validation: wrong email format, short password, duplicate email — all show correct inline errors
Admin-only test: login as staff → try to access /products/new → blocked (403)
git: merge all feature branches → develop → main. Commit history: feat:/fix:/chore: prefixes.
Final README: setup steps, demo credentials, architecture summary, API endpoints list
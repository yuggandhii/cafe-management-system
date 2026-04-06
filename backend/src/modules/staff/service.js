const db = require('../../db');

// ─── Unified Shift History (POS Sessions + Kitchen Attendance) ──────────────
const getShifts = async ({ from, to, staff_id } = {}) => {
  // 1) POS Staff — from sessions table
  const sessionQuery = db('sessions')
    .select(
      db.raw('sessions.id::text as id'),
      'sessions.opened_at',
      'sessions.closed_at',
      'sessions.status',
      'sessions.opening_cash',
      'sessions.closing_cash',
      'users.id as user_id',
      'users.name as staff_name',
      'users.email as staff_email',
      'users.role as staff_role',
      db.raw("'session' as source"),
      db.raw('EXTRACT(EPOCH FROM (COALESCE(sessions.closed_at, NOW()) - sessions.opened_at))/3600 as hours_worked')
    )
    .leftJoin('users', 'sessions.opened_by', 'users.id')
    .orderBy('sessions.opened_at', 'desc');

  if (staff_id) sessionQuery.where('sessions.opened_by', staff_id);
  if (from) sessionQuery.where('sessions.opened_at', '>=', from);
  if (to) sessionQuery.where('sessions.opened_at', '<=', to);

  const sessionShifts = await sessionQuery;

  // 2) Kitchen Staff — from attendance table
  const attendQ = db('staff_attendance')
    .select(
      db.raw('staff_attendance.id::text as id'),
      db.raw('staff_attendance.clock_in as opened_at'),
      db.raw('staff_attendance.clock_out as closed_at'),
      db.raw("CASE WHEN staff_attendance.clock_out IS NULL THEN 'open' ELSE 'closed' END as status"),
      db.raw('0 as opening_cash'),
      db.raw('NULL as closing_cash'),
      'users.id as user_id',
      'users.name as staff_name',
      'users.email as staff_email',
      'users.role as staff_role',
      db.raw("'attendance' as source"),
      db.raw('COALESCE(staff_attendance.hours_worked, EXTRACT(EPOCH FROM (COALESCE(staff_attendance.clock_out, NOW()) - staff_attendance.clock_in))/3600) as hours_worked')
    )
    .leftJoin('users', 'staff_attendance.staff_id', 'users.id')
    .orderBy('staff_attendance.clock_in', 'desc');

  if (staff_id) attendQ.where('staff_attendance.staff_id', staff_id);
  if (from) attendQ.where('staff_attendance.clock_in', '>=', from);
  if (to) attendQ.where('staff_attendance.clock_in', '<=', to);

  const attendanceShifts = await attendQ;

  // Enrich session rows with order stats
  const sessionResult = await Promise.all(sessionShifts.map(async (shift) => {
    const stats = await db('orders')
      .where({ session_id: shift.id, status: 'paid' })
      .select(db.raw('COUNT(*) as order_count'), db.raw('COALESCE(SUM(total), 0) as revenue'))
      .first();
    const payments = await db('staff_payments')
      .where({ session_id: shift.id })
      .select(db.raw('COALESCE(SUM(amount), 0) as total_paid'))
      .first();
    return {
      ...shift,
      hours_worked: parseFloat(shift.hours_worked || 0).toFixed(2),
      order_count: parseInt(stats?.order_count || 0),
      revenue: parseFloat(stats?.revenue || 0).toFixed(2),
      total_paid: parseFloat(payments?.total_paid || 0).toFixed(2),
    };
  }));

  // Attendance rows (kitchen) — no order revenue
  const attendanceResult = attendanceShifts.map(shift => ({
    ...shift,
    hours_worked: parseFloat(shift.hours_worked || 0).toFixed(2),
    order_count: 0,
    revenue: '0.00',
    total_paid: '0.00',
  }));

  // Merge and sort newest-first
  return [...sessionResult, ...attendanceResult]
    .sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));
};

// ─── Attendance Clock-In ──────────────────────────────────────────────────────
const clockIn = async (staff_id) => {
  const active = await db('staff_attendance').where({ staff_id, status: 'clocked_in' }).first();
  if (active) {
    const err = new Error('Staff is already clocked in');
    err.statusCode = 409;
    throw err;
  }
  const [record] = await db('staff_attendance')
    .insert({ staff_id, clock_in: db.fn.now(), status: 'clocked_in' })
    .returning('*');
  return record;
};

// ─── Attendance Clock-Out ─────────────────────────────────────────────────────
const clockOut = async (staff_id) => {
  const active = await db('staff_attendance')
    .where({ staff_id, status: 'clocked_in' })
    .orderBy('clock_in', 'desc')
    .first();
  if (!active) {
    const err = new Error('No active clock-in found');
    err.statusCode = 404;
    throw err;
  }
  const now = new Date();
  const hours = (now - new Date(active.clock_in)) / 3600000;
  const [record] = await db('staff_attendance')
    .where({ id: active.id })
    .update({ clock_out: now, status: 'clocked_out', hours_worked: hours.toFixed(2) })
    .returning('*');
  return record;
};

// ─── Today's Attendance ───────────────────────────────────────────────────────
const getTodayAttendance = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db('staff_attendance')
    .select('staff_attendance.*', 'users.name as staff_name', 'users.role as staff_role')
    .leftJoin('users', 'staff_attendance.staff_id', 'users.id')
    .where('staff_attendance.clock_in', '>=', today)
    .orderBy('staff_attendance.clock_in', 'desc');
};

// ─── Attendance Summary (30-day) ──────────────────────────────────────────────
const getAttendanceSummary = async () => {
  return db('staff_attendance')
    .select(
      'users.id as staff_id',
      'users.name as staff_name',
      'users.role as staff_role',
      db.raw("DATE(staff_attendance.clock_in) as work_date"),
      db.raw('COUNT(*) as shifts'),
      db.raw('SUM(COALESCE(staff_attendance.hours_worked, 0)) as total_hours')
    )
    .leftJoin('users', 'staff_attendance.staff_id', 'users.id')
    .where('staff_attendance.clock_in', '>=', db.raw("NOW() - INTERVAL '30 days'"))
    .groupBy('users.id', 'users.name', 'users.role', db.raw("DATE(staff_attendance.clock_in)"))
    .orderBy('work_date', 'desc');
};

// ─── All Staff ────────────────────────────────────────────────────────────────
const getAllStaff = async () => {
  return db('users')
    .select('id', 'name', 'email', 'role', 'is_active', 'created_at')
    .orderBy('name', 'asc');
};

// ─── Payroll: Pay Staff ───────────────────────────────────────────────────────
const payStaff = async ({ staff_id, session_id, amount, note, paid_by }) => {
  const staff = await db('users').where({ id: staff_id }).first();
  if (!staff) {
    const err = new Error('Staff not found');
    err.statusCode = 404;
    throw err;
  }
  const [payment] = await db('staff_payments')
    .insert({ staff_id, session_id: session_id || null, amount, note, paid_by, status: 'paid' })
    .returning('*');
  return payment;
};

// ─── Payroll: Compute Auto Payroll (hours × rate) ────────────────────────────
const computePayroll = async ({ staff_id, from, to }) => {
  const staff = await db('users').where({ id: staff_id }).first();
  if (!staff) {
    const err = new Error('Staff not found'); err.statusCode = 404; throw err;
  }
  const fromDate = from || new Date(new Date().setDate(new Date().getDate() - 30));
  const toDate = to || new Date();

  const attend = await db('staff_attendance')
    .where({ staff_id, status: 'clocked_out' })
    .where('clock_in', '>=', fromDate)
    .where('clock_in', '<=', toDate)
    .select(db.raw('COALESCE(SUM(hours_worked), 0) as total_hours'))
    .first();

  const sessions = await db('sessions')
    .where({ opened_by: staff_id })
    .where('opened_at', '>=', fromDate)
    .where('opened_at', '<=', toDate)
    .select(db.raw('COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - opened_at))/3600), 0) as total_hours'))
    .first();

  const totalHours = parseFloat(attend.total_hours || 0) + parseFloat(sessions.total_hours || 0);
  const hourlyRate = parseFloat(staff.hourly_rate || 0);
  const gross = totalHours * hourlyRate;

  const alreadyPaid = await db('staff_payments')
    .where({ staff_id })
    .where('created_at', '>=', fromDate)
    .where('created_at', '<=', toDate)
    .select(db.raw('COALESCE(SUM(amount), 0) as paid'))
    .first();

  return {
    staff_id,
    staff_name: staff.name,
    role: staff.role,
    hourly_rate: hourlyRate,
    total_hours: totalHours.toFixed(2),
    gross_pay: gross.toFixed(2),
    already_paid: parseFloat(alreadyPaid?.paid || 0).toFixed(2),
    balance_due: (gross - parseFloat(alreadyPaid?.paid || 0)).toFixed(2),
    from: fromDate,
    to: toDate,
  };
};

// ─── Payroll: Get all staff payments ─────────────────────────────────────────
const getStaffPayments = async ({ staff_id } = {}) => {
  const query = db('staff_payments')
    .select(
      'staff_payments.*',
      'users.name as staff_name',
      'payer.name as paid_by_name',
      'sessions.opened_at as session_date'
    )
    .leftJoin('users', 'staff_payments.staff_id', 'users.id')
    .leftJoin('users as payer', 'staff_payments.paid_by', 'payer.id')
    .leftJoin('sessions', 'staff_payments.session_id', 'sessions.id')
    .orderBy('staff_payments.created_at', 'desc');
  if (staff_id) query.where('staff_payments.staff_id', staff_id);
  return query;
};

// ─── Staff Summary Cards ──────────────────────────────────────────────────────
const getStaffSummary = async () => {
  const staff = await db('users')
    .select('users.id', 'users.name', 'users.email', 'users.role', 'users.hourly_rate')
    .where('users.is_active', true);

  const result = await Promise.all(staff.map(async (s) => {
    const sessions = await db('sessions')
      .where({ opened_by: s.id })
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - opened_at))/3600), 0) as total_hours')
      )
      .first();

    const attendance = await db('staff_attendance')
      .where({ staff_id: s.id })
      .select(db.raw('COALESCE(SUM(hours_worked), 0) as attend_hours'))
      .first();

    const orders = await db('orders')
      .leftJoin('sessions', 'orders.session_id', 'sessions.id')
      .where('sessions.opened_by', s.id)
      .where('orders.status', 'paid')
      .select(
        db.raw('COUNT(*) as total_orders'),
        db.raw('COALESCE(SUM(orders.total), 0) as total_revenue')
      )
      .first();

    const paid = await db('staff_payments')
      .where({ staff_id: s.id })
      .select(db.raw('COALESCE(SUM(amount), 0) as total_paid'))
      .first();

    const avg_order = parseInt(orders.total_orders) > 0
      ? parseFloat(orders.total_revenue) / parseInt(orders.total_orders) : 0;

    const atpt = await db('kitchen_tickets').where('status', 'completed')
      .select(db.raw('AVG(EXTRACT(EPOCH FROM (completed_at - sent_at))/60) as avg_mins')).first();

    const totalHours = parseFloat(sessions.total_hours || 0) + parseFloat(attendance.attend_hours || 0);
    const gross_pay = (totalHours * parseFloat(s.hourly_rate || 0)).toFixed(2);

    // Today's clock-in status
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRecord = await db('staff_attendance')
      .where({ staff_id: s.id }).where('clock_in', '>=', todayStart).orderBy('clock_in', 'desc').first();

    return {
      ...s,
      total_sessions: parseInt(sessions.total_sessions),
      total_hours: totalHours.toFixed(2),
      total_orders: parseInt(orders.total_orders),
      total_revenue: parseFloat(orders.total_revenue).toFixed(2),
      total_paid: parseFloat(paid.total_paid).toFixed(2),
      avg_order: avg_order.toFixed(2),
      avg_prep_time: parseFloat(atpt?.avg_mins || 0).toFixed(1),
      gross_pay,
      balance_due: (parseFloat(gross_pay) - parseFloat(paid.total_paid)).toFixed(2),
      today_status: todayRecord?.status || 'not_clocked_in',
      today_clock_in: todayRecord?.clock_in || null,
    };
  }));

  return result;
};

module.exports = {
  getShifts, getAllStaff, payStaff, getStaffPayments, getStaffSummary,
  clockIn, clockOut, getTodayAttendance, getAttendanceSummary, computePayroll
};

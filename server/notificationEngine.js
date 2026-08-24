const { run } = require('./db');
const nodemailer = require('nodemailer');

// Optional SMTP setup via environment variables
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

/**
 * Dispatch Status Change Notification
 * Logs to DB notification log table for live UI preview and attempts Nodemailer send if configured.
 */
async function sendOrderStatusNotification({
  orderId,
  trackingNumber,
  customerEmail,
  customerPhone,
  status,
  notes,
  scheduledDate
}) {
  const subjectMap = {
    'CREATED': `Order ${trackingNumber} Confirmed`,
    'ASSIGNED': `Delivery Agent Assigned for Order ${trackingNumber}`,
    'PICKED_UP': `Order ${trackingNumber} Picked Up`,
    'IN_TRANSIT': `Order ${trackingNumber} In Transit`,
    'OUT_FOR_DELIVERY': `Order ${trackingNumber} Out for Delivery!`,
    'DELIVERED': `Order ${trackingNumber} Delivered Successfully`,
    'FAILED': `Delivery Attempt Failed - Order ${trackingNumber}`,
    'RESCHEDULED': `Order ${trackingNumber} Rescheduled Successfully`
  };

  const subject = subjectMap[status] || `Order ${trackingNumber} Status Update: ${status}`;

  let body = `Hello,\n\nYour order ${trackingNumber} has been updated to status: ${status}.\n`;
  if (notes) body += `Details: ${notes}\n`;
  if (scheduledDate) body += `Scheduled Date: ${scheduledDate}\n`;
  
  if (status === 'FAILED') {
    body += `\nPlease log in to your account dashboard to select a new delivery date and reschedule your package.`;
  }

  body += `\n\nThank you for choosing Last-Mile Logistics!`;

  // 1. Log to DB Notifications (Visual Sandbox & Audit)
  if (customerEmail) {
    await run(`
      INSERT INTO notifications (recipient_email, recipient_phone, subject, body, channel, order_id)
      VALUES (?, ?, ?, ?, 'EMAIL', ?)
    `, [customerEmail, customerPhone || '', subject, body, orderId]);
  }

  if (customerPhone) {
    const smsBody = `Logistics Update: Order ${trackingNumber} is now ${status}. ${status === 'FAILED' ? 'Please reschedule online.' : ''}`;
    await run(`
      INSERT INTO notifications (recipient_email, recipient_phone, subject, body, channel, order_id)
      VALUES (?, ?, ?, ?, 'SMS', ?)
    `, [customerEmail || '', customerPhone, `SMS Alert: ${status}`, smsBody, orderId]);
  }

  // 2. Dispatch real email if SMTP is configured
  if (transporter && customerEmail) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Last-Mile Logistics" <no-reply@logistics.com>',
        to: customerEmail,
        subject,
        text: body
      });
      console.log(`[SMTP] Notification email sent to ${customerEmail}`);
    } catch (err) {
      console.warn(`[SMTP Warning] Failed to send email via SMTP: ${err.message}`);
    }
  }

  return { logged: true, subject, body };
}

module.exports = {
  sendOrderStatusNotification
};

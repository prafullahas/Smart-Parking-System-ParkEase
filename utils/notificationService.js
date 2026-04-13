const nodemailer = require('nodemailer');
const twilio = require('twilio');

const DEFAULT_RETRIES = 2;

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendWithRetry = async (fn, retries = DEFAULT_RETRIES) => {
  let attempts = 0;
  let lastError = null;
  while (attempts <= retries) {
    try {
      attempts += 1;
      const result = await fn();
      return { ok: true, attempts, result, error: null };
    } catch (error) {
      lastError = error;
      if (attempts > retries) break;
      await sleep(500 * attempts);
    }
  }
  return { ok: false, attempts, result: null, error: lastError?.message || 'Unknown notification failure' };
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error('Missing email recipient');
  if (!transporter) {
    console.log(`[NOTIFICATION:EMAIL:MOCK] ${to} | ${subject} | ${text}`);
    return { provider: 'mock-email' };
  }
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`
  });
  return { provider: 'smtp', messageId: info.messageId };
};

const sendSms = async ({ to, body }) => {
  if (!to) throw new Error('Missing SMS recipient');
  if (!twilioClient || !process.env.TWILIO_SMS_FROM) {
    console.log(`[NOTIFICATION:SMS:MOCK] ${to} | ${body}`);
    return { provider: 'mock-sms' };
  }
  const msg = await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_SMS_FROM,
    to
  });
  return { provider: 'twilio-sms', sid: msg.sid };
};

const sendWhatsApp = async ({ to, body }) => {
  if (!to) throw new Error('Missing WhatsApp recipient');
  if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM) {
    console.log(`[NOTIFICATION:WHATSAPP:MOCK] ${to} | ${body}`);
    return { provider: 'mock-whatsapp' };
  }
  const msg = await twilioClient.messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  });
  return { provider: 'twilio-whatsapp', sid: msg.sid };
};

const sendNotification = async ({
  user,
  type,
  message,
  booking = null,
  emailSubject = 'ParkEase Booking Update',
  emailHtml = null,
  smsMessage = null,
  whatsappMessage = null,
  retries = DEFAULT_RETRIES
}) => {
  if (!user) return { success: false, reason: 'No user provided' };

  const textMessage = message || 'You have a new update from ParkEase.';
  const smsBody = smsMessage || textMessage;
  const whatsappBody = whatsappMessage || smsBody;
  const results = [];

  if (user.email) {
    const emailResult = await sendWithRetry(
      () => sendEmail({ to: user.email, subject: emailSubject, text: textMessage, html: emailHtml }),
      retries
    );
    results.push({
      type,
      channel: 'email',
      message: textMessage,
      status: emailResult.ok ? 'sent' : 'failed',
      provider: emailResult.result?.provider || 'unknown',
      attempts: emailResult.attempts,
      error: emailResult.error || null,
      sentAt: new Date()
    });
  }

  if (user.phone) {
    const smsResult = await sendWithRetry(() => sendSms({ to: user.phone, body: smsBody }), retries);
    results.push({
      type,
      channel: 'phone',
      message: smsBody,
      status: smsResult.ok ? 'sent' : 'failed',
      provider: smsResult.result?.provider || 'unknown',
      attempts: smsResult.attempts,
      error: smsResult.error || null,
      sentAt: new Date()
    });

    const waResult = await sendWithRetry(() => sendWhatsApp({ to: user.phone, body: whatsappBody }), retries);
    results.push({
      type,
      channel: 'whatsapp',
      message: whatsappBody,
      status: waResult.ok ? 'sent' : 'failed',
      provider: waResult.result?.provider || 'unknown',
      attempts: waResult.attempts,
      error: waResult.error || null,
      sentAt: new Date()
    });
  }

  if (booking && results.length) {
    booking.notificationLog = [...(booking.notificationLog || []), ...results];
    await booking.save();
  }

  const successCount = results.filter((r) => r.status === 'sent').length;
  return { success: successCount > 0, sentCount: successCount, results };
};

module.exports = { sendNotification };

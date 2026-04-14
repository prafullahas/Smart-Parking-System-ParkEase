const nodemailer = require('nodemailer');

const DEFAULT_RETRIES = 2;

let transporter = null;
const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const emailPort = Number(process.env.SMTP_PORT || 587);
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const emailSecure = process.env.SMTP_SECURE === 'true';

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
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

// const sendEmail = async ({ to, subject, text, html }) => {
//   if (!to) throw new Error('Missing email recipient');
//   if (!transporter) {
//     //console.log(`[NOTIFICATION:EMAIL:MOCK] ${to} | ${subject} | ${text}`);
//     await sendEmail(email, subject, message);
    
//     return { provider: 'mock-email' };
//   }
//   const info = await transporter.sendMail({
//     from: process.env.EMAIL_FROM || emailUser,
//     to,
//     subject,
//     text,
//     html: html || `<p>${text}</p>`
//   });
//   console.log(`Email sent to: ${to} | subject: ${subject} | messageId: ${info.messageId}`);
//   return { provider: 'smtp', messageId: info.messageId };
// };
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error('Missing email recipient');

  // 🔴 If transporter not configured
  if (!transporter) {
    console.log(`[MOCK EMAIL] ${to} | ${subject} | ${text}`);
    return { provider: 'mock-email' };
  }

  try {
    console.log("REAL EMAIL FUNCTION CALLED"); // ✅ Debug

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`
    });

    console.log(`Email sent to: ${to} | subject: ${subject}`);
    return { provider: 'smtp', messageId: info.messageId };

  } catch (error) {
    console.error("Email error:", error);
    throw error; // important
  }
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

  if (booking && results.length) {
    booking.notificationLog = [...(booking.notificationLog || []), ...results];
    await booking.save();
  }

  const successCount = results.filter((r) => r.status === 'sent').length;
  return { success: successCount > 0, sentCount: successCount, results };
};

module.exports = { sendNotification };

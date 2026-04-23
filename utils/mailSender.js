const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generic function to send email
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Helper to send OTP emails
const sendOtpEmail = async (to, otp, opts = {}) => {
  const subject = opts.subject || 'Your verification code';
  const expiresIn = opts.expiresIn || '10 minutes';
  const html = `
    <p>Your verification code is <strong>${otp}</strong></p>
    <p>This code will expire in ${expiresIn}.</p>
  `;
  const text = `Your verification code is ${otp}. It will expire in ${expiresIn}.`;
  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};
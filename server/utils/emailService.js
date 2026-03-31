const nodemailer = require("nodemailer");

// Create transporter — uses env vars, defaults to Ethereal (fake SMTP) if not set
const createTransporter = () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    // Return a mock transporter for development
    return {
        sendMail: async (opts) => {
            console.log(`📧 [Mock Email] To: ${opts.to} | Subject: ${opts.subject}`);
            return { messageId: "mock_" + Date.now() };
        }
    };
};

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: `"Dormify" <${process.env.EMAIL_USER || "noreply@dormify.com"}>`,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`📧 Email failed:`, err.message);
    }
};

// Welcome email after registration
const sendWelcomeEmail = (email, name) => sendEmail({
    to: email,
    subject: "Welcome to Dormify! 🏠",
    html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;border-radius:12px">
            <h1 style="color:#6366f1">Welcome to Dormify, ${name}! 🎉</h1>
            <p style="color:#555;font-size:16px">We're thrilled to have you on board. Start exploring premium student housing near your university.</p>
            <a href="${process.env.FRONTEND_URL || "https://dormify-one.vercel.app"}/listings"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
               Browse Properties →
            </a>
            <p style="margin-top:32px;color:#999;font-size:12px">Dormify — Premium Student Housing Platform</p>
        </div>
    `
});

// Booking confirmation email
const sendBookingConfirmation = (email, name, propertyTitle, moveInDate, moveOutDate, totalAmount) => sendEmail({
    to: email,
    subject: `Booking Confirmed — ${propertyTitle} ✅`,
    html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;border-radius:12px">
            <h1 style="color:#10b981">Booking Confirmed! ✅</h1>
            <p style="color:#555;font-size:16px">Hi ${name}, your booking has been successfully placed and payment confirmed.</p>
            <div style="background:#fff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e5e7eb">
                <h3 style="color:#374151;margin-top:0">${propertyTitle}</h3>
                <p style="color:#6b7280;margin:4px 0">📅 Move-in: <strong>${new Date(moveInDate).toDateString()}</strong></p>
                <p style="color:#6b7280;margin:4px 0">📅 Move-out: <strong>${new Date(moveOutDate).toDateString()}</strong></p>
                <p style="color:#6b7280;margin:4px 0">💰 Total Amount: <strong>₹${totalAmount}</strong></p>
            </div>
            <a href="${process.env.FRONTEND_URL || "https://dormify-one.vercel.app"}/bookings"
               style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
               View My Bookings →
            </a>
            <p style="margin-top:32px;color:#999;font-size:12px">Dormify — Premium Student Housing Platform</p>
        </div>
    `
});

// Password reset email
const sendPasswordResetEmail = (email, resetUrl) => sendEmail({
    to: email,
    subject: "Reset Your Dormify Password 🔐",
    html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;border-radius:12px">
            <h1 style="color:#6366f1">Password Reset Request 🔐</h1>
            <p style="color:#555;font-size:16px">You requested to reset your password. Click the button below. This link expires in 1 hour.</p>
            <a href="${resetUrl}"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
               Reset Password →
            </a>
            <p style="margin-top:16px;color:#999;font-size:12px">If you did not request a password reset, ignore this email. Your password will not change.</p>
            <p style="color:#999;font-size:12px">Dormify — Premium Student Housing Platform</p>
        </div>
    `
});

module.exports = { sendWelcomeEmail, sendBookingConfirmation, sendPasswordResetEmail };

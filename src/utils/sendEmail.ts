// src/utils/sendEmail.ts
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// tạo transporter 1 lần
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true nếu dùng 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10_000, // ⏱ 10s
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

// verify khi start server (log ra cho dễ debug)
transporter.verify((err) => {
  if (err) {
    console.error("SMTP verify failed:", err);
  } else {
    console.log("SMTP ready to send emails");
  }
});

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // QUAN TRỌNG: không throw lại
    console.error("Send email error:", err);
  }
}

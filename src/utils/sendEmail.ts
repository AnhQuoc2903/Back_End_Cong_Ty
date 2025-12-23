// src/utils/sendEmail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  try {
    await resend.emails.send({
      from: "MuseumPro <support@quan-ly-hien-vat.online>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Resend email error:", err);
  }
}

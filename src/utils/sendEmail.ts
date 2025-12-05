import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: "TaskShifts <no-reply@taskshifts.com>",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

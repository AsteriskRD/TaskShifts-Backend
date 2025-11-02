import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Construct reset link (frontend URL)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"TaskShifts" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "TaskShifts: Password Reset Request",
      html: `
        <p>You requested a password reset. Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`TaskShifts: Password reset email sent to ${email}`);
  } catch (error) {
    console.error('TaskShifts: Email sending failed:', error);
    throw error; // Re-throw to handle in controller
  }
};

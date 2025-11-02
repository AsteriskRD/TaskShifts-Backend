import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, verificationCode: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Construct verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'TaskShifts - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to TaskShifts!</h2>
          <p>Thank you for registering. Please click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If the link doesn't work, copy and paste this URL: <br><strong>${verificationLink}</strong></p>
          <p>The link expires in 10 minutes. If you didn't create this account, ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Best regards,<br>TaskShifts Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`TaskShifts: Verification email sent to ${email}`);
  } catch (error) {
    console.error('TaskShifts: Email sending failed:', error);
    throw error; // Re-throw to handle in controller
  }
};

export const verifyEmailTemplate = (verificationLink: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to TaskShifts!</h2>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>

      <a href="${verificationLink}"
        style="background-color: #007bff; color: white; padding: 10px 20px; 
               text-decoration: none; border-radius: 5px;">
        Verify Email
      </a>

      <p>If the link doesn't work, copy and paste this URL:</p>
      <p><strong>${verificationLink}</strong></p>

      <p>The link expires in 10 minutes. If you didn’t create this account, ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Best regards,<br>TaskShifts Team</p>
    </div>
  `;
};

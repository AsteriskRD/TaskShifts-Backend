export const resetEmailTemplate = (resetLink: string) => {
  return `
    <p>You requested a password reset. Click below to reset your password:</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>This link expires in 15 minutes.</p>
  `;
};

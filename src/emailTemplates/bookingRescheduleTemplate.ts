interface BookingRescheduleDetails {
  clientName: string;
  providerName: string;
  bookingDate: string;   // New date/time
  oldDate: string;       // Original date/time
  duration: string;
  note?: string;
  bookingId: string;
  status: string;
  supportEmail: string;
}

export const bookingRescheduleTemplate = (details: BookingRescheduleDetails, isForProvider: boolean = true) => {
  const recipientName = isForProvider ? details.providerName : details.clientName;
  const otherPartyName = isForProvider ? details.clientName : details.providerName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Rescheduled - ${details.bookingId}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #007bff; color: white; padding: 20px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 30px; line-height: 1.6; color: #333; }
    .content h2 { color: #007bff; margin-top: 0; font-size: 18px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table th, .details-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    .details-table th { background: #f9f9f9; width: 40%; font-weight: bold; }
    .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #0056b3; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 13px; color: #666; }
    .highlight { color: #007bff; font-weight: bold; }
    @media only screen and (max-width: 600px) { .container { margin: 10px; } .content { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Rescheduled</h1>
    </div>

    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>The booking with <strong>${otherPartyName}</strong> has been rescheduled.</p>

      <h2>Updated Booking Details</h2>
      <table class="details-table">
        <tr><th>Booking ID</th><td class="highlight">${details.bookingId}</td></tr>
        <tr><th>Status</th><td><strong>${details.status}</strong></td></tr>
        <tr><th>New Date & Time</th><td>${details.bookingDate}</td></tr>
        <tr><th>Previous Date & Time</th><td>${details.oldDate}</td></tr>
        <tr><th>Duration</th><td>${details.duration}</td></tr>
        ${details.note ? `<tr><th>Notes</th><td>${details.note}</td></tr>` : ''}
      </table>

      ${isForProvider 
        ? `<p>The client has requested this change. Please review and confirm in your dashboard.</p>`
        : `<p>The provider has updated the time. You’ll be notified if any further changes are needed.</p>`
      }

      <p>Questions? Contact support at <a href="mailto:${details.supportEmail}">${details.supportEmail}</a>.</p>
    </div>

    <div class="footer">
      <p>Thank you for using TaskShifts</p>
      <p>© ${new Date().getFullYear()} TaskShifts Technologies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

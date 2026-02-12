interface BookingDetails {
  clientName: string;
  providerName: string;
  bookingDate: string;        // e.g "February 1, 2026 at 10:00 AM"
  duration: string;           // e.g "2 hours"
  note?: string;              // optional notes
  bookingId: string;
  status: string;             // "Pending", "Confirmed", "Accepted"
  supportEmail: string;
}

export const bookingConfirmationTemplate = (details: BookingDetails, isForProvider: boolean = true) => {
  const recipientName = isForProvider ? details.providerName : details.clientName;
  const otherPartyName = isForProvider ? details.clientName : details.providerName;
  const subject = isForProvider 
    ? `New Booking Request from ${details.clientName}` 
    : `Your Booking with ${details.providerName} - ${details.status}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
    @media only screen and (max-width: 600px) {
      .container { margin: 10px; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isForProvider ? 'New Booking Request' : 'Booking Confirmed'}</h1>
    </div>

    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>${isForProvider 
        ? `You have a new booking request from <strong>${otherPartyName}</strong>.` 
        : `Your booking with <strong>${otherPartyName}</strong> is now ${details.status.toLowerCase()}.`}
      </p>

      <h2>Booking Summary</h2>
      <table class="details-table">
        <tr>
          <th>Booking ID</th>
          <td class="highlight">${details.bookingId}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td><strong>${details.status}</strong></td>
        </tr>
        <tr>
          <th>Date & Time</th>
          <td>${details.bookingDate}</td>
        </tr>
        <tr>
          <th>Duration</th>
          <td>${details.duration}</td>
        </tr>
        ${details.note ? `
        <tr>
          <th>Notes</th>
          <td>${details.note}</td>
        </tr>` : ''}
      </table>

      <p style="text-align: center;">
        <a href="${details.dashboardLink || '#'}" class="button">
          ${isForProvider ? 'View & Respond to Booking' : 'View Booking Details'}
        </a>
      </p>

      ${isForProvider 
        ? `<p><strong>Next step:</strong> Please review and accept or decline the request in your dashboard soon.</p>`
        : `<p>You’ll be notified when the provider responds or updates the booking.</p>`
      }

      <p>If you have questions, contact support at <a href="mailto:${details.supportEmail}">${details.supportEmail}</a>.</p>
    </div>

    <div class="footer">
      <p>Thank you for using TaskShifts</p>
      <p>© ${new Date().getFullYear()} TaskShifts Technologies. All rights reserved.</p>
      <p><a href="https://taskshifts.com/privacy">Privacy Policy</a> | <a href="https://taskshifts.com/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

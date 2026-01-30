interface BookingAcceptDetails {
  clientName: string;
  providerName: string;
  bookingDate: string;
  duration: string;
  note?: string;
  bookingId: string;
  status: string;
  supportEmail: string;
}

export const bookingAcceptanceTemplate = (details: BookingAcceptDetails, isForProvider: boolean = true) => {
  const recipientName = isForProvider ? details.providerName : details.clientName;
  const otherPartyName = isForProvider ? details.clientName : details.providerName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Accepted - ${details.bookingId}</title>
  <style>
    /* Same styles as above */
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #28a745;">
      <h1>Booking Accepted</h1>
    </div>

    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>The booking with <strong>${otherPartyName}</strong> has been accepted.</p>

      <h2>Confirmed Booking Details</h2>
      <table class="details-table">
        <tr><th>Booking ID</th><td class="highlight">${details.bookingId}</td></tr>
        <tr><th>Status</th><td><strong>Accepted</strong></td></tr>
        <tr><th>Date & Time</th><td>${details.bookingDate}</td></tr>
        <tr><th>Duration</th><td>${details.duration}</td></tr>
        ${details.note ? `<tr><th>Notes</th><td>${details.note}</td></tr>` : ''}
      </table>

      ${isForProvider 
        ? `<p>You have confirmed the booking. We’ll remind you closer to the date.</p>`
        : `<p>Your provider has accepted your booking. Prepare for the scheduled time.</p>`
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

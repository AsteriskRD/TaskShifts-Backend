interface BookingCancelDetails {
  clientName: string;
  providerName: string;
  bookingDate: string;
  duration: string;
  note?: string;
  bookingId: string;
  status: string;
  supportEmail: string;
  cancelledBy: 'client' | 'provider'; // who cancelled
}

export const bookingCancellationTemplate = (details: BookingCancelDetails, isForProvider: boolean = true) => {
  const recipientName = isForProvider ? details.providerName : details.clientName;
  const otherPartyName = isForProvider ? details.clientName : details.providerName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled - ${details.bookingId}</title>
  <style>
    /* Same styles as above - copy from previous template */
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #dc3545;">
      <h1>Booking Cancelled</h1>
    </div>

    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>The booking with <strong>${otherPartyName}</strong> has been cancelled by the ${details.cancelledBy}.</p>

      <h2>Cancelled Booking Details</h2>
      <table class="details-table">
        <tr><th>Booking ID</th><td class="highlight">${details.bookingId}</td></tr>
        <tr><th>Status</th><td><strong>Cancelled</strong></td></tr>
        <tr><th>Original Date & Time</th><td>${details.bookingDate}</td></tr>
        <tr><th>Duration</th><td>${details.duration}</td></tr>
        ${details.note ? `<tr><th>Notes</th><td>${details.note}</td></tr>` : ''}
      </table>

      <p>If this was unexpected, contact support at <a href="mailto:${details.supportEmail}">${details.supportEmail}</a>.</p>
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

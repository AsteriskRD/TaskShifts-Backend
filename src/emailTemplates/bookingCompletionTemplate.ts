interface BookingCompleteDetails {
  clientName: string;
  providerName: string;
  bookingDate: string;
  duration: string;
  note?: string;
  bookingId: string;
  status: string;
  supportEmail: string;
}

export const bookingCompletionTemplate = (details: BookingCompleteDetails, isForProvider: boolean = true) => {
  const recipientName = isForProvider ? details.providerName : details.clientName;
  const otherPartyName = isForProvider ? details.clientName : details.providerName;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Completed - ${details.bookingId}</title>
  <style>
    /* Same styles as above */
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: #17a2b8;">
      <h1>Booking Completed</h1>
    </div>

    <div class="content">
      <p>Hello <strong>${recipientName}</strong>,</p>

      <p>The service with <strong>${otherPartyName}</strong> has been marked as completed.</p>

      <h2>Completed Booking Details</h2>
      <table class="details-table">
        <tr><th>Booking ID</th><td class="highlight">${details.bookingId}</td></tr>
        <tr><th>Status</th><td><strong>Completed</strong></td></tr>
        <tr><th>Date & Time</th><td>${details.bookingDate}</td></tr>
        <tr><th>Duration</th><td>${details.duration}</td></tr>
        ${details.note ? `<tr><th>Notes</th><td>${details.note}</td></tr>` : ''}
      </table>

      ${isForProvider 
        ? `<p>Thank you for completing the job. Your reputation grows with every successful service.</p>`
        : `<p>Thank you for choosing TaskShifts. Please consider leaving a review to help others.</p>`
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

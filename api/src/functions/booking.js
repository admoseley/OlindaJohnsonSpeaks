const { app } = require('@azure/functions');
const { EmailClient } = require('@azure/communication-email');

const REQUIRED_FIELDS = ['organization', 'contact', 'email', 'audience', 'topic'];

const FIELD_LABELS = {
  organization: 'Organization',
  contact: 'Contact name',
  email: 'Email',
  phone: 'Phone',
  date: 'Event date(s)',
  location: 'Location',
  audience: 'Audience',
  size: 'Audience size',
  topic: 'Topic interest',
  format: 'Preferred format',
  ceu: 'CEU requirements & notes'
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.http('booking', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'booking',
  handler: async (request, context) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { success: false, message: 'Invalid request body.' } };
    }

    // Honeypot: bots fill this hidden field. Report success without sending mail.
    if (body.botcheck) {
      return { status: 200, jsonBody: { success: true } };
    }

    const missing = REQUIRED_FIELDS.filter((field) => !String(body[field] || '').trim());
    if (missing.length) {
      return {
        status: 400,
        jsonBody: { success: false, message: `Missing required field(s): ${missing.join(', ')}` }
      };
    }

    const connectionString = process.env.ACS_CONNECTION_STRING;
    const fromEmail = process.env.BOOKING_FROM_EMAIL;
    const toEmail = process.env.BOOKING_TO_EMAIL;

    if (!connectionString || !fromEmail || !toEmail) {
      context.error('Missing ACS_CONNECTION_STRING, BOOKING_FROM_EMAIL, or BOOKING_TO_EMAIL app setting.');
      return { status: 500, jsonBody: { success: false, message: 'Server is not configured to send email.' } };
    }

    const rows = Object.entries(FIELD_LABELS)
      .filter(([key]) => body[key])
      .map(([key, label]) => ({ label, value: String(body[key]) }));

    const textBody = rows.map((r) => `${r.label}: ${r.value}`).join('\n');
    const htmlBody = `<h2>New training request</h2><table>${rows
      .map((r) => `<tr><td><strong>${escapeHtml(r.label)}</strong></td><td>${escapeHtml(r.value)}</td></tr>`)
      .join('')}</table>`;

    const client = new EmailClient(connectionString);

    try {
      const poller = await client.beginSend({
        senderAddress: fromEmail,
        content: {
          subject: `New training request — ${body.organization}`,
          plainText: textBody,
          html: htmlBody
        },
        recipients: {
          to: [{ address: toEmail }]
        },
        replyTo: [{ address: body.email, displayName: body.contact }]
      });
      await poller.pollUntilDone();
    } catch (err) {
      context.error('ACS email send failed', err);
      return { status: 502, jsonBody: { success: false, message: 'Email delivery failed. Please try again.' } };
    }

    return { status: 200, jsonBody: { success: true } };
  }
});

import nodemailer from 'nodemailer';

// Access environment variables
// These should be set in your .env file (and on your deployment platform)
const smtpHost = import.meta.env.EMAIL_SMTP_HOST;
const smtpPort = parseInt(import.meta.env.EMAIL_SMTP_PORT || '587', 10);
const smtpUser = import.meta.env.EMAIL_SMTP_USER;
const smtpPass = import.meta.env.EMAIL_SMTP_PASSWORD;
const senderEmail = import.meta.env.EMAIL_SENDER_ADDRESS || 'hello@thisisgrain.com';

export async function POST({ request }) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('Email service is not configured. Missing SMTP environment variables.');
    return new Response(JSON.stringify({ error: 'Email service not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json(); // Expecting quoteDetails and pdfDataUri

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for port 465, false for other ports (like 587 for TLS)
      auth: {
        user: smtpUser, // Your email service username or API key
        pass: smtpPass, // Your email service password or API key secret
      },
      // Depending on your provider, you might need to add TLS options, e.g.:
      // tls: {
      //   ciphers:'SSLv3' // Or other specific requirements
      // }
    });

    const mailOptions = {
      from: `\"Grain Productions Quote\" <${senderEmail}>`, // Sender address
      to: data.quoteDetails.email, // Customer's email
      subject: 'Your Custom Quote from Grain Productions',
      html: `
        <p>Dear ${data.quoteDetails.name || 'Customer'},</p>
        <p>Thank you for your interest! Please find your custom quote attached.</p>
        <p>This includes:</p>
        <ul>
          <li>Shoot Days: ${data.quoteDetails.shootDays}</li>
          ${data.quoteDetails.selectedAddons.map(addon => `<li>${addon.title}</li>`).join('')}
        </ul>
        <p>Total (incl. VAT): ${data.quoteDetails.grandTotal}</p> 
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,</p>
        <p>The Grain Productions Team</p>
      `,
      attachments: [
        {
          filename: `Grain_Quote_${data.quoteDetails.name?.replace(/\s+/g, '_') || 'Details'}.pdf`,
          content: data.pdfDataUri.split('base64,')[1], // Extract base64 content
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', data.quoteDetails.email);

    return new Response(JSON.stringify({ message: 'Quote email sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-quote-email API:', error);
    // Provide a more specific error message if it's an auth issue
    if (error.code === 'EAUTH' || error.responseCode === 535) {
        return new Response(JSON.stringify({ error: 'Failed to send email: Authentication error. Please check server credentials.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
    }
    return new Response(JSON.stringify({ error: 'Failed to process quote email request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 
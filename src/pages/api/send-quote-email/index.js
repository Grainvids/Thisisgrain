import nodemailer from 'nodemailer';

// Access environment variables
const smtpHost = import.meta.env.EMAIL_SMTP_HOST;
const smtpPort = parseInt(import.meta.env.EMAIL_SMTP_PORT || '587', 10);
const smtpUser = import.meta.env.EMAIL_SMTP_USER;
const smtpPass = import.meta.env.EMAIL_SMTP_PASSWORD;
const senderEmail = import.meta.env.EMAIL_SENDER_ADDRESS || 'hello@thisisgrain.com';

// Base64 encoded logo
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDU6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDItMTNUMTU6NDc6NDctMDU6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAyLTEzVDE1OjQ3OjQ3LTA1OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTY5ZDAtNDI0ZC1hMzM5LTY5ZDg4ZjM5NjkyZiIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY5ZDM4ZjM5LTY5ZDAtNDI0ZC1hMzM5LTY5ZDg4ZjM5NjkyZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4ZjM5LTY5ZDAtNDI0ZC1hMzM5LTY5ZDg4ZjM5NjkyZiIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4ZjM5LTY5ZDAtNDI0ZC1hMzM5LTY5ZDg4ZjM5NjkyZiIgc3RFdnQ6d2hlbj0iMjAyNC0wMi0xM1QxNTo0Nzo0Ny0wNTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';

export async function POST({ request }) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('Email service is not configured. Missing SMTP environment variables.');
    return new Response(
      JSON.stringify({ error: 'Email service not configured on the server.' }), 
      { status: 500, headers }
    );
  }

  try {
    const data = await request.json(); // Expecting quoteDetails and pdfDataUri

    // Check if the PDF data is too large (limit to 6MB)
    const pdfData = data.pdfDataUri.split('base64,')[1];
    if (pdfData.length > 6 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'PDF data is too large. Please try again with a smaller quote.' }), 
        { status: 413, headers }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false // Only use this in development
      }
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: `"Grain Productions" <${senderEmail}>`,
      to: data.quoteDetails.email,
      cc: 'hello@thisisgrain.com',
      subject: 'Your Custom Quote from Grain Productions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${logoBase64}" alt="Grain" style="max-width: 200px; height: auto;" />
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.quoteDetails.name || 'Customer'},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your interest in Grain! We're excited to work with you on your project.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 20px; margin-top: 0;">Your Quote Summary:</h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 10px;"><strong>Shoot Days:</strong> ${data.quoteDetails.shootDays}</li>
              ${data.quoteDetails.selectedAddons.map(addon => 
                `<li style="margin-bottom: 10px;"><strong>${addon.title}</strong></li>`
              ).join('')}
              <li style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                <strong>Total (incl. VAT):</strong> ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(data.quoteDetails.grandTotal)}
              </li>
            </ul>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Please find your detailed quote attached to this email. This quote is valid for 30 days from the date of issue.</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">If you have any questions or would like to discuss your project further, please don't hesitate to reply to this email or contact us directly. One of our team will be in touch shortly.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #333;">Best regards,</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; line-height: 1.4; color: #333;">The Grain Team</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; line-height: 1.4; color: #333;">hello@thisisgrain.com | +44 796 700 4106</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Grain_Quote_${data.quoteDetails.name?.replace(/\s+/g, '_') || 'Details'}.pdf`,
          content: pdfData,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', data.quoteDetails.email);

    return new Response(
      JSON.stringify({ message: 'Quote email sent successfully!' }), 
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error in send-quote-email API:', error);
    // Provide a more specific error message if it's an auth issue
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return new Response(
        JSON.stringify({ error: 'Failed to send email: Authentication error. Please check server credentials.' }), 
        { status: 500, headers }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Failed to process quote email request.' }), 
      { status: 500, headers }
    );
  }
} 
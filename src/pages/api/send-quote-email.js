export const prerender = false; // Ensures this is treated as a server-rendered API route

import nodemailer from 'nodemailer';

// Access environment variables
// These should be set in your .env file (and on your deployment platform)
const smtpHost = import.meta.env.EMAIL_SMTP_HOST;
const smtpPort = parseInt(import.meta.env.EMAIL_SMTP_PORT || '587', 10);
const smtpUser = import.meta.env.EMAIL_SMTP_USER;
const smtpPass = import.meta.env.EMAIL_SMTP_PASSWORD;
const senderEmail = import.meta.env.EMAIL_SENDER_ADDRESS || 'hello@thisisgrain.com';

export async function POST({ request }) {
  console.log('API endpoint called');
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('Email service is not configured. Missing SMTP environment variables.');
    return new Response(JSON.stringify({ error: 'Email service not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();
    console.log('Request data received:', {
      hasQuoteDetails: !!data.quoteDetails,
      hasPdfData: !!data.pdfDataUri,
      email: data.quoteDetails?.email
    });

    if (!data.quoteDetails || !data.pdfDataUri) {
      throw new Error('Missing required data: quoteDetails or pdfDataUri');
    }

    if (!data.quoteDetails.email) {
      throw new Error('Email address is required');
    }

    // Validate PDF data
    if (!data.pdfDataUri.startsWith('data:application/pdf;base64,')) {
      throw new Error('Invalid PDF data format');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false // Only use this in development
      }
    });

    // Verify connection configuration
    console.log('Verifying SMTP connection...');
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
            <h1 style="color: #F97316; font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: -0.05em; font-family: 'Arial Black', Arial, sans-serif; margin: 0;">Grain</h1>
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
          content: data.pdfDataUri.split('base64,')[1],
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('Attempting to send email...');
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', data.quoteDetails.email);

    return new Response(JSON.stringify({ message: 'Quote email sent successfully!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-quote-email API:', error);
    
    // Log the full error details
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Provide more specific error messages based on the error type
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return new Response(JSON.stringify({ 
        error: 'Failed to send email: Authentication error. Please check server credentials.',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (error.message.includes('Missing required data')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data',
        details: error.message
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to process quote email request.',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 
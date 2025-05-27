import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../index';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn().mockResolvedValue(true),
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
    }))
  }
}));

describe('Quote Email API', () => {
  const mockRequest = {
    method: 'POST',
    json: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('EMAIL_SMTP_HOST', 'smtp.test.com');
    vi.stubEnv('EMAIL_SMTP_PORT', '587');
    vi.stubEnv('EMAIL_SMTP_USER', 'user');
    vi.stubEnv('EMAIL_SMTP_PASSWORD', 'pass');
    vi.stubEnv('EMAIL_SENDER_ADDRESS', 'test@thisisgrain.com');
  });

  it('should send email successfully with valid data', async () => {
    const mockData = {
      quoteDetails: {
        name: 'Test User',
        email: 'test@example.com',
        shootDays: 2,
        selectedAddons: [{ title: 'Extra Service' }],
        grandTotal: 1000
      },
      pdfDataUri: 'data:application/pdf;base64,dGVzdA=='
    };

    mockRequest.json.mockResolvedValue(mockData);

    const response = await POST({ request: mockRequest });
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.message).toBe('Quote email sent successfully!');
  });

  it('should handle missing SMTP configuration', async () => {
    // Mock environment variables as undefined
    vi.stubEnv('EMAIL_SMTP_HOST', '');
    vi.stubEnv('EMAIL_SMTP_USER', '');
    vi.stubEnv('EMAIL_SMTP_PASSWORD', '');

    const response = await POST({ request: mockRequest });
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.error).toBe('Email service not configured on the server.');
  });

  it('should handle PDF data that is too large', async () => {
    const largePdfData = 'data:application/pdf;base64,' + 'a'.repeat(7 * 1024 * 1024); // 7MB
    mockRequest.json.mockResolvedValue({
      quoteDetails: { email: 'test@example.com' },
      pdfDataUri: largePdfData
    });

    const response = await POST({ request: mockRequest });
    const responseData = await response.json();

    expect(response.status).toBe(413);
    expect(responseData.error).toBe('PDF data is too large. Please try again with a smaller quote.');
  });
}); 
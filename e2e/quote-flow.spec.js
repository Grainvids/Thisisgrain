import { test, expect } from '@playwright/test';

test.describe('Quote Flow', () => {
  test('should complete quote process and send email', async ({ page }) => {
    // Navigate to the root URL instead of /quote
    await page.goto('/');
    
    // Fill in the quote form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="shootDays"]', '2');
    
    // Select some addons
    await page.check('input[name="addon-1"]');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Verify PDF generation
    await expect(page.locator('.pdf-preview')).toBeVisible();
    
    // Verify email sent confirmation
    await expect(page.locator('.email-sent-confirmation')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Fill form with valid data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.selectOption('select[name="shootDays"]', '2');
    
    // Mock PDF generation failure
    await page.route('**/generate-pdf', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'PDF generation failed' })
    }));
    
    await page.click('button[type="submit"]');
    
    // Verify error handling
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('PDF generation failed');
  });
}); 
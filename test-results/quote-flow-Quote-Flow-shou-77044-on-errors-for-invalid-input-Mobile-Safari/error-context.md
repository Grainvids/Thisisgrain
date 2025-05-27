# Test info

- Name: Quote Flow >> should show validation errors for invalid input
- Location: /Users/jonny/Documents/github/Thisisgrain/e2e/quote-flow.spec.js:29:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('.error-message')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('.error-message')

    at /Users/jonny/Documents/github/Thisisgrain/e2e/quote-flow.spec.js:36:50
```

# Page snapshot

```yaml
- link "Grain Instagram Profile":
  - /url: https://www.instagram.com/grainvids
- link "Grain Instagram Profile":
  - /url: https://www.instagram.com/grainvids
- navigation:
  - button "Toggle menu"
- main:
  - text: Your browser does not support the video tag.
  - button "Scroll to next section":
    - img
  - heading "Production that hits just right." [level=2]
  - paragraph: Grain is a creative collective uniting three seasoned talents in Directing, Cinematography, and Audio. With 15 years of independent work behind us, we've joined forces to disrupt convention, crafting bold stories that go against the Grain.
  - button "Go to slide 1"
  - button "Go to slide 2"
  - button "Go to slide 3"
  - button "Go to slide 4"
  - button "Go to slide 5"
  - heading "STONE - Save Yourself feat. DOPE LEMON" [level=3]
  - paragraph: Music Video
  - heading "CORELLA - I Didn't Know Your Name" [level=3]
  - paragraph: Live Performance
  - heading "Pablo Miller - Broken Mirror" [level=3]
  - paragraph: Live Performance
  - heading "Portico Quartet Ensemble - Terrain (Extended)" [level=3]
  - paragraph: Live Performance
  - heading "LOTTERY WINNERS - Ragdoll ft. Chad Kroeger" [level=3]
  - paragraph: Music Video
  - heading "Aerial Salad - Tied to Pieces of Paper" [level=3]
  - paragraph: Music Video
  - button "Go to slide 1"
  - button "Go to slide 2"
  - button "Go to slide 3"
  - img "Luca Rudlin"
  - heading "Luca Rudlin" [level=3]
  - paragraph: Director
  - paragraph: Shaping stories with light and lens, Luca brings bold artistic visions to life through expressive composition and dynamic cinematography.
  - img "Jonny Woodhead"
  - heading "Jonny Woodhead" [level=3]
  - paragraph: Audio Director
  - paragraph: Sound specialist sculpting immersive audio, Jonny shapes rich, immersive soundscapes that amplify emotion and bring every note to life.
  - img "Pete Hall"
  - heading "Pete Hall" [level=3]
  - paragraph: Creative Director
  - paragraph: Visionary director specialising in guerrilla and DIY filmmaking, Pete crafts compelling dynamics that captivate audiences.
  - heading "Let's Create Something Together" [level=2]
  - paragraph: Get in touch to discuss your next project. We're always excited to hear new ideas and help bring your vision to life.
  - textbox "Your Name"
  - textbox "Your Email"
  - combobox:
    - option "Select Service" [selected]
    - option "Commercial Production"
    - option "Documentary Filmmaking"
    - option "Music Videos"
    - option "Other"
  - textbox "Tell us about your project"
  - button "Send Message"
  - heading "Trusted By" [level=3]
  - img "Client A Logo"
  - img "Client B Logo"
  - img "Client C Logo"
  - img "Client D Logo"
  - img "Client E Logo"
  - img "Client F Logo"
  - link "Grain Logo":
    - /url: /
    - img "Grain Logo"
  - navigation:
    - heading "Explore" [level=4]
    - list:
      - listitem:
        - link "Portfolio":
          - /url: /#portfolio
      - listitem:
        - link "Meet the Team":
          - /url: /#behind-grain
      - listitem:
        - link "Contact":
          - /url: /contact
    - heading "Connect" [level=4]
    - list:
      - listitem:
        - link "Instagram":
          - /url: https://www.instagram.com/grainvids
    - heading "Get in Touch" [level=4]
    - list:
      - listitem:
        - link "hello@thisisgrain.com":
          - /url: mailto:hello@thisisgrain.com
      - listitem:
        - link "+44 796 700 4106":
          - /url: tel:+447967004106
  - paragraph: © 2025 Grain. All rights reserved.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Quote Flow', () => {
   4 |   test('should complete quote process and send email', async ({ page }) => {
   5 |     // Navigate to the root URL instead of /quote
   6 |     await page.goto('/');
   7 |     
   8 |     // Fill in the quote form
   9 |     await page.fill('input[name="name"]', 'Test User');
  10 |     await page.fill('input[name="email"]', 'test@example.com');
  11 |     await page.selectOption('select[name="shootDays"]', '2');
  12 |     
  13 |     // Select some addons
  14 |     await page.check('input[name="addon-1"]');
  15 |     
  16 |     // Submit the form
  17 |     await page.click('button[type="submit"]');
  18 |     
  19 |     // Wait for success message
  20 |     await expect(page.locator('.success-message')).toBeVisible();
  21 |     
  22 |     // Verify PDF generation
  23 |     await expect(page.locator('.pdf-preview')).toBeVisible();
  24 |     
  25 |     // Verify email sent confirmation
  26 |     await expect(page.locator('.email-sent-confirmation')).toBeVisible();
  27 |   });
  28 |
  29 |   test('should show validation errors for invalid input', async ({ page }) => {
  30 |     await page.goto('/');
  31 |     
  32 |     // Try to submit without filling required fields
  33 |     await page.click('button[type="submit"]');
  34 |     
  35 |     // Check for validation messages
> 36 |     await expect(page.locator('.error-message')).toBeVisible();
     |                                                  ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  37 |     await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  38 |   });
  39 |
  40 |   test('should handle PDF generation errors gracefully', async ({ page }) => {
  41 |     await page.goto('/');
  42 |     
  43 |     // Fill form with valid data
  44 |     await page.fill('input[name="name"]', 'Test User');
  45 |     await page.fill('input[name="email"]', 'test@example.com');
  46 |     await page.selectOption('select[name="shootDays"]', '2');
  47 |     
  48 |     // Mock PDF generation failure
  49 |     await page.route('**/generate-pdf', route => route.fulfill({
  50 |       status: 500,
  51 |       body: JSON.stringify({ error: 'PDF generation failed' })
  52 |     }));
  53 |     
  54 |     await page.click('button[type="submit"]');
  55 |     
  56 |     // Verify error handling
  57 |     await expect(page.locator('.error-message')).toBeVisible();
  58 |     await expect(page.locator('.error-message')).toContainText('PDF generation failed');
  59 |   });
  60 | }); 
```
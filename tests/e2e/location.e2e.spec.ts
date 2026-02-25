import { test, expect } from '@playwright/test'

test.describe('Location Capture', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to location page
    await page.goto('/location')
  })

  test('should display location capture options', async ({ page }) => {
    // Check for GPS and manual input buttons
    await expect(page.getByText('Standort automatisch ermitteln (GPS)')).toBeVisible()
    await expect(page.getByText('Adresse manuell eingeben')).toBeVisible()
  })

  test('should show GPS location capture form', async ({ page }) => {
    // Click GPS button
    await page.getByText('Standort automatisch ermitteln (GPS)').click()

    // Check for GPS form elements
    await expect(page.getByText('Standort automatisch ermitteln')).toBeVisible()
    await expect(page.getByText('Standort ermitteln')).toBeVisible()
  })

  test('should show manual address input form', async ({ page }) => {
    // Click manual input button
    await page.getByText('Adresse manuell eingeben').click()

    // Check for form fields
    await expect(page.getByLabel('Straße *')).toBeVisible()
    await expect(page.getByLabel('Postleitzahl *')).toBeVisible()
    await expect(page.getByLabel('Stadt *')).toBeVisible()
  })

  test('should validate postal code format', async ({ page }) => {
    await page.getByText('Adresse manuell eingeben').click()

    const postalCodeInput = page.getByLabel('Postleitzahl *')

    // Try to enter invalid postal code
    await postalCodeInput.fill('123')
    await postalCodeInput.blur()

    // Check HTML5 validation
    const validity = await postalCodeInput.evaluate((el: HTMLInputElement) => el.validity.valid)
    expect(validity).toBe(false)
  })

  test('should show autocomplete suggestions', async ({ page, context }) => {
    // Mock autocomplete API response
    await context.route('**/api?q=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          features: [
            {
              geometry: { coordinates: [6.9603, 50.9375] },
              properties: {
                name: 'Domstraße, Köln',
                postcode: '50667',
                city: 'Köln',
              },
            },
          ],
        }),
      })
    })

    await page.getByText('Adresse manuell eingeben').click()

    // Type in autocomplete field
    const autocompleteInput = page.getByPlaceholder('Adresse oder Ort eingeben...')
    await autocompleteInput.fill('Köln')

    // Wait for suggestions to appear
    await expect(page.getByText('Domstraße, Köln')).toBeVisible({ timeout: 5000 })
  })

  test('should handle GPS permission denial gracefully', async ({ page, context }) => {
    // Mock geolocation to deny permission
    await context.grantPermissions(['geolocation'], { origin: 'http://localhost:3000' })
    await context.setGeolocation({ latitude: 0, longitude: 0 })

    // Mock geolocation API to throw permission denied error
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            error({ code: 1, message: 'User denied geolocation' })
          },
          watchPosition: () => 1,
          clearWatch: () => {},
        },
      })
    })

    await page.reload()
    await page.getByText('Standort automatisch ermitteln (GPS)').click()
    await page.getByText('Standort ermitteln').click()

    // Should show error message
    await expect(
      page.getByText(/Standortzugriff wurde verweigert|Bitte verwende die manuelle Eingabe/),
    ).toBeVisible({ timeout: 5000 })
  })

  test('should submit manual address form', async ({ page, context }) => {
    // Mock geocoding API
    await context.route('**/api/geocode', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lat: 50.9375,
          lng: 6.9603,
          postal_code: '50667',
          city: 'Köln',
        }),
      })
    })

    await page.getByText('Adresse manuell eingeben').click()

    // Fill form
    await page.getByLabel('Straße *').fill('Domstraße')
    await page.getByLabel('Postleitzahl *').fill('50667')
    await page.getByLabel('Stadt *').fill('Köln')

    // Submit
    await page.getByRole('button', { name: 'Weiter' }).click()

    // Should navigate to personal page
    await expect(page).toHaveURL(/\/personal/, { timeout: 5000 })
  })

  test('should show error for invalid address', async ({ page, context }) => {
    // Mock geocoding API to return 404
    await context.route('**/api/geocode', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Address not found',
        }),
      })
    })

    await page.getByText('Adresse manuell eingeben').click()

    // Fill form with invalid address
    await page.getByLabel('Straße *').fill('Invalid Street 999')
    await page.getByLabel('Postleitzahl *').fill('99999')
    await page.getByLabel('Stadt *').fill('Nowhere')

    // Submit
    await page.getByRole('button', { name: 'Weiter' }).click()

    // Should show error message
    await expect(page.getByText(/Adresse konnte nicht gefunden werden|Fehler/)).toBeVisible({
      timeout: 5000,
    })
  })

  test('should allow navigation back from forms', async ({ page }) => {
    // Test GPS form back button
    await page.getByText('Standort automatisch ermitteln (GPS)').click()
    await page.getByRole('button', { name: 'Zurück' }).click()
    await expect(page.getByText('Standort automatisch ermitteln (GPS)')).toBeVisible()

    // Test manual form back button
    await page.getByText('Adresse manuell eingeben').click()
    await page.getByRole('button', { name: 'Zurück' }).click()
    await expect(page.getByText('Adresse manuell eingeben')).toBeVisible()
  })
})

const { test, expect } = require('@playwright/test');

// Observed in the dedicated assessment browser, not guessed API routes.
// Provenance: observations/evidence/network-endpoints.json.
// These public authentication checks do not substitute for pipeline API coverage.
test('provider discovery returns the configured OIDC provider', async ({ request }) => {
  const response = await request.get('/api/auth/providers');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(Object.keys(body)).toContain('auth0');
  expect(body.auth0).toMatchObject({ id: 'auth0', type: 'oidc' });
  expect(new URL(body.auth0.signinUrl).pathname).toBe('/api/auth/signin/auth0');
  expect(new URL(body.auth0.callbackUrl).origin).toBe('https://rhombusai.com');
});

test('CSRF endpoint provides a nonempty token without exposing it in artifacts', async ({ request }) => {
  const response = await request.get('/api/auth/csrf');
  expect(response.status()).toBe(200);
  const body = await response.json();
  // Assert a boolean so a failure cannot print the token.
  expect(typeof body.csrfToken === 'string' && body.csrfToken.length >= 32).toBe(true);
});

test('sign-in without CSRF is rejected before provider authentication', async ({ playwright }) => {
  const isolated = await playwright.request.newContext({ baseURL: 'https://rhombusai.com' });
  try {
    const response = await isolated.post('/api/auth/signin/auth0', {
      form: { callbackUrl: 'https://rhombusai.com/' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(await response.text()).toBe('');
    const destination = new URL(response.headers().location);
    expect(destination.origin).toBe('https://rhombusai.com');
    expect(destination.pathname).toBe('/get-started');
    expect(destination.searchParams.get('error')).toBe('MissingCSRF');
  } finally {
    await isolated.dispose();
  }
});

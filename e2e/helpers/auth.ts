import type { Page } from '@playwright/test'

/** Inject JWT tokens + user object into localStorage so AuthContext rehydrates. */
export async function injectTokens(
  page: Page,
  accessToken: string,
  refreshToken: string,
  extras: { id?: string; name?: string; email?: string; role?: string } = {},
) {
  await page.addInitScript(
    ({ at, rt, id, name, email, role }) => {
      localStorage.setItem('gc_access_token', at)
      localStorage.setItem('gc_refresh_token', rt)
      localStorage.setItem(
        'glimmora_care_user',
        JSON.stringify({
          id: id ?? 'placeholder',
          name: name ?? 'Test User',
          email: email ?? 'test@example.com',
          role: role ?? 'patient',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          accessToken: at,
        }),
      )
    },
    {
      at: accessToken,
      rt: refreshToken,
      id: extras.id ?? 'placeholder',
      name: extras.name ?? 'Test User',
      email: extras.email ?? 'test@example.com',
      role: extras.role ?? 'patient',
    },
  )
}

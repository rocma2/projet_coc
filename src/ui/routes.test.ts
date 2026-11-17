import { describe, expect, it } from 'vitest'
import { DEFAULT_ROUTE, parseHash, routeHref, ROUTES } from './routes.ts'

describe('routes', () => {
  it('lit chaque route depuis son lien', () => {
    for (const route of ROUTES) {
      expect(parseHash(routeHref(route))).toBe(route)
    }
  })

  it('retombe sur la route par défaut si le fragment est vide ou inconnu', () => {
    expect(DEFAULT_ROUTE).toBe('onboarding/import')
    expect(parseHash('')).toBe(DEFAULT_ROUTE)
    expect(parseHash('#')).toBe(DEFAULT_ROUTE)
    expect(parseHash('#/inconnu')).toBe(DEFAULT_ROUTE)
  })

  it('tolère une barre oblique finale ou absente', () => {
    expect(parseHash('#/plan/')).toBe('plan')
    expect(parseHash('#today')).toBe('today')
  })
})

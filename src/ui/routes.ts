/**
 * Routage minimal par fragment d'URL (`#/today`…), sans dépendance :
 * le bouton retour du navigateur fonctionne et chaque écran a son lien.
 */
import { useCallback, useSyncExternalStore } from 'react'

export const ROUTES = [
  'onboarding/import',
  'onboarding/questionnaire',
  'today',
  'plan',
  'inventory',
  'sources',
  'hammer',
  'settings',
] as const

export type Route = (typeof ROUTES)[number]

/** Les quatre onglets de la barre de navigation, dans l'ordre affiché. */
export const TAB_ROUTES = ['today', 'plan', 'inventory', 'sources'] as const satisfies readonly Route[]
export type TabRoute = (typeof TAB_ROUTES)[number]

/** Aucun village n'existe encore : on commence par l'import. */
export const DEFAULT_ROUTE: Route = 'onboarding/import'

export function isRoute(value: string): value is Route {
  return (ROUTES as readonly string[]).includes(value)
}

export function isTabRoute(route: Route): route is TabRoute {
  return (TAB_ROUTES as readonly Route[]).includes(route)
}

/** `#/today` → `today` ; fragment vide ou inconnu → route par défaut. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  return isRoute(path) ? path : DEFAULT_ROUTE
}

/** Lien vers une route, à mettre dans `href`. */
export function routeHref(route: Route): string {
  return `#/${route}`
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getHash(): string {
  return window.location.hash
}

/** Route courante et fonction de navigation (ajoute une entrée d'historique). */
export function useHashRoute(): [Route, (route: Route) => void] {
  const hash = useSyncExternalStore(subscribe, getHash, () => '')
  const navigate = useCallback((route: Route) => {
    window.location.hash = routeHref(route)
  }, [])
  return [parseHash(hash), navigate]
}

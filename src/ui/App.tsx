import { useEffect, useRef, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomNav } from './components/BottomNav.tsx'
import { isTabRoute, useHashRoute, type Route } from './routes.ts'
import { HammerScreen } from './screens/HammerScreen.tsx'
import { ImportScreen } from './screens/ImportScreen.tsx'
import { InventoryScreen } from './screens/InventoryScreen.tsx'
import { PlanScreen } from './screens/PlanScreen.tsx'
import { QuestionnaireScreen } from './screens/QuestionnaireScreen.tsx'
import { SettingsScreen } from './screens/SettingsScreen.tsx'
import { SourcesScreen } from './screens/SourcesScreen.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'

const SCREENS: Record<Route, ComponentType> = {
  'onboarding/import': ImportScreen,
  'onboarding/questionnaire': QuestionnaireScreen,
  today: TodayScreen,
  plan: PlanScreen,
  inventory: InventoryScreen,
  sources: SourcesScreen,
  hammer: HammerScreen,
  settings: SettingsScreen,
}

export function App() {
  const { t } = useTranslation()
  const [route] = useHashRoute()
  const title = t('app.title')
  const mainRef = useRef<HTMLElement>(null)
  const previousRoute = useRef(route)

  useEffect(() => {
    document.title = title
  }, [title])

  // Changement d'écran : on remonte en haut et on place le focus sur le titre,
  // pour que clavier et lecteur d'écran repartent du nouvel écran.
  useEffect(() => {
    if (previousRoute.current === route) return
    previousRoute.current = route
    window.scrollTo?.(0, 0)
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [route])

  const Screen = SCREENS[route]

  return (
    <div className="app-shell">
      <main ref={mainRef} className="app-shell__main">
        <Screen />
      </main>
      {isTabRoute(route) ? <BottomNav current={route} /> : null}
    </div>
  )
}

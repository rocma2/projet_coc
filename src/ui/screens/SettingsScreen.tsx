import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/Card.tsx'
import { LanguageSwitch } from '../LanguageSwitch.tsx'
import { SubScreen } from './SubScreen.tsx'

/** Réglages : langue et mention légale (pas de wireframe dédié). */
export function SettingsScreen() {
  const { t } = useTranslation()
  const languageId = useId()
  const aboutId = useId()
  return (
    <SubScreen title={t('settings.title')} back="today">
      <Card as="section" aria-labelledby={languageId}>
        <h2 id={languageId} className="section-label">
          {t('language.label')}
        </h2>
        <LanguageSwitch />
      </Card>
      <Card as="section" aria-labelledby={aboutId}>
        <h2 id={aboutId} className="section-label">
          {t('settings.about')}
        </h2>
        <p className="body-text">{t('app.tagline')}</p>
        <p className="text-muted">{t('footer.notAffiliated')}</p>
      </Card>
    </SubScreen>
  )
}

import { useTranslation } from 'react-i18next'
import { isLanguage, SUPPORTED_LANGUAGES, type Language } from '../i18n/index.ts'
import { SegmentedControl } from './components/SegmentedControl.tsx'

/** Choix de la langue (français / anglais), enregistré par le module i18n. */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const resolved = i18n.resolvedLanguage ?? i18n.language
  const current: Language = isLanguage(resolved) ? resolved : 'fr'

  return (
    <SegmentedControl<Language>
      label={t('language.label')}
      name="language"
      value={current}
      onChange={(language) => void i18n.changeLanguage(language)}
      options={SUPPORTED_LANGUAGES.map((language) => ({
        value: language,
        label: t(`language.${language}`),
        lang: language,
      }))}
    />
  )
}

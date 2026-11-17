import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from './LanguageSwitch.tsx'

export function App() {
  const { t } = useTranslation()
  const title = t('app.title')

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__top">
          <h1>{title}</h1>
          <LanguageSwitch />
        </div>
        <p className="tagline">{t('app.tagline')}</p>
      </header>

      <main>
        <section className="card" aria-labelledby="import-title">
          <h2 id="import-title">{t('import.title')}</h2>
          <p>{t('import.placeholder')}</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>{t('footer.notAffiliated')}</p>
      </footer>
    </div>
  )
}

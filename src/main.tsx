import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './i18n/index.ts'
import './ui/tokens.css'
import './ui/styles.css'
import { App } from './ui/App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

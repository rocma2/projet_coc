import 'i18next'
import type { Resources } from './fr.ts'

// Clés de traduction vérifiées par TypeScript.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Resources }
  }
}

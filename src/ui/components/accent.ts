/** Couleurs d'accent porteuses de sens (voir tokens.css). */
export const ACCENTS = ['orange', 'green', 'blue', 'purple', 'gold'] as const
export type Accent = (typeof ACCENTS)[number]

/** Concatène des noms de classes en ignorant les valeurs vides. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}

/** Borne une valeur entre 0 et 1 (0 si elle n'est pas finie). */
export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

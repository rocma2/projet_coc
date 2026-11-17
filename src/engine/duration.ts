/** Utilitaires de durée. Le jeu exprime les durées en secondes (champ `timer`). */

export const SECONDS_PER_MINUTE = 60
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR

/** Durée décomposée, tronquée à la minute (les secondes restantes sont ignorées). */
export interface DurationParts {
  days: number
  hours: number
  minutes: number
}

function assertDuration(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} doit être un nombre fini et positif ou nul, reçu ${value}`)
  }
}

export function secondsToDays(seconds: number): number {
  assertDuration(seconds, 'seconds')
  return seconds / SECONDS_PER_DAY
}

export function daysToSeconds(days: number): number {
  assertDuration(days, 'days')
  return days * SECONDS_PER_DAY
}

export function secondsToHours(seconds: number): number {
  assertDuration(seconds, 'seconds')
  return seconds / SECONDS_PER_HOUR
}

export function hoursToSeconds(hours: number): number {
  assertDuration(hours, 'hours')
  return hours * SECONDS_PER_HOUR
}

/** Décompose une durée en secondes en jours, heures et minutes entiers (tronqué). */
export function splitDuration(seconds: number): DurationParts {
  assertDuration(seconds, 'seconds')
  const totalMinutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes }
}

import { describe, expect, it } from 'vitest'
import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  daysToSeconds,
  hoursToSeconds,
  secondsToDays,
  secondsToHours,
  splitDuration,
} from './index.ts'

describe('constantes', () => {
  it('un jour fait 86 400 secondes', () => {
    expect(SECONDS_PER_DAY).toBe(86_400)
    expect(SECONDS_PER_HOUR).toBe(3_600)
  })
})

describe('conversions', () => {
  it('convertit secondes et jours dans les deux sens', () => {
    expect(secondsToDays(0)).toBe(0)
    expect(secondsToDays(86_400)).toBe(1)
    expect(secondsToDays(43_200)).toBe(0.5)
    expect(daysToSeconds(9)).toBe(777_600)
    expect(daysToSeconds(0.2)).toBeCloseTo(17_280)
  })

  it('convertit secondes et heures dans les deux sens', () => {
    expect(secondsToHours(0)).toBe(0)
    expect(secondsToHours(3_600)).toBe(1)
    expect(secondsToHours(5_400)).toBe(1.5)
    expect(hoursToSeconds(9)).toBe(32_400)
  })

  it('aller-retour sans perte', () => {
    expect(secondsToDays(daysToSeconds(3.9))).toBeCloseTo(3.9)
    expect(secondsToHours(hoursToSeconds(7))).toBe(7)
  })

  it('refuse les valeurs négatives ou non finies', () => {
    expect(() => secondsToDays(-1)).toThrow(RangeError)
    expect(() => daysToSeconds(Number.NaN)).toThrow(RangeError)
    expect(() => hoursToSeconds(Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })
})

describe('splitDuration', () => {
  it('0 seconde', () => {
    expect(splitDuration(0)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('moins d’une minute est tronqué à 0', () => {
    expect(splitDuration(1)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitDuration(59)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitDuration(59.9)).toEqual({ days: 0, hours: 0, minutes: 0 })
  })

  it('minutes et heures', () => {
    expect(splitDuration(60)).toEqual({ days: 0, hours: 0, minutes: 1 })
    expect(splitDuration(3_599)).toEqual({ days: 0, hours: 0, minutes: 59 })
    expect(splitDuration(3_600)).toEqual({ days: 0, hours: 1, minutes: 0 })
  })

  it('frontières de jour exactes', () => {
    expect(splitDuration(86_399)).toEqual({ days: 0, hours: 23, minutes: 59 })
    expect(splitDuration(86_400)).toEqual({ days: 1, hours: 0, minutes: 0 })
    expect(splitDuration(86_460)).toEqual({ days: 1, hours: 0, minutes: 1 })
    expect(splitDuration(7 * 86_400)).toEqual({ days: 7, hours: 0, minutes: 0 })
  })

  it('durée composée', () => {
    // 6 j 13 h 5 min 30 s
    const seconds = 6 * 86_400 + 13 * 3_600 + 5 * 60 + 30
    expect(splitDuration(seconds)).toEqual({ days: 6, hours: 13, minutes: 5 })
  })

  it('refuse les valeurs négatives ou non finies', () => {
    expect(() => splitDuration(-60)).toThrow(RangeError)
    expect(() => splitDuration(Number.NaN)).toThrow(RangeError)
  })
})

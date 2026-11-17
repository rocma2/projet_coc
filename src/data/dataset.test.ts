import { describe, expect, it } from 'vitest'
import {
  ENTITY_KINDS,
  RESOURCES,
  createGameData,
  validateOverrides,
  type LevelData,
  type ResourceAmounts,
} from '../engine/index.ts'
import license from './generated/LICENSE-clash-of-clans-data?raw'
import { gameDataset as dataset, repoOverrides } from './index.ts'

const entity = (id: string) => {
  const e = dataset.entities.find((x) => x.id === id)
  if (!e) throw new Error(`entité ${id} absente`)
  return e
}
const level = (id: string, n: number) => entity(id).levels.find((l) => l.level === n)

/** Toutes les tables de niveaux d'une entité, avec un libellé. */
function levelTables(e: (typeof dataset.entities)[number]): [string, LevelData[]][] {
  return [
    ['levels', e.levels],
    ['supercharges', e.supercharges ?? []],
    ...(e.weapons ?? []).map((w): [string, LevelData[]] => [`arme HDV ${w.townHall}`, w.levels]),
    ...(e.modules ?? []).map((m): [string, LevelData[]] => [`module ${m.name}`, m.levels]),
  ]
}

function checkAmounts(amounts: ResourceAmounts, where: string) {
  for (const [res, amount] of Object.entries(amounts)) {
    expect(RESOURCES, where).toContain(res)
    expect(Number.isFinite(amount) && amount > 0, `${where} ${res}=${amount}`).toBe(true)
  }
}

describe('jeu de données : métadonnées', () => {
  it('source épinglée et licence', () => {
    expect(dataset.meta.schemaVersion).toBe(1)
    expect(dataset.meta.source.package).toBe('clash-of-clans-data')
    expect(dataset.meta.source.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(dataset.meta.source.license).toBe('MIT')
    expect(dataset.meta.maxTownHall).toBe(18)
    expect(license).toContain('MIT License')
    expect(license).toContain(`clash-of-clans-data@${dataset.meta.source.version}`)
  })
})

describe('jeu de données : intégrité', () => {
  it('dataId numériques uniques, slugs uniques, trié par dataId', () => {
    const ids = dataset.entities.map((e) => e.dataId)
    expect(ids.every((id) => Number.isInteger(id) && id > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(dataset.entities.map((e) => e.id)).size).toBe(ids.length)
    expect([...ids].sort((a, b) => a - b)).toEqual(ids)
  })

  it('kinds connus, noms présents', () => {
    for (const e of dataset.entities) {
      expect(ENTITY_KINDS, e.id).toContain(e.kind)
      expect(e.name.length, e.id).toBeGreaterThan(0)
    }
  })

  it('niveaux contigus à partir de 1 (comme la source)', () => {
    for (const e of dataset.entities) {
      if (e.kind === 'crafted-defense') expect(e.levels, e.id).toEqual([])
      else expect(e.levels.length, e.id).toBeGreaterThan(0)
      for (const [label, levels] of levelTables(e)) {
        levels.forEach((l, i) => expect(l.level, `${e.id} ${label}`).toBe(i + 1))
      }
    }
  })

  it('durées entières positives ou nulles (secondes), coûts positifs ou nuls', () => {
    for (const e of dataset.entities) {
      for (const [label, levels] of levelTables(e)) {
        for (const l of levels) {
          const where = `${e.id} ${label} niv. ${l.level}`
          if (l.time !== undefined) expect(Number.isInteger(l.time) && l.time >= 0, where).toBe(true)
          checkAmounts(l.cost, where)
          if (l.storageCapacity) checkAmounts(l.storageCapacity, where)
        }
      }
      if (e.gearUp) {
        checkAmounts(e.gearUp.cost, `${e.id} gearUp`)
        expect(Number.isInteger(e.gearUp.time)).toBe(true)
      }
    }
  })

  it('durée présente partout sauf équipements et aides (source sans durée)', () => {
    for (const e of dataset.entities) {
      const expectTime = e.kind !== 'hero-equipment' && e.kind !== 'helper'
      for (const l of e.levels) expect(l.time !== undefined, `${e.id} niv. ${l.level}`).toBe(expectTime)
    }
  })

  it('HDV requis croissant ; inconnu (null) seulement en fin de table', () => {
    for (const e of dataset.entities) {
      for (const [label, levels] of levelTables(e)) {
        let previous = 0
        let seenNull = false
        for (const l of levels) {
          const where = `${e.id} ${label} niv. ${l.level}`
          if (l.townHallRequired === null) {
            seenNull = true
            continue
          }
          if (l.townHallRequired === undefined) continue // modules des défenses fabriquées
          expect(seenNull, `${where} : valeur connue après un inconnu`).toBe(false)
          expect(l.townHallRequired, where).toBeGreaterThanOrEqual(previous)
          previous = l.townHallRequired
        }
      }
    }
  })

  it('nombre par HDV : trié, entiers positifs ou nuls', () => {
    for (const e of dataset.entities) {
      if (!e.perTownHall) continue
      const ths = e.perTownHall.map((c) => c.townHall)
      expect([...ths].sort((a, b) => a - b), e.id).toEqual(ths)
      expect(new Set(ths).size, e.id).toBe(ths.length)
      for (const c of e.perTownHall) expect(Number.isInteger(c.count) && c.count >= 0, e.id).toBe(true)
    }
  })

  it('les réservoirs portent leur capacité à chaque niveau', () => {
    const expected = { 'gold-storage': 'gold', 'elixir-storage': 'elixir', 'dark-elixir-storage': 'dark-elixir' }
    const storages = dataset.entities.filter((e) => e.kind === 'storage')
    expect(storages.map((s) => s.id).sort()).toEqual(Object.keys(expected).sort())
    for (const s of storages) {
      const res = expected[s.id as keyof typeof expected]
      for (const l of s.levels) expect(Object.keys(l.storageCapacity ?? {}), `${s.id} niv. ${l.level}`).toEqual([res])
    }
  })

  it('les surcharges du repo sont valides et applicables', () => {
    expect(validateOverrides(repoOverrides, dataset)).toEqual([])
    expect(() => createGameData(dataset, repoOverrides)).not.toThrow()
  })
})

describe('jeu de données : valeurs de la source (0.19.1)', () => {
  it('Canon niv. 21 : 3 000 000 or, 1 j 12 h, HDV 15', () => {
    expect(entity('cannon').dataId).toBe(1000008)
    expect(entity('cannon').kind).toBe('defense')
    expect(level('cannon', 21)).toEqual({ level: 21, cost: { gold: 3_000_000 }, time: 36 * 3600, townHallRequired: 15 })
    expect(entity('cannon').perTownHall?.find((c) => c.townHall === 16)).toEqual({ townHall: 16, count: 7, countAfterMerges: 3 })
  })

  it('HDV niv. 18 : 25 M or, 12 j, capacité 5 M / 5 M / 50 k', () => {
    expect(level('town-hall', 18)).toEqual({
      level: 18,
      cost: { gold: 25_000_000 },
      time: 12 * 86400,
      townHallRequired: 18,
      storageCapacity: { 'dark-elixir': 50_000, elixir: 5_000_000, gold: 5_000_000 },
    })
  })

  it("Réservoir d'or niv. 19 : 18 M élixir, 12 j 12 h, capacité 6,5 M d'or", () => {
    expect(entity('gold-storage').kind).toBe('storage')
    expect(level('gold-storage', 19)).toEqual({
      level: 19,
      cost: { elixir: 18_000_000 },
      time: 12 * 86400 + 12 * 3600,
      townHallRequired: 18,
      storageCapacity: { gold: 6_500_000 },
    })
  })

  it('Mur niv. 19 : 10 M or ou élixir, 10 anneaux, HDV 18', () => {
    expect(level('wall', 19)).toEqual({
      level: 19,
      cost: { 'gold-or-elixir': 10_000_000 },
      time: 0,
      townHallRequired: 18,
      wallRings: 10,
    })
  })

  it('Archère niv. 14 : 25 M élixir, 13 j 12 h, HDV 18, labo 16', () => {
    expect(level('archer', 14)).toEqual({
      level: 14,
      cost: { elixir: 25_000_000 },
      time: 13 * 86400 + 12 * 3600,
      townHallRequired: 18,
      labRequired: 16,
    })
  })

  it('Roi barbare : niv. 105 à l’HDV 18, niv. 110 sans HDV connu', () => {
    expect(level('barbarian-king', 105)?.townHallRequired).toBe(18)
    expect(level('barbarian-king', 110)).toEqual({
      level: 110,
      cost: { 'dark-elixir': 490_000 },
      time: 8 * 86400,
      townHallRequired: null,
      heroHallRequired: 12,
    })
  })

  it('L.A.S.S.I niv. 15 : 150 000 élixir noir, 7 j 12 h, HDV 15, maison 5', () => {
    expect(level('lassi', 15)).toEqual({
      level: 15,
      cost: { 'dark-elixir': 150_000 },
      time: 7 * 86400 + 12 * 3600,
      townHallRequired: 15,
      petHouseRequired: 5,
    })
  })

  it('Gantelet du géant niv. 27 : minerais, sans durée, Forge 9', () => {
    expect(entity('giant-gauntlet')).toMatchObject({ kind: 'hero-equipment', hero: 'barbarian-king', rarity: 'epic' })
    expect(level('giant-gauntlet', 27)).toEqual({
      level: 27,
      cost: { 'glowy-ore': 600, 'shiny-ore': 3600, 'starry-ore': 150 },
      townHallRequired: 16,
      blacksmithRequired: 9,
    })
  })

  it('Logger (gardien) niv. 5 : 28 M élixir, 13 j', () => {
    expect(entity('logger').kind).toBe('guardian')
    expect(level('logger', 5)).toEqual({ level: 5, cost: { elixir: 28_000_000 }, time: 13 * 86400, townHallRequired: 18 })
  })

  it('Défense antiaérienne : supercharge 1 séparée des niveaux', () => {
    expect(entity('air-defense').levels.at(-1)?.level).toBe(16)
    expect(entity('air-defense').supercharges?.[0]).toEqual({
      level: 1,
      cost: { gold: 2_500_000 },
      time: 26 * 3600,
      townHallRequired: 18,
    })
  })

  it('objets magiques : stock max et effet', () => {
    const item = (id: string) => dataset.magicItems.find((m) => m.id === id)
    expect(item('builder-potion')).toEqual({
      id: 'builder-potion',
      name: 'Builder Potion',
      type: 'potion',
      appliesTo: ['builders'],
      effect: { type: 'time-reduction', multiplier: 10, durationSeconds: 3600 },
      maxCapacity: 5,
    })
    expect(item('hammer-of-heroes')).toMatchObject({ type: 'hammer', appliesTo: ['heroes-and-pets'], maxCapacity: 1 })
    expect(item('book-of-building')).toMatchObject({ type: 'book', maxCapacity: 1 })
    expect(item('wall-ring')?.maxCapacity).toBe(25)
    expect(item('builder-bite')).toMatchObject({ type: 'snack', maxCapacity: null })
  })
})

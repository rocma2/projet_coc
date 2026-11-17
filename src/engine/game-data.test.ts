import { describe, expect, it } from 'vitest'
import { gameDataset } from '../data/index.ts'
import syntheticExport from './__fixtures__/synthetic-export.json'
import {
  GameDataError,
  countsTowardDefensesMilestone,
  createGameData,
  validateOverrides,
  type GameDataOverrides,
  type GameDataset,
  type GameEntity,
} from './index.ts'

/** Petit jeu de données inventé, indépendant de la source réelle. */
function miniDataset(): GameDataset {
  return {
    meta: {
      schemaVersion: 1,
      source: { package: 'test', version: '0.0.0', license: 'MIT', repository: null, integrity: null, publishedAt: null },
      maxTownHall: 3,
    },
    entities: [
      {
        dataId: 1,
        id: 'hall',
        name: 'Hall',
        kind: 'town-hall',
        levels: [
          { level: 1, cost: {}, time: 0, townHallRequired: 1 },
          { level: 2, cost: { gold: 100 }, time: 60, townHallRequired: 2 },
          { level: 3, cost: { gold: 200 }, time: 120, townHallRequired: 3 },
        ],
      },
      {
        dataId: 10,
        id: 'gun',
        name: 'Gun',
        kind: 'defense',
        perTownHall: [
          { townHall: 2, count: 2 },
          { townHall: 3, count: 3, countAfterMerges: 1 },
        ],
        levels: [
          { level: 1, cost: { gold: 10 }, time: 10, townHallRequired: 2 },
          { level: 2, cost: { gold: 20 }, time: 20, townHallRequired: 2 },
          { level: 3, cost: { gold: 30 }, time: 30, townHallRequired: 3 },
        ],
      },
      { dataId: 11, id: 'mine', name: 'Mine', kind: 'trap', levels: [{ level: 1, cost: {}, time: 0, townHallRequired: 1 }] },
      {
        dataId: 20,
        id: 'champ',
        name: 'Champ',
        kind: 'hero',
        levels: [
          { level: 1, cost: {}, time: 0, townHallRequired: 2, heroHallRequired: 1 },
          { level: 2, cost: { 'dark-elixir': 5 }, time: 50, townHallRequired: 3, heroHallRequired: 1 },
          { level: 3, cost: { 'dark-elixir': 6 }, time: 60, townHallRequired: null, heroHallRequired: 1 },
        ],
      },
      {
        dataId: 30,
        id: 'boots',
        name: 'Boots',
        kind: 'hero-equipment',
        hero: 'champ',
        rarity: 'common',
        levels: [
          { level: 1, cost: {}, townHallRequired: 2 },
          { level: 2, cost: { 'shiny-ore': 100 }, townHallRequired: 2 },
        ],
      },
      { dataId: 40, id: 'soldier', name: 'Soldier', kind: 'troop', levels: [{ level: 1, cost: {}, time: 0, townHallRequired: 1 }] },
      {
        dataId: 50,
        id: 'oven',
        name: 'Oven',
        kind: 'crafted-defense',
        levels: [],
        modules: [{ name: 'Hitpoints', levels: [{ level: 1, cost: {}, time: 0 } as never] }],
      },
      { dataId: 60, id: 'keeper', name: 'Keeper', kind: 'guardian', levels: [{ level: 1, cost: {}, time: 0, townHallRequired: 3 }] },
    ],
    magicItems: [],
  }
}

const must = (e: GameEntity | undefined): GameEntity => {
  if (!e) throw new Error('entité attendue')
  return e
}

describe('createGameData : recherches', () => {
  const gd = createGameData(miniDataset())
  const gun = must(gd.byDataId(10))

  it('par dataId, par slug, resolve', () => {
    expect(gd.bySlug('gun')).toBe(gun)
    expect(gun.origin).toBe('dataset')
    expect(gd.byDataId(999)).toBeUndefined()
    expect(gd.bySlug('nope')).toBeUndefined()
    expect(gd.resolve(10)).toEqual({ status: 'known', entity: gun })
    expect(gd.resolve(999)).toEqual({ status: 'upcoming', dataId: 999, reason: 'unknown-entity' })
  })

  it('maxLevelAt : niveaux accessibles par HDV', () => {
    expect(gd.maxLevelAt(gun, 1)).toEqual({ status: 'known', level: 0 })
    expect(gd.maxLevelAt(gun, 2)).toEqual({ status: 'known', level: 2 })
    expect(gd.maxLevelAt(gun, 3)).toEqual({ status: 'known', level: 3 })
    expect(gd.maxLevelAt(must(gd.bySlug('hall')), 2)).toEqual({ status: 'known', level: 2 })
  })

  it('maxLevelAt : HDV non couvert → « à venir » avec borne basse', () => {
    expect(gd.maxLevelAt(gun, 4)).toEqual({ status: 'upcoming', level: 3, reason: 'town-hall-not-covered' })
  })

  it('maxLevelAt : un HDV requis inconnu arrête la progression', () => {
    expect(gd.maxLevelAt(must(gd.bySlug('champ')), 3)).toEqual({ status: 'known', level: 2 })
  })

  it('maxLevelAt : entité sans table de niveaux', () => {
    expect(gd.maxLevelAt(must(gd.bySlug('oven')), 3)).toEqual({ status: 'upcoming', level: 0, reason: 'no-levels' })
  })

  it('levelsBetween : niveaux connus et niveaux manquants', () => {
    expect(gd.levelsBetween(gun, 1, 3).levels.map((l) => l.level)).toEqual([2, 3])
    expect(gd.levelsBetween(gun, 1, 3).missing).toEqual([])
    expect(gd.levelsBetween(gun, 2, 5)).toMatchObject({ missing: [4, 5] })
    expect(gd.levelsBetween(gun, 3, 3)).toEqual({ levels: [], missing: [] })
  })

  it('countAt : avant, pendant, après la table', () => {
    expect(gd.countAt(gun, 1)).toEqual({ status: 'known', count: 0 })
    expect(gd.countAt(gun, 2)).toEqual({ status: 'known', count: 2 })
    expect(gd.countAt(gun, 3)).toEqual({ status: 'known', count: 3, countAfterMerges: 1 })
    expect(gd.countAt(gun, 4)).toEqual({ status: 'upcoming', reason: 'town-hall-not-covered' })
    expect(gd.countAt(must(gd.bySlug('hall')), 3)).toEqual({ status: 'known', count: 1 })
    expect(gd.countAt(must(gd.bySlug('soldier')), 3)).toEqual({ status: 'upcoming', reason: 'no-count-data' })
  })

  it('upgradeOf : coût, durée, HDV ; niveau absent → « à venir »', () => {
    expect(gd.upgradeOf(gun, 3)).toEqual({ status: 'known', level: 3, cost: { gold: 30 }, timeSeconds: 30, townHallRequired: 3 })
    expect(gd.upgradeOf(gun, 4)).toEqual({ status: 'upcoming', level: 4, reason: 'missing-level' })
    expect(gd.upgradeOf(gun, 0)).toEqual({ status: 'upcoming', level: 0, reason: 'missing-level' })
    expect(gd.upgradeOf(must(gd.bySlug('boots')), 2)).toMatchObject({ status: 'known', timeSeconds: null })
  })
})

describe('createGameData : surcharges', () => {
  it('corrige un niveau sans muter le jeu de données', () => {
    const dataset = miniDataset()
    const before = structuredClone(dataset)
    const gd = createGameData(dataset, {
      schemaVersion: 1,
      entities: [{ dataId: 10, levels: [{ level: 2, cost: { gold: 25 }, time: 99 }] }],
    })
    const gun = must(gd.byDataId(10))
    expect(gun.origin).toBe('patched')
    expect(gd.upgradeOf(gun, 2)).toEqual({ status: 'known', level: 2, cost: { gold: 25 }, timeSeconds: 99, townHallRequired: 2 })
    expect(gd.upgradeOf(gun, 3)).toMatchObject({ cost: { gold: 30 } })
    expect(dataset).toEqual(before)
    // Une autre instance sans surcharge voit la valeur d'origine.
    expect(createGameData(dataset).upgradeOf(must(createGameData(dataset).byDataId(10)), 2)).toMatchObject({ cost: { gold: 20 } })
  })

  it('ajoute un niveau : HDV couvert grâce à la surcharge', () => {
    const gd = createGameData(miniDataset(), {
      schemaVersion: 1,
      entities: [
        {
          dataId: 10,
          levels: [{ level: 4, cost: { gold: 40 }, time: 40, townHallRequired: 4 }],
          perTownHall: [{ townHall: 4, count: 3 }],
        },
      ],
    })
    const gun = must(gd.byDataId(10))
    expect(gd.maxLevelAt(gun, 3)).toEqual({ status: 'known', level: 3 })
    expect(gd.maxLevelAt(gun, 4)).toEqual({ status: 'known', level: 4 })
    expect(gd.levelsBetween(gun, 2, 4).missing).toEqual([])
    expect(gd.countAt(gun, 4)).toEqual({ status: 'known', count: 3 })
    expect(gd.countAt(gun, 3)).toEqual({ status: 'known', count: 3, countAfterMerges: 1 })
  })

  it('ajoute une entité inconnue', () => {
    const gd = createGameData(miniDataset(), {
      schemaVersion: 1,
      entities: [
        {
          dataId: 70,
          id: 'new-tower',
          name: 'New Tower',
          kind: 'defense',
          levels: [{ level: 1, cost: { gold: 1 }, time: 1, townHallRequired: 4 }],
          perTownHall: [{ townHall: 4, count: 1 }],
        },
      ],
    })
    const r = gd.resolve(70)
    expect(r.status).toBe('known')
    const tower = must(gd.bySlug('new-tower'))
    expect(tower.origin).toBe('added')
    expect(gd.maxLevelAt(tower, 4)).toEqual({ status: 'known', level: 1 })
    expect(gd.maxLevelAt(tower, 3)).toEqual({ status: 'known', level: 0 })
    expect(gd.entities.map((e) => e.dataId)).toEqual([...gd.entities.map((e) => e.dataId)].sort((a, b) => a - b))
  })

  it('niveau max déclaré par le joueur pour un HDV', () => {
    const gd = createGameData(miniDataset(), {
      schemaVersion: 1,
      entities: [{ dataId: 10, maxLevelByTownHall: { '4': 3 } }],
    })
    expect(gd.maxLevelAt(must(gd.byDataId(10)), 4)).toEqual({ status: 'known', level: 3 })
  })

  it('surcharges invalides : erreur détaillée', () => {
    const bad = {
      schemaVersion: 1,
      entities: [
        { dataId: 999 },
        { dataId: 10, levels: [{ level: 4, cost: { gold: 1 } }] },
        { dataId: 11, levels: [{ level: 3, cost: { gold: 1 }, time: 1, townHallRequired: 1 }] },
        { dataId: 20, levels: [{ level: 1, cost: { mana: 3 } }] },
      ],
    }
    const issues = validateOverrides(bad, miniDataset())
    expect(issues.some((i) => i.includes('999') && i.includes('id, name et kind'))).toBe(true)
    expect(issues.some((i) => i.includes('townHallRequired requis'))).toBe(true)
    expect(issues.some((i) => i.includes('time requis'))).toBe(true)
    expect(issues.some((i) => i.includes('trou entre les niveaux 1 et 3'))).toBe(true)
    expect(issues.some((i) => i.includes('ressource inconnue « mana »'))).toBe(true)
    expect(() => createGameData(miniDataset(), bad as unknown as GameDataOverrides)).toThrow(GameDataError)
    expect(validateOverrides({ schemaVersion: 2, entities: [] }, miniDataset())).toEqual(['schemaVersion doit valoir 1'])
  })

  it('niveau ajouté à un équipement : durée non exigée', () => {
    expect(
      validateOverrides(
        { schemaVersion: 1, entities: [{ dataId: 30, levels: [{ level: 3, cost: { 'shiny-ore': 200 }, townHallRequired: 3 }] }] },
        miniDataset(),
      ),
    ).toEqual([])
  })
})

describe('jalon « défenses maxées »', () => {
  it('défenses et gardiens, pas les pièges, murs, HDV ni défenses fabriquées', () => {
    expect(countsTowardDefensesMilestone({ kind: 'defense' })).toBe(true)
    expect(countsTowardDefensesMilestone({ kind: 'guardian' })).toBe(true)
    for (const kind of ['trap', 'wall', 'town-hall', 'crafted-defense', 'storage', 'army-building', 'hero'] as const) {
      expect(countsTowardDefensesMilestone({ kind }), kind).toBe(false)
    }
  })

  it('sur les vraies données : hutte d’ouvrier oui, station de fabrication non', () => {
    const gd = createGameData(gameDataset)
    expect(countsTowardDefensesMilestone(must(gd.bySlug('builders-hut')))).toBe(true)
    expect(countsTowardDefensesMilestone(must(gd.bySlug('crafting-station')))).toBe(false)
    expect(countsTowardDefensesMilestone(must(gd.bySlug('spring-trap')))).toBe(false)
    expect(gd.entities.filter(countsTowardDefensesMilestone).length).toBe(24)
  })
})

describe('sur les vraies données', () => {
  const gd = createGameData(gameDataset)

  it('Canon : max 21 à l’HDV 15, « à venir » à l’HDV 19', () => {
    const cannon = must(gd.byDataId(1000008))
    expect(gd.maxLevelAt(cannon, 15)).toEqual({ status: 'known', level: 21 })
    expect(gd.maxLevelAt(cannon, 19)).toEqual({ status: 'upcoming', level: 21, reason: 'town-hall-not-covered' })
    expect(gd.countAt(cannon, 19)).toEqual({ status: 'upcoming', reason: 'town-hall-not-covered' })
  })

  it('Roi barbare : max 105 à l’HDV 18', () => {
    expect(gd.maxLevelAt(must(gd.bySlug('barbarian-king')), 18)).toEqual({ status: 'known', level: 105 })
  })
})

describe('export synthétique (fixture)', () => {
  const gd = createGameData(gameDataset)
  const sections = ['buildings', 'traps', 'units', 'siege_machines', 'heroes', 'spells', 'pets', 'equipment', 'helpers', 'guardians'] as const
  const items = sections.flatMap((s) => syntheticExport[s] as { data: number; lvl: number; timer?: number }[])

  it('a la forme d’un export, avec un tag fictif', () => {
    expect(syntheticExport.tag).toBe('#TEST000')
    expect(items.filter((i) => i.timer !== undefined).length).toBeGreaterThanOrEqual(2)
  })

  it('chaque identifiant se résout sans exception ; l’inconnu est « à venir »', () => {
    const unknown = items.filter((i) => gd.resolve(i.data).status === 'upcoming').map((i) => i.data)
    expect(unknown).toEqual([1999999])
    for (const i of items) {
      const r = gd.resolve(i.data)
      if (r.status === 'known') expect(gd.upgradeOf(r.entity, i.lvl).status).toBe('known')
    }
  })
})

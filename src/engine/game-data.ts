/**
 * Données de jeu : types du jeu de données généré (src/data/generated/game-data.json),
 * surcharges (PRD §6.2) et recherches utilisées par la simulation.
 *
 * Module pur : aucune entrée-sortie. Le jeu de données et les surcharges sont passés
 * en paramètre. Rien n'est jamais muté.
 *
 * Convention de niveaux (celle de la source) : l'entrée `level: N` décrit le passage
 * du niveau N − 1 au niveau N (pour N = 1 : la construction). Son coût, sa durée et
 * son HDV requis sont donc ceux de cette amélioration.
 *
 * Règle « à venir » (PRD §6.2) : un identifiant inconnu, un niveau absent ou un HDV
 * que les données ne couvrent pas donnent un statut `upcoming` explicite, jamais une
 * exception. L'appelant l'affiche « à venir » et l'exclut des calculs.
 */

// ---------------------------------------------------------------------------
// Jeu de données

export type EntityKind =
  | 'town-hall'
  | 'defense'
  | 'trap'
  | 'wall'
  | 'storage'
  | 'resource-collector'
  | 'army-building'
  | 'other-building'
  | 'guardian'
  | 'crafted-defense'
  | 'troop'
  | 'spell'
  | 'siege-machine'
  | 'hero'
  | 'pet'
  | 'hero-equipment'
  | 'helper'

export const ENTITY_KINDS: readonly EntityKind[] = [
  'town-hall',
  'defense',
  'trap',
  'wall',
  'storage',
  'resource-collector',
  'army-building',
  'other-building',
  'guardian',
  'crafted-defense',
  'troop',
  'spell',
  'siege-machine',
  'hero',
  'pet',
  'hero-equipment',
  'helper',
]

export type Resource =
  | 'gold'
  | 'elixir'
  | 'dark-elixir'
  /** Murs à partir du niveau 5 : payables en or ou en élixir. */
  | 'gold-or-elixir'
  | 'gems'
  | 'season-challenge-points'
  | 'shiny-ore'
  | 'glowy-ore'
  | 'starry-ore'
  | 'sparky-stones'

export const RESOURCES: readonly Resource[] = [
  'gold',
  'elixir',
  'dark-elixir',
  'gold-or-elixir',
  'gems',
  'season-challenge-points',
  'shiny-ore',
  'glowy-ore',
  'starry-ore',
  'sparky-stones',
]

/** Montants par ressource ; une ressource absente vaut 0. `{}` = gratuit. */
export type ResourceAmounts = Partial<Record<Resource, number>>

export interface LevelData {
  level: number
  cost: ResourceAmounts
  /** Durée en secondes. Absente quand la source n'en donne pas (équipements, aides). */
  time?: number
  /**
   * HDV minimal pour ce niveau. `null` : inconnu. Pour les héros et les équipements,
   * déduit des plafonds du Hero Hall et de la Forge (la source ne le donne pas).
   */
  townHallRequired: number | null
  labRequired?: number
  heroHallRequired?: number
  petHouseRequired?: number
  blacksmithRequired?: number
  /** Capacité de stockage à ce niveau (réservoirs et HDV), règle §9.1. */
  storageCapacity?: ResourceAmounts
  /** Anneaux de mur acceptés pour ce niveau de mur. */
  wallRings?: number
}

export interface TownHallCount {
  townHall: number
  count: number
  /** Nombre restant après fusions (canons → canon ricochet, etc.). */
  countAfterMerges?: number
}

export interface EntityData {
  /** Identifiant numérique du jeu (champ `data` de l'export). */
  dataId: number
  /** Slug stable (identifiant du paquet source). */
  id: string
  /** Nom anglais. */
  name: string
  kind: EntityKind
  /** Équipements : slug du héros. */
  hero?: string
  /** Équipements : rareté (`common`, `epic`). */
  rarity?: string
  perTownHall?: TownHallCount[]
  levels: LevelData[]
  /** Niveaux de supercharge (après le max), numérotés à partir de 1. */
  supercharges?: LevelData[]
  /** Gear up (bâtiment de la base des ouvriers requis). */
  gearUp?: { cost: ResourceAmounts; time: number; requiresLevel: number }
  /** Arme de l'HDV par niveau d'HDV (HDV 12 à 17). */
  weapons?: { townHall: number; name: string; levels: LevelData[] }[]
  /** Défenses fabriquées : modules améliorables (pas de `levels`). */
  modules?: { name: string; levels: LevelData[] }[]
}

export interface MagicItemData {
  id: string
  name: string
  type: 'book' | 'hammer' | 'potion' | 'snack' | 'utility'
  appliesTo: string[]
  effect: { type: string; multiplier?: number; durationSeconds?: number }
  /** Stock maximal ; `null` si la source n'en donne pas (snacks). */
  maxCapacity: number | null
}

export interface GameDatasetMeta {
  schemaVersion: 1
  source: {
    package: string
    version: string
    license: string
    repository: string | null
    integrity: string | null
    publishedAt: string | null
  }
  /** Plus haut niveau d'HDV décrit par les données. */
  maxTownHall: number | null
}

export interface GameDataset {
  meta: GameDatasetMeta
  entities: EntityData[]
  magicItems: MagicItemData[]
}

// ---------------------------------------------------------------------------
// Surcharges (PRD §6.2 : les corrections du joueur passent toujours avant)

/** Correction ou ajout d'un niveau : seuls les champs fournis remplacent ceux des données. */
export type LevelOverride = { level: number } & Partial<Omit<LevelData, 'level'>>

export interface EntityOverride {
  /** Identifiant du jeu. S'il est inconnu des données, `id`, `name` et `kind` sont requis. */
  dataId: number
  id?: string
  name?: string
  kind?: EntityKind
  /** Niveaux corrigés (fusion champ par champ) ou ajoutés (cost, townHallRequired, time requis). */
  levels?: LevelOverride[]
  /** Nombre d'exemplaires par HDV, fusionné par `townHall`. */
  perTownHall?: TownHallCount[]
  /** Niveau max déclaré pour un HDV (clé : niveau d'HDV), prioritaire sur le calcul. */
  maxLevelByTownHall?: Record<string, number>
  /** Commentaire libre (source de la correction). */
  note?: string
}

export interface GameDataOverrides {
  schemaVersion: 1
  entities: EntityOverride[]
}

export const EMPTY_OVERRIDES: GameDataOverrides = { schemaVersion: 1, entities: [] }

export class GameDataError extends Error {
  readonly issues: readonly string[]
  constructor(issues: readonly string[]) {
    super(`Surcharges invalides :\n- ${issues.join('\n- ')}`)
    this.name = 'GameDataError'
    this.issues = issues
  }
}

// ---------------------------------------------------------------------------
// Résultats

export type EntityOrigin = 'dataset' | 'patched' | 'added'

export interface GameEntity extends EntityData {
  /** `dataset` : tel quel ; `patched` : corrigé par une surcharge ; `added` : créé par une surcharge. */
  origin: EntityOrigin
  maxLevelByTownHall?: Record<string, number>
}

export type UpcomingReason =
  /** Identifiant absent des données et des surcharges. */
  | 'unknown-entity'
  /** Niveau absent des données. */
  | 'missing-level'
  /** HDV au-delà de ce que les données décrivent. */
  | 'town-hall-not-covered'
  /** Entité sans table de niveaux (défenses fabriquées : voir `modules`). */
  | 'no-levels'
  /** Entité sans nombre d'exemplaires par HDV. */
  | 'no-count-data'

export type Resolved =
  | { status: 'known'; entity: GameEntity }
  | { status: 'upcoming'; dataId: number; reason: 'unknown-entity' }

export type MaxLevel =
  | { status: 'known'; level: number }
  /** `level` : borne basse (plus haut niveau connu accessible), 0 si aucun. */
  | { status: 'upcoming'; level: number; reason: 'town-hall-not-covered' | 'no-levels' }

export type Upgrade =
  | {
      status: 'known'
      level: number
      cost: ResourceAmounts
      /** `null` : la source ne donne pas de durée (équipements, aides). */
      timeSeconds: number | null
      townHallRequired: number | null
    }
  | { status: 'upcoming'; level: number; reason: 'missing-level' }

export interface LevelRange {
  /** Niveaux connus de `from + 1` à `to`, dans l'ordre. */
  levels: LevelData[]
  /** Niveaux de la plage absents des données (« à venir »). */
  missing: number[]
}

export type CountAt =
  | { status: 'known'; count: number; countAfterMerges?: number }
  | { status: 'upcoming'; reason: 'town-hall-not-covered' | 'no-count-data' }

export interface GameData {
  readonly meta: GameDatasetMeta
  readonly entities: readonly GameEntity[]
  readonly magicItems: readonly MagicItemData[]
  byDataId(dataId: number): GameEntity | undefined
  bySlug(id: string): GameEntity | undefined
  /** Identifiant de l'export → entité, ou « à venir » s'il est inconnu. */
  resolve(dataId: number): Resolved
  /** Plus haut niveau accessible avec cet HDV. */
  maxLevelAt(entity: GameEntity, townHallLevel: number): MaxLevel
  /** Améliorations nécessaires pour passer de `fromLevel` à `toLevel`. */
  levelsBetween(entity: GameEntity, fromLevel: number, toLevel: number): LevelRange
  /** Nombre d'exemplaires du bâtiment à cet HDV. */
  countAt(entity: GameEntity, townHallLevel: number): CountAt
  /** Coût et durée du passage au niveau `level` (depuis `level − 1`). */
  upgradeOf(entity: GameEntity, level: number): Upgrade
}

// ---------------------------------------------------------------------------
// Jalon « défenses maxées » (PRD §5)

/**
 * Kinds comptés pour le jalon « défenses maxées » :
 * - `defense` : toutes les défenses du paquet, y compris la hutte d'ouvrier (elle a une
 *   arme depuis l'HDV 14 et s'améliore avec un constructeur) ; la station de fabrication,
 *   rangée par la source dans les défenses, est classée `other-building` (un seul niveau,
 *   ne tire pas) ;
 * - `guardian` : gardiens de l'HDV 18, défenseurs permanents améliorés par les constructeurs.
 *
 * Exclus : pièges et murs (jalons séparés, PRD §5 « Tout maxé »), l'HDV (sa propre
 * progression), les défenses fabriquées (saisonnières, remises à zéro à chaque saison),
 * les bâtiments d'armée, de ressources et autres.
 */
export const DEFENSES_MILESTONE_KINDS: readonly EntityKind[] = ['defense', 'guardian']

export function countsTowardDefensesMilestone(entity: Pick<EntityData, 'kind'>): boolean {
  return DEFENSES_MILESTONE_KINDS.includes(entity.kind)
}

// ---------------------------------------------------------------------------
// Validation et fusion des surcharges

/** Kinds dont la source ne donne aucune durée : `time` n'est pas exigé pour un niveau ajouté. */
const KINDS_WITHOUT_TIME: readonly EntityKind[] = ['hero-equipment', 'helper']

const LEVEL_NUMBER_FIELDS = [
  'time',
  'labRequired',
  'heroHallRequired',
  'petHouseRequired',
  'blacksmithRequired',
  'wallRings',
] as const

function isNonNegativeInteger(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

function isPositiveInteger(v: unknown): v is number {
  return isNonNegativeInteger(v) && v >= 1
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function checkAmounts(v: unknown, where: string, issues: string[]): void {
  if (!isRecord(v)) {
    issues.push(`${where} : doit être un objet ressource → montant`)
    return
  }
  for (const [res, amount] of Object.entries(v)) {
    if (!(RESOURCES as readonly string[]).includes(res)) issues.push(`${where} : ressource inconnue « ${res} »`)
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      issues.push(`${where}.${res} : montant invalide`)
    }
  }
}

/**
 * Vérifie des surcharges (fichier du repo ou saisie du joueur) contre un jeu de données.
 * Renvoie la liste des problèmes, vide si tout est valide.
 */
export function validateOverrides(overrides: unknown, dataset: GameDataset): string[] {
  const issues: string[] = []
  if (!isRecord(overrides)) return ['les surcharges doivent être un objet']
  if (overrides.schemaVersion !== 1) issues.push('schemaVersion doit valoir 1')
  if (!Array.isArray(overrides.entities)) {
    issues.push('entities doit être un tableau')
    return issues
  }
  const known = new Map(dataset.entities.map((e) => [e.dataId, e]))
  const seen = new Set<number>()
  const slugs = new Map(dataset.entities.map((e) => [e.id, e.dataId]))

  overrides.entities.forEach((raw: unknown, i: number) => {
    const where = `entities[${i}]`
    if (!isRecord(raw)) {
      issues.push(`${where} : doit être un objet`)
      return
    }
    if (!isPositiveInteger(raw.dataId)) {
      issues.push(`${where}.dataId : entier positif requis`)
      return
    }
    const dataId = raw.dataId
    if (seen.has(dataId)) issues.push(`${where} : dataId ${dataId} surchargé deux fois`)
    seen.add(dataId)
    const base = known.get(dataId)
    if (raw.id !== undefined && (typeof raw.id !== 'string' || raw.id === '')) issues.push(`${where}.id : texte requis`)
    if (raw.name !== undefined && (typeof raw.name !== 'string' || raw.name === '')) issues.push(`${where}.name : texte requis`)
    if (raw.kind !== undefined && !(ENTITY_KINDS as readonly unknown[]).includes(raw.kind)) {
      issues.push(`${where}.kind : kind inconnu « ${String(raw.kind)} »`)
    }
    if (raw.note !== undefined && typeof raw.note !== 'string') issues.push(`${where}.note : texte requis`)
    if (!base) {
      if (raw.id === undefined || raw.name === undefined || raw.kind === undefined) {
        issues.push(`${where} : dataId ${dataId} inconnu des données, id, name et kind sont requis`)
      }
    } else if (raw.id !== undefined && raw.id !== base.id) {
      issues.push(`${where}.id : « ${String(raw.id)} » ne correspond pas à l'entité ${dataId} (« ${base.id} »)`)
    }
    if (typeof raw.id === 'string') {
      const owner = slugs.get(raw.id)
      if (owner !== undefined && owner !== dataId) issues.push(`${where}.id : slug « ${raw.id} » déjà utilisé par ${owner}`)
      slugs.set(raw.id, dataId)
    }
    const kind = (raw.kind as EntityKind | undefined) ?? base?.kind

    const baseLevels = new Set((base?.levels ?? []).map((l) => l.level))
    const levelNumbers = new Set(baseLevels)
    if (raw.levels !== undefined) {
      if (!Array.isArray(raw.levels)) issues.push(`${where}.levels : tableau requis`)
      else {
        const own = new Set<number>()
        raw.levels.forEach((l: unknown, j: number) => {
          const lw = `${where}.levels[${j}]`
          if (!isRecord(l) || !isPositiveInteger(l.level)) {
            issues.push(`${lw}.level : entier ≥ 1 requis`)
            return
          }
          if (own.has(l.level)) issues.push(`${lw} : niveau ${l.level} présent deux fois`)
          own.add(l.level)
          for (const f of LEVEL_NUMBER_FIELDS) {
            if (l[f] !== undefined && !isNonNegativeInteger(l[f])) issues.push(`${lw}.${f} : entier ≥ 0 requis`)
          }
          if (l.townHallRequired !== undefined && l.townHallRequired !== null && !isPositiveInteger(l.townHallRequired)) {
            issues.push(`${lw}.townHallRequired : entier ≥ 1 ou null requis`)
          }
          if (l.cost !== undefined) checkAmounts(l.cost, `${lw}.cost`, issues)
          if (l.storageCapacity !== undefined) checkAmounts(l.storageCapacity, `${lw}.storageCapacity`, issues)
          if (!baseLevels.has(l.level)) {
            // Nouveau niveau : il doit être complet pour entrer dans les calculs.
            if (l.cost === undefined) issues.push(`${lw} : nouveau niveau, cost requis`)
            if (l.townHallRequired === undefined) issues.push(`${lw} : nouveau niveau, townHallRequired requis`)
            if (l.time === undefined && !(kind && KINDS_WITHOUT_TIME.includes(kind))) {
              issues.push(`${lw} : nouveau niveau, time requis (secondes)`)
            }
          }
          levelNumbers.add(l.level)
        })
      }
    }
    const sorted = [...levelNumbers].sort((a, b) => a - b)
    for (let k = 1; k < sorted.length; k++) {
      const prev = sorted[k - 1] as number
      const cur = sorted[k] as number
      if (cur !== prev + 1) issues.push(`${where}.levels : trou entre les niveaux ${prev} et ${cur}`)
    }

    if (raw.perTownHall !== undefined) {
      if (!Array.isArray(raw.perTownHall)) issues.push(`${where}.perTownHall : tableau requis`)
      else
        raw.perTownHall.forEach((c: unknown, j: number) => {
          const cw = `${where}.perTownHall[${j}]`
          if (!isRecord(c) || !isPositiveInteger(c.townHall) || !isNonNegativeInteger(c.count)) {
            issues.push(`${cw} : townHall (≥ 1) et count (≥ 0) entiers requis`)
          } else if (c.countAfterMerges !== undefined && !isNonNegativeInteger(c.countAfterMerges)) {
            issues.push(`${cw}.countAfterMerges : entier ≥ 0 requis`)
          }
        })
    }
    if (raw.maxLevelByTownHall !== undefined) {
      if (!isRecord(raw.maxLevelByTownHall)) issues.push(`${where}.maxLevelByTownHall : objet requis`)
      else
        for (const [th, lvl] of Object.entries(raw.maxLevelByTownHall)) {
          if (!/^[1-9]\d*$/.test(th)) issues.push(`${where}.maxLevelByTownHall : clé « ${th} » n'est pas un niveau d'HDV`)
          if (!isNonNegativeInteger(lvl)) issues.push(`${where}.maxLevelByTownHall.${th} : entier ≥ 0 requis`)
        }
    }
  })
  return issues
}

function mergeLevels(base: readonly LevelData[], patches: readonly LevelOverride[]): LevelData[] {
  const byLevel = new Map<number, LevelData>(base.map((l) => [l.level, l]))
  for (const p of patches) {
    const current = byLevel.get(p.level)
    // Un niveau ajouté a été validé complet (cost et townHallRequired présents).
    const merged = { ...(current ?? { level: p.level, cost: {}, townHallRequired: null }), ...p } as LevelData
    byLevel.set(p.level, merged)
  }
  return [...byLevel.values()].sort((a, b) => a.level - b.level)
}

function applyOverride(base: EntityData | undefined, o: EntityOverride): GameEntity {
  const entity: GameEntity = base
    ? { ...base, origin: 'patched' }
    : { dataId: o.dataId, id: o.id as string, name: o.name as string, kind: o.kind as EntityKind, levels: [], origin: 'added' }
  if (o.name !== undefined) entity.name = o.name
  if (o.kind !== undefined) entity.kind = o.kind
  if (o.levels) entity.levels = mergeLevels(entity.levels, o.levels)
  if (o.perTownHall) {
    const byTh = new Map((entity.perTownHall ?? []).map((c) => [c.townHall, c]))
    for (const c of o.perTownHall) byTh.set(c.townHall, { ...c })
    entity.perTownHall = [...byTh.values()].sort((a, b) => a.townHall - b.townHall)
  }
  if (o.maxLevelByTownHall) entity.maxLevelByTownHall = { ...o.maxLevelByTownHall }
  return entity
}

// ---------------------------------------------------------------------------
// Recherches

/**
 * Construit les recherches sur un jeu de données, surcharges appliquées par-dessus.
 * Lève `GameDataError` si les surcharges sont invalides ; ne mute ni l'un ni l'autre.
 */
export function createGameData(dataset: GameDataset, overrides: GameDataOverrides = EMPTY_OVERRIDES): GameData {
  const issues = validateOverrides(overrides, dataset)
  if (issues.length) throw new GameDataError(issues)

  const overrideById = new Map(overrides.entities.map((o) => [o.dataId, o]))
  const entities: GameEntity[] = dataset.entities.map((e) => {
    const o = overrideById.get(e.dataId)
    return o ? applyOverride(e, o) : { ...e, origin: 'dataset' }
  })
  const knownIds = new Set(dataset.entities.map((e) => e.dataId))
  for (const o of overrides.entities) if (!knownIds.has(o.dataId)) entities.push(applyOverride(undefined, o))
  entities.sort((a, b) => a.dataId - b.dataId)

  const byDataId = new Map(entities.map((e) => [e.dataId, e]))
  const bySlug = new Map(entities.map((e) => [e.id, e]))
  const datasetMaxTownHall = dataset.meta.maxTownHall ?? 0

  /** Plus haut HDV que les données (surcharges comprises) décrivent pour cette entité. */
  function coveredTownHall(entity: GameEntity): number {
    let max = datasetMaxTownHall
    for (const l of entity.levels) if (l.townHallRequired !== null && l.townHallRequired > max) max = l.townHallRequired
    return max
  }

  function levelOf(entity: GameEntity, level: number): LevelData | undefined {
    return entity.levels.find((l) => l.level === level)
  }

  function maxLevelAt(entity: GameEntity, townHallLevel: number): MaxLevel {
    const declared = entity.maxLevelByTownHall?.[String(townHallLevel)]
    if (declared !== undefined) return { status: 'known', level: declared }
    if (entity.levels.length === 0) return { status: 'upcoming', level: 0, reason: 'no-levels' }
    let best = 0
    let previous: number | undefined
    for (const l of entity.levels) {
      if (previous !== undefined && l.level !== previous + 1) break
      if (l.townHallRequired === null || l.townHallRequired > townHallLevel) break
      best = l.level
      previous = l.level
    }
    if (townHallLevel > coveredTownHall(entity)) return { status: 'upcoming', level: best, reason: 'town-hall-not-covered' }
    return { status: 'known', level: best }
  }

  function levelsBetween(entity: GameEntity, fromLevel: number, toLevel: number): LevelRange {
    const levels: LevelData[] = []
    const missing: number[] = []
    for (let n = fromLevel + 1; n <= toLevel; n++) {
      const l = levelOf(entity, n)
      if (l) levels.push(l)
      else missing.push(n)
    }
    return { levels, missing }
  }

  function countAt(entity: GameEntity, townHallLevel: number): CountAt {
    if (entity.kind === 'town-hall') return { status: 'known', count: 1 }
    const table = entity.perTownHall
    if (!table || table.length === 0) return { status: 'upcoming', reason: 'no-count-data' }
    const exact = table.find((c) => c.townHall === townHallLevel)
    if (exact) {
      return exact.countAfterMerges === undefined
        ? { status: 'known', count: exact.count }
        : { status: 'known', count: exact.count, countAfterMerges: exact.countAfterMerges }
    }
    const first = table[0] as TownHallCount
    const last = table[table.length - 1] as TownHallCount
    // Avant la première ligne : bâtiment pas encore débloqué.
    if (townHallLevel < first.townHall) return { status: 'known', count: 0 }
    if (townHallLevel > last.townHall) return { status: 'upcoming', reason: 'town-hall-not-covered' }
    // Trou dans la table : on ne devine pas.
    return { status: 'upcoming', reason: 'no-count-data' }
  }

  function upgradeOf(entity: GameEntity, level: number): Upgrade {
    const l = levelOf(entity, level)
    if (!l) return { status: 'upcoming', level, reason: 'missing-level' }
    return {
      status: 'known',
      level,
      cost: l.cost,
      timeSeconds: l.time ?? null,
      townHallRequired: l.townHallRequired,
    }
  }

  return {
    meta: dataset.meta,
    entities,
    magicItems: dataset.magicItems,
    byDataId: (dataId) => byDataId.get(dataId),
    bySlug: (id) => bySlug.get(id),
    resolve(dataId) {
      const entity = byDataId.get(dataId)
      return entity ? { status: 'known', entity } : { status: 'upcoming', dataId, reason: 'unknown-entity' }
    },
    maxLevelAt,
    levelsBetween,
    countAt,
    upgradeOf,
  }
}

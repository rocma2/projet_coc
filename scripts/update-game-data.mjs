#!/usr/bin/env node
/**
 * Régénère src/data/generated/ à partir du paquet npm `clash-of-clans-data` (MIT).
 *
 * Usage :
 *   npm run data:update                    # version épinglée dans game-data.json (meta.source.version)
 *   npm run data:update -- --latest        # dernière version publiée sur npm
 *   npm run data:update -- --version 0.19.1
 *
 * Le paquet est téléchargé avec `npm pack` dans un dossier temporaire, seuls
 * `data/home/**`, `data/magic-items/**` et `LICENSE` sont lus (les 76 Mo d'images
 * ne sont jamais extraits), puis un jeu de données compact et déterministe est écrit.
 * Aucune dépendance : tar et gzip sont lus avec node:zlib et un mini-lecteur tar.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const PACKAGE = 'clash-of-clans-data'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'src', 'data', 'generated')
const OUT_FILE = path.join(OUT_DIR, 'game-data.json')
const LICENSE_FILE = path.join(OUT_DIR, 'LICENSE-clash-of-clans-data')
const SCHEMA_VERSION = 1

// ---------------------------------------------------------------------------
// Arguments

function parseArgs(argv) {
  const args = { latest: false, version: undefined }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--latest') args.latest = true
    else if (a === '--version') args.version = argv[++i]
    else if (a.startsWith('--version=')) args.version = a.slice('--version='.length)
    else if (a === '--help' || a === '-h') {
      console.log('Usage: npm run data:update [-- --latest | --version <x.y.z>]')
      process.exit(0)
    } else throw new Error(`Argument inconnu : ${a}`)
  }
  if (args.latest && args.version) throw new Error('--latest et --version sont exclusifs')
  return args
}

// ---------------------------------------------------------------------------
// npm

function npm(args, cwd) {
  // Sous `npm run`, npm_execpath pointe vers npm-cli.js : on l'appelle via node,
  // ce qui évite le shell (et les soucis de npm.cmd sous Windows).
  const execPath = process.env.npm_execpath
  if (execPath && /\.c?js$/.test(execPath)) {
    return execFileSync(process.execPath, [execPath, ...args], { cwd, encoding: 'utf8' })
  }
  return execFileSync('npm', args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
}

function pinnedVersion() {
  if (!fs.existsSync(OUT_FILE)) return undefined
  const current = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'))
  return current?.meta?.source?.version
}

// ---------------------------------------------------------------------------
// Lecture tar (ustar + en-têtes PAX/GNU pour les noms longs)

function readTarEntries(buffer, wanted) {
  const files = new Map()
  let offset = 0
  let longName
  const str = (start, len) => {
    const slice = buffer.subarray(start, start + len)
    const end = slice.indexOf(0)
    return slice.subarray(0, end === -1 ? len : end).toString('utf8')
  }
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512)
    if (header.every((b) => b === 0)) break
    let name = str(offset, 100)
    const size = parseInt(str(offset + 124, 12).trim() || '0', 8)
    const type = String.fromCharCode(header[156] || 48)
    const prefix = str(offset + 345, 155)
    if (prefix) name = `${prefix}/${name}`
    const dataStart = offset + 512
    const data = buffer.subarray(dataStart, dataStart + size)
    offset = dataStart + Math.ceil(size / 512) * 512
    if (type === 'x') {
      const match = /\d+ path=([^\n]*)\n/.exec(data.toString('utf8'))
      if (match) longName = match[1]
      continue
    }
    if (type === 'L') {
      longName = data.toString('utf8').replace(/\0+$/, '')
      continue
    }
    if (longName) {
      name = longName
      longName = undefined
    }
    if ((type === '0' || type === '\0') && wanted(name)) files.set(name, Buffer.from(data))
  }
  return files
}

// ---------------------------------------------------------------------------
// Normalisation

const RESOURCES = {
  Gold: 'gold',
  Elixir: 'elixir',
  'Dark Elixir': 'dark-elixir',
  'Gold or Elixir': 'gold-or-elixir',
  Gems: 'gems',
  'Season Challenge Points': 'season-challenge-points',
}

/** Bâtiments-réservoirs : ressource de leur champ `capacity` (règle §9.1). */
const STORAGE_RESOURCE = {
  'gold-storage': 'gold',
  'elixir-storage': 'elixir',
  'dark-elixir-storage': 'dark-elixir',
}

/** Dossier du paquet → kind normalisé ; quelques exceptions par slug. */
const KIND_BY_DIR = {
  'town-hall': 'town-hall',
  defenses: 'defense',
  traps: 'trap',
  walls: 'wall',
  'resource-buildings': 'resource-collector',
  'army-buildings': 'army-building',
  other: 'other-building',
  'other/helpers': 'helper',
  guardians: 'guardian',
  'crafted-defenses': 'crafted-defense',
  troops: 'troop',
  spells: 'spell',
  'siege-machines': 'siege-machine',
  heroes: 'hero',
  pets: 'pet',
  'hero-equipment': 'hero-equipment',
}
const KIND_BY_SLUG = {
  'gold-storage': 'storage',
  'elixir-storage': 'storage',
  'dark-elixir-storage': 'storage',
  // Le paquet range le Château de clan dans les ressources ; il ne produit ni ne stocke
  // rien dans les données : on le classe avec les bâtiments d'armée.
  'clan-castle': 'army-building',
  // Range dans « defenses » par le paquet, mais n'a qu'un niveau et ne tire pas :
  // ce sont ses défenses fabriquées (kind crafted-defense) qui s'améliorent.
  'crafting-station': 'other-building',
}

class SkipError extends Error {}

function resource(raw, where) {
  const r = RESOURCES[raw]
  if (!r) throw new SkipError(`ressource inconnue « ${raw} » (${where})`)
  return r
}

function seconds(t, where) {
  if (!t || typeof t !== 'object') throw new SkipError(`durée absente (${where})`)
  const s = (t.days ?? 0) * 86400 + (t.hours ?? 0) * 3600 + (t.minutes ?? 0) * 60 + (t.seconds ?? 0)
  if (!Number.isInteger(s) || s < 0) throw new SkipError(`durée invalide ${JSON.stringify(t)} (${where})`)
  return s
}

/** Carte ressource → montant, sans les montants nuls, clés triées. */
function costMap(pairs) {
  const out = {}
  for (const [res, amount] of pairs.sort(([a], [b]) => a.localeCompare(b))) {
    if (amount == null || amount === 0) continue
    if (!Number.isFinite(amount) || amount < 0) throw new SkipError(`coût invalide ${amount}`)
    out[res] = (out[res] ?? 0) + amount
  }
  return out
}

/** Construit un niveau avec un ordre de clés fixe. */
function makeLevel(fields) {
  const order = [
    'level',
    'cost',
    'time',
    'townHallRequired',
    'labRequired',
    'heroHallRequired',
    'petHouseRequired',
    'blacksmithRequired',
    'storageCapacity',
    'wallRings',
  ]
  const out = {}
  for (const k of order) if (fields[k] !== undefined) out[k] = fields[k]
  return out
}

function buildingLevel(l, where) {
  return makeLevel({
    level: l.level,
    cost: costMap([[resource(l.buildCostResource, where), l.buildCost]]),
    time: seconds(l.buildTime, where),
    townHallRequired: l.townHallRequired,
  })
}

function camel(slug) {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * HDV requis déduit pour un niveau de héros ou d'équipement, que la source ne donne pas :
 * le plus petit HDV dont le bâtiment (Hero Hall, Forge) autorise ce niveau, et au moins
 * l'HDV du niveau de bâtiment exigé par la source (`requiredBuildingLevel`).
 * `null` si aucun niveau de bâtiment connu n'autorise ce niveau.
 */
function derivedTownHall(buildingLevels, capOf, level, requiredBuildingLevel) {
  let best = null
  for (const b of buildingLevels) {
    const cap = capOf(b)
    if (cap != null && cap >= level && (best === null || b.townHallRequired < best)) best = b.townHallRequired
  }
  if (best === null) return null
  const required = buildingLevels.find((b) => b.level === requiredBuildingLevel)
  return required && required.townHallRequired > best ? required.townHallRequired : best
}

function normalize(dir, raw, ctx) {
  const id = raw.id
  const where = `${dir}/${id}`
  if (raw.dataId == null) throw new SkipError('pas de dataId (identifiant du jeu)')
  const kind = KIND_BY_SLUG[id] ?? KIND_BY_DIR[dir]
  if (!kind) throw new SkipError(`dossier non géré « ${dir} »`)
  const entity = { dataId: raw.dataId, id, name: raw.name, kind }

  if (kind === 'hero-equipment') {
    entity.hero = raw.hero
    entity.rarity = String(raw.rarity).toLowerCase()
  }

  if (Array.isArray(raw.availablePerTownHall) && raw.availablePerTownHall.length) {
    entity.perTownHall = raw.availablePerTownHall
      .map((a) => {
        const o = { townHall: a.townHallLevel, count: a.count }
        if (a.countAfterMerges != null) o.countAfterMerges = a.countAfterMerges
        return o
      })
      .sort((a, b) => a.townHall - b.townHall)
  }

  const srcLevels = Array.isArray(raw.levels) ? raw.levels : []
  const main = srcLevels.filter((l) => !l.supercharge)
  const supercharges = srcLevels.filter((l) => l.supercharge)

  switch (kind) {
    case 'town-hall':
      entity.levels = main.map((l) =>
        makeLevel({
          level: l.level,
          cost: costMap([[resource(l.buildCostResource, where), l.buildCost]]),
          time: seconds(l.buildTime, where),
          // Le niveau N de l'HDV est « disponible » quand l'HDV est au niveau N.
          townHallRequired: l.level,
          storageCapacity: l.storageCapacity
            ? costMap([
                ['gold', l.storageCapacity.gold],
                ['elixir', l.storageCapacity.elixir],
                ['dark-elixir', l.storageCapacity.darkElixir],
              ])
            : undefined,
        }),
      )
      entity.weapons = main
        .filter((l) => l.weapon && Array.isArray(l.weapon.levels) && l.weapon.levels.length)
        .map((l) => ({
          townHall: l.level,
          name: l.weapon.name,
          levels: l.weapon.levels.map((w) =>
            makeLevel({
              level: w.level,
              cost: costMap([[resource(w.buildCostResource, where), w.buildCost]]),
              time: seconds(w.buildTime, where),
              townHallRequired: l.level,
            }),
          ),
        }))
      break
    case 'troop':
    case 'spell':
    case 'siege-machine':
      entity.levels = main.map((l) =>
        makeLevel({
          level: l.level,
          cost: costMap([[resource(l.researchCostResource, where), l.researchCost]]),
          time: seconds(l.researchTime, where),
          townHallRequired: l.townHallRequired,
          labRequired: l.laboratoryRequired || undefined,
        }),
      )
      break
    case 'hero': {
      const inconsistent = []
      entity.levels = main.map((l) => {
        const th = derivedTownHall(ctx.heroHall, (h) => h.heroLevelCaps?.[camel(id)], l.level, l.heroHallLevelRequired)
        const hh = ctx.heroHall.find((h) => h.level === l.heroHallLevelRequired)
        const hhCap = hh?.heroLevelCaps?.[camel(id)]
        if (hhCap != null && l.level > hhCap) inconsistent.push({ level: l.level, hh: l.heroHallLevelRequired, cap: hhCap })
        return makeLevel({
          level: l.level,
          cost: costMap([[resource(l.upgradeCostResource, where), l.upgradeCost]]),
          time: seconds(l.upgradeTime, where),
          townHallRequired: th,
          heroHallRequired: l.heroHallLevelRequired,
        })
      })
      if (inconsistent.length) {
        const [first, last] = [inconsistent[0], inconsistent.at(-1)]
        ctx.oddities.push(
          `${id} niv. ${first.level}–${last.level} : heroHallLevelRequired=${first.hh}, or le Hero Hall ${first.hh} plafonne ce héros à ${first.cap}`,
        )
      }
      break
    }
    case 'pet':
      entity.levels = main.map((l) =>
        makeLevel({
          level: l.level,
          cost: costMap([[resource(l.upgradeCostResource, where), l.upgradeCost]]),
          time: seconds(l.upgradeTime, where),
          townHallRequired: l.townHallRequired,
          petHouseRequired: l.petHouseLevelRequired,
        }),
      )
      break
    case 'hero-equipment': {
      entity.levels = main.map((l) =>
        makeLevel({
          level: l.level,
          cost: costMap([
            ['shiny-ore', l.upgradeShinyOre],
            ['glowy-ore', l.upgradeGlowingOre],
            ['starry-ore', l.upgradeStarryOre],
          ]),
          // Pas de durée dans la source (amélioration instantanée en jeu) : champ omis.
          townHallRequired: derivedTownHall(
            ctx.blacksmith,
            (b) => b.maxEquipmentLevel?.[entity.rarity],
            l.level,
            l.blacksmithLevelRequired,
          ),
          blacksmithRequired: l.blacksmithLevelRequired,
        }),
      )
      break
    }
    case 'helper': {
      const res = resource(raw.recruitmentCostResource, where)
      entity.levels = main.map((l) =>
        makeLevel({
          level: l.level,
          // La source ne donne pas la ressource par niveau : celle du recrutement.
          cost: l.upgradeCost ? costMap([[res, l.upgradeCost]]) : {},
          townHallRequired: l.townHallRequired,
        }),
      )
      break
    }
    case 'crafted-defense':
      entity.levels = []
      entity.modules = (raw.modules ?? []).map((m) => ({
        name: m.name,
        levels: m.upgrades.map((u) =>
          makeLevel({
            level: u.level,
            cost: costMap([
              [resource(u.buildCostResource, where), u.buildCost],
              ['sparky-stones', u.sparkyStones],
            ]),
            time: seconds(u.buildTime, where),
          }),
        ),
      }))
      break
    default: {
      // Bâtiments : défenses, pièges, murs, ressources, armée, autres, gardiens.
      const storageRes = STORAGE_RESOURCE[id]
      entity.levels = main.map((l) => {
        const lvl = buildingLevel(l, where)
        if (storageRes && l.capacity != null) lvl.storageCapacity = { [storageRes]: l.capacity }
        if (kind === 'wall' && l.wallRings != null) lvl.wallRings = l.wallRings
        return makeLevel(lvl)
      })
      if (supercharges.length) entity.supercharges = supercharges.map((l) => buildingLevel(l, where))
      if (raw.gearUp) {
        entity.gearUp = {
          cost: costMap([[resource(raw.gearUp.costResource, where), raw.gearUp.cost]]),
          time: seconds(raw.gearUp.time, where),
          requiresLevel: raw.gearUp.requiresLevel,
        }
      }
    }
  }

  if (kind !== 'crafted-defense' && entity.levels.length === 0) throw new SkipError('aucun niveau')
  if (kind === 'hero') {
    const missing = entity.levels.filter((l) => l.townHallRequired === null).map((l) => l.level)
    if (missing.length) {
      ctx.oddities.push(
        `${id} : niveaux ${missing[0]}–${missing.at(-1)} au-delà des plafonds du Hero Hall connus (HDV requis inconnu)`,
      )
    }
  }
  return entity
}

/** Ordre de clés fixe pour une entité. */
function orderEntity(e) {
  const order = ['dataId', 'id', 'name', 'kind', 'hero', 'rarity', 'perTownHall', 'levels', 'supercharges', 'gearUp', 'weapons', 'modules']
  const out = {}
  for (const k of order) if (e[k] !== undefined) out[k] = e[k]
  return out
}

function normalizeMagicItem(dir, raw) {
  const e = raw.effect ?? {}
  const applies = e.appliesTo == null ? [] : Array.isArray(e.appliesTo) ? e.appliesTo : [e.appliesTo]
  const duration =
    e.durationMinutes != null
      ? e.durationMinutes * 60
      : e.durationHours != null
        ? e.durationHours * 3600
        : e.durationDays != null
          ? e.durationDays * 86400
          : undefined
  const effect = { type: e.type }
  if (e.multiplier != null) effect.multiplier = e.multiplier
  if (duration != null) effect.durationSeconds = duration
  const out = { id: raw.id, name: raw.name, type: raw.itemType ?? dir, appliesTo: applies, effect }
  out.maxCapacity = raw.maxCapacity ?? null
  return out
}

// ---------------------------------------------------------------------------
// Sérialisation : lisible pour les diffs (une ligne par niveau), compacte.

function serialize(value, depth = 0, key = '') {
  const pad = '  '.repeat(depth)
  const inner = '  '.repeat(depth + 1)
  if (depth >= 4 || key === 'perTownHall' || value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.every((v) => v === null || typeof v !== 'object')) return JSON.stringify(value)
    return `[\n${value.map((v) => inner + serialize(v, depth + 1)).join(',\n')}\n${pad}]`
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  if (depth >= 3) return JSON.stringify(value)
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${serialize(v, depth + 1, k)}`).join(',\n')}\n${pad}}`
}

// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2))
  let version = args.version
  if (args.latest) version = npm(['view', PACKAGE, 'version']).trim()
  if (!version) version = pinnedVersion()
  if (!version) throw new Error('Aucune version épinglée : utiliser --version <x.y.z> ou --latest')

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-data-'))
  try {
    console.log(`Téléchargement de ${PACKAGE}@${version} (npm pack)…`)
    const packInfo = JSON.parse(npm(['pack', `${PACKAGE}@${version}`, '--json', '--silent'], tmp))[0]
    const times = JSON.parse(npm(['view', `${PACKAGE}@${version}`, 'time', '--json']))
    const publishedAt = typeof times?.[version] === 'string' ? times[version] : null
    const tgz = fs.readFileSync(path.join(tmp, packInfo.filename))
    const tar = zlib.gunzipSync(tgz)
    const files = readTarEntries(
      tar,
      (n) => n === 'package/LICENSE' || n === 'package/package.json' || /^package\/data\/(home|magic-items)\/.+\.json$/.test(n),
    )
    const pkgJson = JSON.parse(files.get('package/package.json').toString('utf8'))
    if (pkgJson.version !== version) throw new Error(`Version inattendue dans le tarball : ${pkgJson.version}`)
    const license = files.get('package/LICENSE')?.toString('utf8')
    if (!license) throw new Error('LICENSE absente du paquet')

    const home = []
    const magic = []
    for (const [name, buf] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
      const m = /^package\/data\/(home|magic-items)\/(.+)\/([^/]+)\.json$/.exec(name)
      if (!m) continue
      const raw = JSON.parse(buf.toString('utf8'))
      ;(m[1] === 'home' ? home : magic).push({ dir: m[2], file: m[3], raw })
    }

    const find = (slug) => home.find((h) => h.raw.id === slug)?.raw
    const ctx = {
      heroHall: find('hero-hall')?.levels ?? [],
      blacksmith: find('blacksmith')?.levels ?? [],
      oddities: [],
    }

    const entities = []
    const skipped = []
    for (const { dir, file, raw } of home) {
      try {
        entities.push(orderEntity(normalize(dir, raw, ctx)))
      } catch (err) {
        if (!(err instanceof SkipError)) throw err
        skipped.push({ where: `${dir}/${file}`, reason: err.message })
      }
    }
    entities.sort((a, b) => a.dataId - b.dataId)

    // Contrôles de cohérence (signalés, jamais corrigés).
    const seenIds = new Map()
    const seenSlugs = new Map()
    for (const e of entities) {
      if (seenIds.has(e.dataId)) throw new Error(`dataId en double : ${e.dataId} (${seenIds.get(e.dataId)}, ${e.id})`)
      if (seenSlugs.has(e.id)) throw new Error(`slug en double : ${e.id}`)
      seenIds.set(e.dataId, e.id)
      seenSlugs.set(e.id, e.dataId)
      const lists = [['levels', e.levels], ['supercharges', e.supercharges ?? []], ...(e.modules ?? []).map((m) => [`module ${m.name}`, m.levels])]
      for (const [label, levels] of lists) {
        levels.forEach((l, i) => {
          if (i > 0 && l.level !== levels[i - 1].level + 1) ctx.oddities.push(`${e.id} ${label} : niveaux non contigus (${levels[i - 1].level} → ${l.level})`)
          const prev = levels[i - 1]
          if (prev && prev.townHallRequired != null && l.townHallRequired != null && l.townHallRequired < prev.townHallRequired) {
            ctx.oddities.push(`${e.id} ${label} niv. ${l.level} : HDV requis ${l.townHallRequired} < niveau précédent (${prev.townHallRequired})`)
          }
        })
      }
    }

    const townHall = entities.find((e) => e.kind === 'town-hall')
    const magicItems = magic.map(({ dir, raw }) => normalizeMagicItem(dir.replace(/s$/, ''), raw)).sort((a, b) => a.id.localeCompare(b.id))

    const dataset = {
      meta: {
        schemaVersion: SCHEMA_VERSION,
        source: {
          package: PACKAGE,
          version,
          license: pkgJson.license ?? 'MIT',
          repository: typeof pkgJson.repository === 'string' ? pkgJson.repository : (pkgJson.repository?.url ?? null),
          integrity: packInfo.integrity ?? null,
          publishedAt,
        },
        maxTownHall: townHall ? townHall.levels.at(-1).level : null,
      },
      entities,
      magicItems,
    }

    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(OUT_FILE, serialize(dataset) + '\n')
    fs.writeFileSync(
      LICENSE_FILE,
      `Les données de src/data/generated/game-data.json sont dérivées du paquet npm\n` +
        `${PACKAGE}@${version} (${dataset.meta.source.repository ?? 'https://github.com/chiefpansancolt/clash-of-clans-data'}),\n` +
        `distribué sous la licence MIT reproduite ci-dessous.\n\n` +
        `Clash of Clans est une marque de Supercell. Ce projet n'est pas affilié à Supercell.\n\n` +
        `----------------------------------------------------------------------\n\n` +
        license.replace(/\r\n/g, '\n').trimEnd() +
        '\n',
    )

    // Résumé
    const byKind = {}
    for (const e of entities) byKind[e.kind] = (byKind[e.kind] ?? 0) + 1
    const size = fs.statSync(OUT_FILE).size
    console.log(`\n${PACKAGE}@${version}${publishedAt ? ` (publié le ${publishedAt})` : ''}`)
    console.log(`Écrit ${path.relative(ROOT, OUT_FILE)} (${(size / 1024).toFixed(1)} Ko), HDV max connu : ${dataset.meta.maxTownHall}`)
    console.log('\nEntités par kind :')
    for (const [k, n] of Object.entries(byKind).sort()) console.log(`  ${k.padEnd(20)} ${n}`)
    console.log(`  ${'TOTAL'.padEnd(20)} ${entities.length}`)
    console.log(`  ${'objets magiques'.padEnd(20)} ${magicItems.length}`)
    console.log(`\nIgnorées (${skipped.length}) :`)
    for (const s of skipped) console.log(`  ${s.where} : ${s.reason}`)
    console.log(`\nBizarreries de la source (${ctx.oddities.length}, non corrigées) :`)
    for (const o of ctx.oddities) console.log(`  ${o}`)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

main()

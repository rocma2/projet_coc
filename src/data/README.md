# Données de jeu

## Origine

`generated/game-data.json` est dérivé du paquet npm [`clash-of-clans-data`](https://github.com/chiefpansancolt/clash-of-clans-data) (licence MIT, données issues du wiki). La version utilisée est épinglée dans `meta.source` du fichier. Seules les données du village principal (`data/home/**`) et les objets magiques (`data/magic-items/**`) sont repris, normalisés et réduits à ce dont le planificateur a besoin : pas de descriptions, statistiques ni images.

Le fichier contient :

- `meta` : paquet source, version, empreinte, date de publication, plus haut HDV décrit (`maxTownHall`) ;
- `entities` : une entrée par élément du jeu, triée par `dataId` (identifiant numérique de l'export), avec son slug `id`, son nom anglais, son `kind` (`town-hall`, `defense`, `trap`, `wall`, `storage`, `resource-collector`, `army-building`, `other-building`, `guardian`, `crafted-defense`, `troop`, `spell`, `siege-machine`, `hero`, `pet`, `hero-equipment`, `helper`), le nombre d'exemplaires par HDV (`perTownHall`) et ses niveaux. Chaque niveau `N` décrit le passage de `N − 1` à `N` : `cost` (ressource → montant), `time` (secondes), `townHallRequired`, et selon le cas `labRequired`, `heroHallRequired`, `petHouseRequired`, `blacksmithRequired`, `storageCapacity`, `wallRings` ;
- `magicItems` : livres, hammers, potions, snacks et utilitaires (type, cible, effet, stock maximal).

Un seul fichier : tout écran qui a besoin des données (import, plan) en a besoin presque en entier, et un seul fichier se compresse mieux. Pour les héros et les équipements, la source ne donne pas l'HDV requis : il est déduit des plafonds du Hero Hall et de la Forge, et vaut `null` quand aucun plafond connu ne couvre le niveau.

## Mise à jour

```sh
npm run data:update                  # régénère avec la version épinglée
npm run data:update -- --latest      # passe à la dernière version publiée
npm run data:update -- --version 0.19.1
```

Le script télécharge le paquet avec `npm pack` dans un dossier temporaire, ne garde rien du paquet brut et écrit un résultat déterministe (relancer sans changer de version ne modifie aucun fichier). Il affiche le nombre d'entités par kind, les entités ignorées et les bizarreries de la source.

Pour vérifier qu'un export est couvert : `npm run data:coverage -- chemin/vers/export.json` (lecture seule, n'affiche jamais le tag).

## Surcharges

`overrides.json` corrige ou complète les données ; les surcharges passent toujours avant (PRD §6.2). Les corrections saisies par le joueur dans l'app utiliseront le même format.

```json
{
  "schemaVersion": 1,
  "entities": [
    {
      "dataId": 1000008,
      "note": "Canon, HDV 19 relevé en jeu",
      "levels": [
        { "level": 21, "time": 129600 },
        { "level": 22, "cost": { "gold": 20000000 }, "time": 1209600, "townHallRequired": 19 }
      ],
      "perTownHall": [{ "townHall": 19, "count": 7 }]
    }
  ]
}
```

- `dataId` : identifiant du jeu. S'il est inconnu des données, `id`, `name` et `kind` sont obligatoires (ajout d'un élément).
- `levels` : un niveau existant est corrigé champ par champ ; un nouveau niveau doit donner `cost`, `townHallRequired` et `time` (sauf équipements et aides). Les niveaux doivent rester contigus.
- `perTownHall` : nombre d'exemplaires par HDV, fusionné par `townHall`.
- `maxLevelByTownHall` : niveau max déclaré pour un HDV (`{ "19": 21 }`), utile quand un élément n'a pas de nouveau niveau.
- `note` : texte libre.

Les valeurs de l'exemple sont fictives : ne jamais inventer de chiffres dans le fichier du repo.

### Valeurs HDV 19 relevées en jeu

Les données s'arrêtent à l'HDV 18. Le contenu actuel de `overrides.json` vient du jeu lui-même, lu le 2026-11-19 dans le menu des constructeurs d'un compte HDV 19, et il est produit par `scripts/build-th19-overrides.mjs` (les valeurs lues y sont écrites en clair) :

- **Prochain niveau** de chaque bâtiment améliorable : coût, ressource et durée, avec `townHallRequired: 19`. Le jeu n'affiche que le niveau suivant : d'autres niveaux HDV 19 peuvent exister.
- **Gold Pass** : le compte l'avait, donc les valeurs affichées sont réduites de 20 %. Le script les divise par 0,8 et refuse tout coût qui ne tombe pas juste. Les durées étant affichées à l'heure près, il retient l'unique durée ronde compatible (multiple de 12 h de préférence) et refuse toute ambiguïté.
- **Bâtiments absents du menu** (et pas en cours d'amélioration) : déjà au max de l'HDV 19, déclaré par `maxLevelByTownHall`.
- **Nouveaux éléments** (Spiky Tower, Firecracker Tower, Squad Barracks, Guardian Shrine) : ajoutés avec leur identifiant de l'export et leur nom lu en jeu.

Restent « à venir » : les niveaux en cours d'amélioration ce jour-là (Spiky Tower, Firecracker Tower niv. 1, Multi-Gear Tower), les héros, troupes, sorts, familiers et équipements HDV 19, et le nombre d'exemplaires par bâtiment à l'HDV 19.

## Règle « à venir »

Un identifiant de l'export absent des données, un niveau manquant ou un HDV que les données ne décrivent pas (aujourd'hui l'HDV 19) donnent un statut `upcoming` explicite au lieu d'une erreur. L'app affiche l'élément « à venir » et l'exclut des calculs.

## Licence

Données sous licence MIT, © Christopher Pezza : texte complet et attribution dans `generated/LICENSE-clash-of-clans-data`. Clash of Clans est une marque de Supercell ; ce projet n'est pas affilié à Supercell.

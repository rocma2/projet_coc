# projet_coc

Optimiseur de progression Clash of Clans : une application web qui dit au joueur **quoi faire maintenant** pour maxer son HDV le plus vite possible, selon ses propres choix. Elle ne se contente pas d'afficher une progression, elle décide : quoi acheter avec les médailles de ligue, où utiliser chaque objet magique, dans quel ordre améliorer, et combien de jours coûte chaque choix personnel. Tout tourne dans le navigateur : l'export du joueur ne quitte jamais l'appareil.

Spécification complète : [docs/PRD.md](docs/PRD.md).

## Prérequis

- Node.js 22 ou plus récent (développé avec Node.js 26) et npm.

## Commandes

```sh
npm install      # installe les dépendances
npm run dev      # serveur de développement (http://localhost:5173/projet_coc/)
npm run build    # vérification des types puis build de production dans dist/
npm run preview  # sert le build de production
npm test         # lance les tests une fois (Vitest)
npm run lint     # ESLint
```

## Organisation

```
src/
  engine/   moteur de simulation : TypeScript pur, sans React ni navigateur (règle ESLint)
  data/     données de jeu (à venir)
  ui/       composants React
  i18n/     traductions français / anglais
  test/     configuration des tests
docs/       PRD et journal des décisions
```

## Mention légale

Projet personnel, non affilié à Supercell, ni approuvé, sponsorisé ou soutenu par Supercell. Clash of Clans est une marque de Supercell.

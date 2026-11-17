# PRD — Optimiseur de progression Clash of Clans

Version 0.1 — 16 novembre 2026
Sources : doc « Prompt – Optimiseur Clash of Clans », interview grill-me (5 tours), export JSON réel du village, captures de la boutique de prestige. Le détail des décisions est dans [decisions.md](decisions.md).

---

## 1. Résumé

Une application web qui dit au joueur **quoi faire maintenant** pour maxer son HDV le plus vite possible, selon ses propres choix. Elle ne se contente pas d'afficher une progression (Clash Ninja le fait déjà) : elle **décide**. Quoi acheter avec les médailles de ligue, où utiliser chaque objet magique, dans quel ordre améliorer, et combien de jours coûte chaque choix personnel.

## 2. Problème

Un joueur de HDV 19 a 6 constructeurs, un labo, des médailles qui plafonnent, des objets magiques en nombre limité et des cooldowns. Les bonnes décisions sont non évidentes :
- un hammer de 120 médailles ne vaut le coup que sur une amélioration de plus de ~9 jours avec 6 constructeurs occupés ;
- attendre trois jours pour mettre un hammer sur une amélioration plus longue peut être plus rentable que l'utiliser maintenant ;
- une potion d'ouvrier est perdue en partie si un constructeur s'arrête pendant la nuit ;
- certaines améliorations sont impossibles tant que les réservoirs ne sont pas montés.

Aujourd'hui le joueur fait ces calculs de tête ou dans des tableurs, et se trompe de plusieurs jours.

## 3. Objectifs

1. Produire un plan jour par jour (affiché par semaine) qui mène aux **défenses maxées** puis, en option, à « tout maxé » le plus tôt possible.
2. Chiffrer en **jours** le coût de chaque choix personnel (profil, héros, murs) et la valeur de chaque source (Gold Pass, médailles, event).
3. Recalculer automatiquement à chaque changement d'état.
4. Rester utilisable seul, sans compte ni serveur, sur téléphone et ordinateur.

### Hors périmètre (V1)
- Compte, synchronisation entre appareils, serveur.
- API officielle Supercell (clé liée à une IP, donc serveur).
- Contenu automatique des passes, coffres, Clan Games, médailles de raid.
- Base des ouvriers et village des clans.
- Le 7ᵉ constructeur (Goblin Builder) : coût en gemmes jugé trop élevé.
- Cosmétiques de la boutique (statues, skins).

## 4. Utilisateur

Le joueur lui-même d'abord (HDV 19, 6 constructeurs, Gold Pass). Le produit est conçu pour qu'un autre joueur puisse l'utiliser plus tard, sans que rien ne soit construit pour cela en V1. Interface en **français et anglais**.

## 5. Concepts

| Terme | Sens |
|---|---|
| Jour-constructeur | Un constructeur occupé pendant un jour. Unité de valeur d'un objet. |
| Défenses maxées | Jalon principal : toutes les défenses au niveau maximum du HDV actuel. |
| Tout maxé | Jalon optionnel : défenses, labo, héros, murs. |
| Éléments importants | Héros, troupes, équipements que le joueur déclare utiles (liste meta par défaut, modifiable). Ils comptent pour le plan ; le reste passe en dernier. |
| Plan de référence | Plan sans aucune source extra (pas de Gold Pass, médailles, event). |
| Plan réel | Plan avec les sources que le joueur a cochées. |
| Profil | Efficace, Équilibré ou Relax : un jeu d'options préréglées. |

## 6. Données d'entrée

### 6.1 Export JSON du jeu (collé ou chargé en fichier)
Source principale. Vérifié sur un export réel (17 nov. 2026, 00:30 UTC).
- Structure : sections `buildings`, `traps`, `units`, `siege_machines`, `heroes`, `equipment`, `spells`, `pets`, `helpers`, `boosts`, `timestamp`, plus la base des ouvriers.
- Chaque élément : identifiant numérique `data`, niveau `lvl`, quantité `cnt`, et `timer` (secondes restantes) s'il est en cours d'amélioration.
- L'export du joueur contient 6 chantiers en cours (5 bâtiments et 1 piège, de 0,2 à 9,8 jours) et 1 sort au labo (3,9 jours). Le nombre de constructeurs n'est pas dans l'export : il est déduit des chantiers et des huttes, puis confirmé par le joueur.
- Les éléments n'ont pas de nom : une **table identifiant → nom** est nécessaire (à construire, voir §14).
- L'export contient le tag du joueur. L'app le traite en local, ne l'envoie à personne.

### 6.2 Données de jeu (coûts, durées, niveaux par HDV)
- Source : paquet open source `clash-of-clans-data` (licence MIT), copié dans le repo avec un script de mise à jour.
- Peut être en retard sur un nouvel HDV et contenir des erreurs (il vient du wiki). Un fichier de **surcharges** saisies par le joueur passe toujours avant.
- Un élément sans donnée est affiché « à venir » et n'entre pas dans les calculs.

### 6.3 Saisies du joueur
| Donnée | Quand |
|---|---|
| Réponses au questionnaire (§7) | Au premier lancement, modifiables |
| Médailles de ligue actuelles | Au départ, puis rappel chaque mois |
| Gain mensuel de médailles (CWL) | Chaque mois |
| Médailles d'event | Rappel chaque semaine |
| Inventaire d'objets magiques (quantité en stock et quantité non réclamée sur le pass) | Modifiable à tout moment |
| Date du dernier achat de chaque hammer | Au départ |
| Gold Pass / Event Pass : oui ou non | Au départ |
| Ligue classée, heures de sommeil et de jeu | Au départ |
| Date cible (HDV suivant), optionnelle | Au départ |

## 7. Questionnaire de départ

1. Style de jeu : rusher actif ou joueur relax.
2. Compo d'attaque principale (ex. hydra, donc dragons en priorité au labo).
3. Héros : tous en même temps, deux à la fois, ou les plus utiles d'abord.
4. Guerres et minerais : accepte-t-il un clan de guerre à minerais pendant l'amélioration des héros.
5. Équipements des héros : presque max ou loin.
6. Bâtiments jugés peu utiles (ex. le DUC).
7. Troupes et sorts qu'il n'utilisera jamais.
8. Gold Pass et Event Pass : oui ou non.
9. Ligue classée : Légende ou non.
10. Nombre de constructeurs (confirmé depuis l'export).
11. Heures de sommeil et de jeu (ex. sommeil 23 h à 6-7 h).

## 8. Fonctionnalités

### F1 — Import et état du village
Coller ou charger l'export, afficher l'état (niveaux, chantiers en cours, boosts), corriger n'importe quelle valeur à la main.

### F2 — Inventaire
Liste des objets magiques de la V1 : **tous les types de livres, tous les hammers, potions d'ouvrier, potions de recherche (labo)**, avec la quantité en stock et la quantité « non réclamée sur le pass ». À chaque ajout ou retrait, le plan est recalculé.

### F3 — Plan de la semaine
Pour chaque jour : quoi lancer, sur quel constructeur, quel hammer acheter et sur quelle amélioration, quels livres et potions utiliser et à quel moment.
Exemple : « Achète le hammer de construction mardi et mets-le sur la plus longue amélioration utile. Garde tes 4 potions pour quand tous tes constructeurs seront occupés. »

### F4 — Coût de chaque choix
Chaque option du joueur affiche son coût en jours par rapport au profil Efficace (« Héros d'abord = +6 jours »). Calculé en comparant deux simulations complètes.

### F5 — Valeur des sources
Plan de référence et plan réel côte à côte. Écart affiché source par source : « Gold Pass : −X jours », « médailles de ligue : −Y jours », etc.

### F6 — Comparaison d'options
Quand deux choix se valent presque, l'app affiche les deux avec gains et coûts. Pour un hammer, elle propose toujours l'alternative chiffrée : « Si tu l'achètes maintenant : +X jours ».

### F7 — Alertes et rappels (dans l'app, à l'ouverture)
- Rappel mensuel : saisir les médailles gagnées.
- Rappel hebdomadaire : saisir les médailles d'event.
- Stockage d'objets plein (un objet reçu en plus est perdu pour le plan).
- Médailles qui approchent du plafond de 2 500 (alerte de sécurité, voir §9).
- Amélioration impossible faute de capacité des réservoirs.
- Un constructeur va rester libre pendant le sommeil.
Pas de notification poussée en V1 (pas de serveur).

### F8 — Profils et options
Trois profils de départ, chaque option reste modifiable :
- **Efficace** : le plus rapide possible, quitte à farmer beaucoup.
- **Équilibré**.
- **Relax** : on attend la fin des améliorations, les ressources deviennent une contrainte.
Options : héros tous d'un coup ou deux à la fois, murs d'abord ou en remplissage, farm d'élixir noir à fond ou limité.

### F9 — Recalcul automatique
Le plan est recalculé à chaque modification de l'état, de l'inventaire ou des réponses. Le calcul tourne dans le navigateur et doit rester quasi instantané.

## 9. Règles de calcul

### 9.1 Contraintes fixes (jamais enfreintes)
- Nouvelles défenses toujours en priorité, juste après l'HDV.
- **Hammers :** 1 achat par semaine **par type** (cooldown de 7 jours séparé pour chaque type), **1 hammer maximum en stock par type**. Un type déjà en stock ne peut pas être racheté avant d'être utilisé.
- **Stockage :** 1 de chaque livre ou rune, 5 potions par type, 25 anneaux de mur. Un objet reçu quand le stockage est plein est perdu pour le plan. Les objets non réclamés sur un pass comptent comme stock caché supplémentaire.
- **Plafond de médailles :** 2 500 ; l'excédent devient des gemmes (~1 gemme pour 10 médailles).
- **Snacks :** à utiliser dans les 24 h.
- **Constructeur libre :** un hammer en demande un pour démarrer, et les murs aussi.
- **Héros en amélioration :** ne peuvent pas attaquer en classé ni en guerre.
- **Niveaux verrouillés par Supercell :** séparés des niveaux disponibles.
- **Chantiers en cours :** fixes. L'app ne les annule jamais ; un hammer peut s'y appliquer si la simulation le juge rentable (rare).
- **Capacité des réservoirs :** certaines améliorations coûtent plus que ce que le joueur peut stocker sans Gold Pass. Elles sont impossibles tant que les réservoirs ne sont pas montés. Les réservoirs passent donc en priorité 1 ou 2 quand ils débloquent des améliorations.

### 9.2 Prix et effets vérifiés
Confirmés par captures de la boutique de prestige le 16 novembre 2026, onglet League :

| Élément | Valeur |
|---|---|
| Potion d'ouvrier | 30 médailles, stock max 5. ×10 pendant 1 h, soit 9 h gagnées par constructeur occupé |
| Potion de recherche | 20 médailles, stock max 5 |
| Potion de ressources | 10 médailles, stock max 5 |
| 2,5 M d'or ou d'élixir | 15 médailles |
| 10 anneaux de mur | 30 médailles, stock max 25 |
| Hammer of Building, Fighting, Spells | 120 médailles, cooldown 7 jours par type, stock max 1 |
| Hammer of Heroes | 165 médailles, cooldown 7 jours, stock max 1 |
| Plafond | 2 500 médailles |
| Gold Pass | −20 % sur le coût et le temps des bâtiments et du labo (catégories exactes à vérifier) |
| Snack constructeur | ×2 pendant 1 h, n'accélère pas l'apprenti |
| Snack labo | ×4 pendant 1 h (~3 h gagnées) |

Les potions d'ouvrier **se cumulent** : plusieurs potions donnent plusieurs heures de boost d'affilée sans attendre la fin de la précédente (par ex. 6 h d'un coup). Le plafond de cumul est à confirmer.

### 9.3 Règles de décision
Unité de valeur : le **jour-constructeur (ou jour-labo) gagné par médaille**, uniquement sur ce qui est utile au joueur.

**Hammers**
- Un hammer de 120 médailles vaut 4 potions d'ouvrier, soit ~9 jours-constructeur avec 6 constructeurs occupés. Il est rentable sur toute amélioration de plus de ~9 jours ; le seuil baisse avec moins de constructeurs.
- Il va sur la **plus longue amélioration utile au joueur**, pas forcément la plus longue.
- Avec le Gold Pass, la valeur est calculée sur la durée déjà réduite.
- **Acheter maintenant ou attendre :** l'app simule les deux, retient le plus rapide, affiche l'autre en alternative chiffrée.
- Astuce : acheter un hammer avant la sortie d'un nouvel HDV et le garder en stock permet d'en racheter un deuxième le jour de la sortie.
- **Hammer of Heroes : pas rentable en médailles** (165 médailles ≈ 12 jours-constructeur de potions, alors qu'une amélioration de héros dure 8 jours maximum). On l'utilise s'il est déjà en stock, on n'en rachète pas.

**Potions d'ouvrier**
- Utilisées seulement quand tous les constructeurs travaillent.
- Cumulables, mais **jamais pendant le sommeil si un constructeur peut s'arrêter** : le temps perdu est pris en compte. L'app lance les longues améliorations avant le sommeil et place les potions dans la fenêtre de jeu du joueur.
- Les livres d'abord, ensuite les potions.

**Médailles de ligue**
- Les médailles de CWL sont dépensées **chaque mois** pour rester efficace : attendre le plafond n'est jamais la bonne stratégie. L'alerte de plafond n'est qu'une sécurité (prévu dans 14 jours, ou à 2 300).
- Réserver à l'avance les médailles des prochains achats : par exemple 240 pour un hammer de construction et un de combat dont le cooldown se termine bientôt.

**Murs**
- Ils demandent un constructeur libre et se placent dans les trous entre deux améliorations.

**Labo** (V2)
- D'abord la compo principale du joueur, puis le meta. Jamais ce que le joueur n'utilisera pas. Score de polyvalence (troupes qui servent dans plusieurs compos), à mettre à jour.

**Héros** (V3)
- Option A : tous d'un coup (ne marche pas en Légende). Option B : deux à la fois (plus lent, plus de minerais). Le coût caché en élixir noir est affiché avant le choix.

**Sortie d'un nouvel HDV**
- L'HDV, puis les nouvelles défenses avec les objets mis de côté, puis labo et château de clan. Mode « max HDV, en attente » : on garde les objets magiques pour le prochain HDV, dans la limite du stockage. Pendant un Hammer Jam (−50 % sur les durées), on garde livres et hammers pour après.

## 10. Moteur de simulation

- **État :** niveaux de tous les éléments, chantiers en cours avec temps restant, inventaire, médailles, cooldowns de hammers, boosts actifs, heures de sommeil et de jeu.
- **Boucle :** avance dans le temps ; dès qu'un constructeur se libère, choisit l'amélioration suivante selon les règles de priorité du profil ; applique les objets et achats selon §9 ; s'arrête quand l'objectif (défenses maxées, tout maxé) est atteint.
- **Sortie :** liste ordonnée des actions datées, date de fin, jours-constructeur inutilisés.
- **Comparaison :** chaque décision à chiffrer est une deuxième simulation avec la variante, et on compare les dates de fin.
- **V1 :** constructeurs, médailles, hammers, potions d'ouvrier, livres de construction, capacité des réservoirs. Les ressources (stock et vitesse de farm) arrivent avec les profils Équilibré et Relax.

## 11. Exigences non fonctionnelles

- **Technologie :** TypeScript, Vite, React ; 100 % dans le navigateur ; stockage local (IndexedDB) ; prêt à devenir une PWA.
- **Hébergement :** site statique (GitHub Pages).
- **Confidentialité :** l'export du joueur ne quitte jamais l'appareil. Aucun envoi réseau de ses données.
- **Langues :** français et anglais (i18n dès la V1) ; les noms du jeu restent ceux des données.
- **Performance :** recalcul perçu comme instantané (moins d'une seconde) sur téléphone.
- **Testabilité :** le moteur est une bibliothèque pure, testée avec des cas chiffrés.
- **Responsive :** utilisable à une main sur téléphone.

## 12. Versions

| Version | Contenu | Critère de réussite |
|---|---|---|
| **V1** | Import JSON, constructeurs, médailles de ligue, hammers, potions d'ouvrier, inventaire (livres, hammers, potions), capacité des réservoirs, plan sur 4 semaines, plan de référence et plan réel, recalcul automatique | Le plan du joueur sur son vrai compte est jugé cohérent ; les 5 cas de test du §13 passent |
| **V2** | Labo (livres de sorts, potions de recherche), score de polyvalence des troupes, aides (apprenti, assistant labo) | Plan du labo cohérent avec la compo |
| **V3** | Héros, calendrier du tournoi classé, options A/B, élixir noir et minerais, ressources complètes, profils Équilibré et Relax | Coût en jours des options A/B affiché |
| **V4** | Gold Pass et Event Pass détaillés, snacks, niveaux verrouillés, Hammer Jam | Valeur du Gold Pass chiffrée en jours |
| **V5** | Sources d'objets et calendrier : nœuds du Gold Pass, coffres, events, Clan Games, médailles de raid ; gemmes ; phase « après le max » (supercharge) | — |

Après chaque version : la tester sur le compte du joueur. Chaque conseil qui ne fait pas de sens révèle une règle manquante à ajouter ici.

## 13. Cas de test (V1)

1. **Seuil du hammer :** 6 constructeurs occupés, hammer de 120 médailles → rentable seulement au-delà de ~9 jours ; avec 4 constructeurs occupés, le seuil baisse.
2. **Hammer of Heroes :** jamais racheté ; utilisé s'il est en stock.
3. **Attendre ou acheter :** hammer disponible, une amélioration de 15 j à lancer maintenant ou une de 16 j (niveau 2 d'un bâtiment dont le niveau 0 finit dans 3 j) → le plan retient le cas le plus rapide et affiche l'autre en alternative chiffrée.
4. **Cooldowns :** à partir des captures du 16 novembre (Building et Fighting rachetables dans 6 j 13 h, Spells achetable maintenant, Heroes en stock) → l'app ne propose pas d'achat avant ces dates et réserve 240 médailles.
5. **Sommeil :** sommeil de 23 h à 7 h → aucune potion lancée si un constructeur peut s'arrêter pendant la nuit ; les longues améliorations démarrent avant le coucher.

Chaque cas est un test automatisé du moteur.

## 14. Risques et questions ouvertes

| Sujet | Risque ou question | Plan |
|---|---|---|
| Table identifiant → nom | Le paquet de données ne documente pas les identifiants du jeu | À vérifier dans le paquet ; sinon table construite à la main à partir de l'export |
| Données du HDV 19 | Peuvent manquer ou être fausses | Surcharges saisies par le joueur ; éléments « à venir » exclus |
| Médailles d'event | Que vendent-elles, à quel prix ? | Le joueur a envoyé les soldes : une monnaie « trophée » (1 586 / 25 000) et une « hexagone bleu » (3 060 / 5 000) sont à identifier ; hors calcul V1 tant que ce n'est pas clair |
| Catégories du −20 % du Gold Pass | Murs, héros, équipements concernés ou non ? | Vérifier sur la page de support Supercell ; table de réductions par catégorie, modifiable |
| Cumul des potions | Plafond de cumul ? | À vérifier en jeu |
| Objets non réclamés en fin de saison | Que deviennent-ils ? | À vérifier en jeu |
| Date du HDV 20 | Environ 12 mois entre deux HDV (non confirmé) | Date cible saisie par le joueur |
| Médailles de CWL | Gain selon la ligue et le bonus du chef | Saisie mensuelle par le joueur |
| Score de polyvalence | Statistiques communautaires ou choix du joueur ? | À trancher en V2 |
| Complexité du moteur | Nombre de combinaisons à simuler | Heuristiques de priorité, pas de solveur en V1 |
| Données Supercell | Droits sur les noms et valeurs | Paquet en licence MIT ; usage personnel ; mention « non affilié » |

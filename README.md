# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- rayons, caisses, murs et portes ;
- construction continue des murs ;
- murs portés par les arêtes et portes traversables ;
- grille de navigation séparée ;
- pathfinding A* respectant les murs dans les deux sens ;
- vérification des collisions pendant le déplacement ;
- plusieurs clients simultanés ;
- arrivées manuelles ou automatiques ;
- cycle client : entrée → rayon → caisse → sortie ;
- choix de la caisse la moins chargée ;
- files d’attente matérialisées près des caisses ;
- encaissement séquentiel ;
- patience limitée et abandon des files trop longues ;
- satisfaction et temps d’attente moyen ;
- stock propre à chaque rayon ;
- compteur de stock actualisé après chaque achat ;
- rupture de stock visible ;
- réapprovisionnement global ;
- trésorerie, chiffre d’affaires, résultat et compteurs clients ;
- coûts de construction réellement débités.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l’adresse indiquée par Vite, généralement `http://localhost:5173`.

## Commandes

| Commande | Action |
|---|---|
| `1` | Sélectionner un rayon |
| `2` | Sélectionner une caisse |
| `3` | Sélectionner un mur |
| `4` | Sélectionner une porte |
| Clic gauche | Placer l’élément ou tracer des murs |
| Clic droit | Supprimer l’élément ou l’arête orientée |
| `R` | Faire pivoter ou changer l’axe |
| `C` | Faire entrer un client |
| `S` | Activer ou couper les arrivées automatiques |
| `A` | Réapprovisionner tous les rayons |
| Molette | Zoomer ou dézoomer |

## Scénario de test

1. Construire au moins un rayon et une caisse.
2. Entourer une zone avec des murs et conserver une ouverture ou une porte.
3. Appuyer sur `C` et vérifier que le client contourne les murs.
4. Ajouter un mur sur son trajet pour vérifier qu’il refuse de le traverser.
5. Générer plusieurs clients et observer les files matérialisées.
6. Vérifier que les compteurs `stock/capacité` diminuent après chaque achat.
7. Observer la satisfaction et le temps d’attente moyen.
8. Appuyer sur `A` pour acheter le stock manquant.

## Architecture

- `GridManager` : occupation des cellules, arêtes et règles de collision ;
- `NavigationGrid` : calcul A* et règles de traversée ;
- `CustomerAgent` : représentation, humeur et déplacement sécurisé d’un client ;
- `StoreSimulation` : stocks, files, patience, satisfaction et économie ;
- `StoreScene` : orchestration, entrées et rendu Phaser.

## Prochaines étapes

1. Ajouter plusieurs catégories de produits et affecter un produit à chaque rayon.
2. Ajouter une horloge, des journées et un bilan de fermeture.
3. Déplacer réellement les clients sur des positions successives dans les files.
4. Ajouter ouverture et fermeture individuelles des caisses.
5. Déplacer le HUD et les outils de gestion vers Vue et Pinia.
6. Ajouter sauvegarde et chargement du magasin.

# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- rayons, caisses, murs et portes ;
- construction continue des murs ;
- murs portés par les arêtes et portes traversables ;
- grille de navigation séparée ;
- pathfinding A* ;
- plusieurs clients simultanés ;
- arrivées manuelles ou automatiques ;
- cycle client : entrée → rayon → caisse → sortie ;
- choix de la caisse la moins chargée ;
- files d’attente et encaissement séquentiel ;
- stock propre à chaque rayon ;
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
2. Vérifier la trésorerie dans le panneau supérieur.
3. Appuyer plusieurs fois sur `C`, ou activer `S`.
4. Observer les clients choisir une caisse et attendre leur tour.
5. Attendre que le stock diminue et qu’un rayon passe en rupture.
6. Appuyer sur `A` pour acheter le stock manquant.
7. Observer l’évolution du chiffre d’affaires et du résultat.

## Architecture

- `GridManager` : occupation des cellules et des arêtes ;
- `NavigationGrid` : calcul A* et règles de traversée ;
- `CustomerAgent` : représentation et déplacement d’un client ;
- `StoreSimulation` : stocks, files de caisse et économie ;
- `StoreScene` : orchestration, entrées et rendu Phaser.

## Prochaines étapes

1. Représenter physiquement les positions dans les files de caisse.
2. Ajouter plusieurs produits et affecter un produit à chaque rayon.
3. Ajouter une horloge, des journées et un bilan de fermeture.
4. Ajouter satisfaction, patience et abandon des files trop longues.
5. Déplacer le HUD et les outils de gestion vers Vue et Pinia.
6. Ajouter sauvegarde et chargement du magasin.

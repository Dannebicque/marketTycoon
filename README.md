# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- pathfinding A* respectant murs et portes ;
- plusieurs clients simultanés avec paniers multi-articles ;
- stocks, files, paiements, satisfaction et bilan journalier ;
- rotation, déplacement et zoom de la caméra ;
- interface Vue superposée à Phaser ;
- équipements et produits entièrement pilotés par des catalogues typés.

## Catalogue des équipements

Les équipements disponibles sont définis dans `src/game/catalog/buildings.ts` :

### Rayons

- rayon standard ;
- fruits et légumes ;
- rayon réfrigéré ;
- congélateur ;
- boulangerie.

Chaque rayon définit sa capacité, ses catégories de produits compatibles, son temps de prise d’article et ses éventuels coûts électriques.

### Caisses

- caisse classique ;
- caisse automatique ;
- caisse express.

Chaque caisse définit sa vitesse, ses paiements acceptés, sa limite éventuelle de panier, son besoin en employé et son risque éventuel d’incident.

### Structure

```text
BuildingDefinition
├── ShelfDefinition
├── CheckoutDefinition
├── WallDefinition
└── DoorDefinition
```

L’union discriminée utilise `category`. La propriété `key` identifie le modèle précis et `renderer` choisit sa représentation dans Phaser.

## Catalogue des produits

Les produits sont définis dans `src/game/catalog/products.ts`.

Ils possèdent notamment :

- une clé unique ;
- une catégorie ;
- un prix de vente ;
- un prix d’achat ;
- une couleur ;
- éventuellement une durée de conservation ;
- éventuellement une contrainte de réfrigération ou de congélation.

Les catégories disponibles sont : épicerie, fruits, légumes, frais, boissons, hygiène, surgelés et boulangerie.

Lorsqu’un rayon est construit, la simulation lui affecte uniquement un produit compatible avec `allowedProductCategories`.

## Économie

- budget initial : **2 000 €** ;
- construction débitée lors de la pose ;
- marchandises débitées lors du réapprovisionnement ;
- chiffre d’affaires ajouté à l’encaissement ;
- électricité des équipements froids débitée à la fermeture ;
- bénéfice journalier :

```text
CA - construction - marchandises - fonctionnement
```

## Interface Vue

La barre de construction est générée automatiquement depuis `BUILDING_CATALOG`. Ajouter une définition au catalogue suffit donc à faire apparaître le nouvel équipement dans l’interface.

Le panneau de gestion affiche :

- pour un rayon : modèle, produit, catégorie, stock, prix, temps de prise et électricité ;
- pour une caisse : modèle, file, état, paiements, limite de panier et besoin en employé.

## Ajouter un équipement

1. Ajouter sa clé dans `BuildingKey` dans `src/game/definitions.ts`.
2. Ajouter sa définition dans `BUILDING_CATALOG`.
3. Utiliser une catégorie existante (`shelf`, `checkout`, `wall`, `door`).
4. Ajouter un renderer spécifique dans `StoreScene` uniquement si son apparence doit être différente.
5. Ajouter les produits compatibles dans `PRODUCT_CATALOG` si nécessaire.

## Lancer le projet

```bash
npm install
npm run dev
```

Validation complète :

```bash
npm run build
```

## Commandes AZERTY

| Commande | Action |
|---|---|
| `1` | Rayon standard |
| `2` | Caisse classique |
| `3` | Mur |
| `4` | Porte |
| Clic gauche | Placer l’équipement |
| Clic droit | Supprimer |
| `R` | Faire pivoter l’équipement |
| `C` | Faire entrer un client |
| `Maj + S` | Arrivées automatiques |
| `Maj + A` | Réapprovisionner |
| `N` | Jour suivant |
| `A` / `E` | Tourner la scène |
| `ZQSD` ou flèches | Déplacer la caméra |
| Bouton central + glisser | Déplacer à la souris |
| Molette | Zoomer ou dézoomer |

## Architecture

- `definitions.ts` : contrats TypeScript des produits et équipements ;
- `catalog/buildings.ts` : source unique des équipements disponibles ;
- `catalog/products.ts` : source unique des produits disponibles ;
- `GridManager` : occupation, collisions et placement ;
- `NavigationGrid` : pathfinding A* ;
- `CustomerAgent` : représentation et déplacement ;
- `StoreSimulation` : stocks, compatibilités, caisses et économie ;
- `StoreScene` : orchestration et registre de rendu ;
- `App.vue` : interface construite depuis les catalogues.

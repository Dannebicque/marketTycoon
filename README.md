# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- pathfinding A* respectant murs et portes ;
- plusieurs clients simultanés avec paniers multi-articles ;
- stocks, files, paiements, satisfaction et bilan journalier ;
- rotation, déplacement et zoom de la caméra ;
- interface Vue superposée à Phaser ;
- équipements et produits chargés automatiquement depuis des définitions typées.

## Architecture des catalogues

Les grandes catégories sont volontairement figées dans `src/game/definitions.ts` :

```text
BuildingCategory = shelf | checkout | wall | door
ProductCategory  = grocery | fruit | vegetable | fresh | drink | hygiene | frozen | bakery
```

Les clés précises des équipements et produits restent extensibles. Chaque objet est défini dans son propre fichier.

```text
src/game/catalog/
├── buildings.ts
├── buildings/
│   ├── shelves/*.building.ts
│   ├── checkouts/*.building.ts
│   └── edges/*.building.ts
├── products.ts
└── products/
    └── <categorie>/*.product.ts
```

`buildings.ts` et `products.ts` utilisent `import.meta.glob(..., { eager: true })` pour découvrir automatiquement les fichiers. Les registres vérifient au démarrage :

- l’unicité des clés ;
- les noms, dimensions, prix et capacités ;
- les catégories autorisées d’un rayon ;
- les moyens de paiement d’une caisse ;
- la cohérence des contraintes de conservation d’un produit.

## Ajouter un équipement

Créer par exemple :

```text
src/game/catalog/buildings/shelves/organicShelf.building.ts
```

```ts
import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'organic-shelf',
  category: 'shelf',
  name: 'Rayon bio',
  description: 'Rayon spécialisé dans les produits biologiques.',
  width: 1,
  height: 3,
  price: 240,
  color: 0x65a30d,
  renderer: 'standard-shelf',
  toolbar: { icon: '🌿', order: 55 },
  capacity: 28,
  allowedProductCategories: ['grocery', 'fruit', 'vegetable'],
  customerPickupTimeMs: 750,
})
```

Aucun import manuel n’est nécessaire. Le nouvel équipement est chargé par Vite et apparaît dans `BUILDINGS`, puis dans la barre Vue. Un changement dans `StoreScene` n’est requis que pour ajouter une apparence `renderer` réellement nouvelle.

## Ajouter un produit

Créer par exemple :

```text
src/game/catalog/products/fruits/pear.product.ts
```

```ts
import { defineProduct } from '../../../definitions'

export default defineProduct({
  key: 'pear',
  category: 'fruit',
  name: 'Poires',
  shortName: 'POIR',
  salePrice: 3.4,
  purchasePrice: 1.5,
  color: 0x84cc16,
  shelfLifeDays: 5,
})
```

Le produit sera automatiquement disponible pour les rayons dont `allowedProductCategories` contient `fruit`.

## Équipements disponibles

### Rayons

- rayon standard ;
- fruits et légumes ;
- rayon réfrigéré ;
- congélateur ;
- boulangerie.

### Caisses

- caisse classique ;
- caisse automatique ;
- caisse express.

Chaque définition porte ses caractéristiques de gameplay : capacité, compatibilités, électricité, temps de prise, vitesse de scan, paiements, limite de panier et incidents.

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

## Composants principaux

- `definitions.ts` : contrats et grandes catégories TypeScript ;
- `catalog/buildings.ts` : autoload, validation et registre des équipements ;
- `catalog/products.ts` : autoload, validation et registre des produits ;
- `GridManager` : occupation, collisions et placement ;
- `NavigationGrid` : pathfinding A* ;
- `CustomerAgent` : représentation et déplacement ;
- `StoreSimulation` : stocks, compatibilités, caisses et économie ;
- `StoreScene` : orchestration et registre de rendu ;
- `App.vue` : interface construite depuis les catalogues.

# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Fonctionnalités

- grille logique 16 × 16 avec projection isométrique ;
- pathfinding A* respectant murs et portes ;
- plusieurs clients simultanés avec paniers multi-articles ;
- stocks, files, paiements, satisfaction et bilan journalier ;
- équipements composés d’emplacements configurables ;
- capacité de rangement propre à chaque produit ;
- interface Vue superposée à Phaser ;
- équipements et produits chargés automatiquement depuis des définitions typées.

## Architecture des catalogues

Les grandes catégories sont volontairement figées dans `src/game/definitions.ts` :

```text
BuildingCategory  = shelf | checkout | wall | door
ProductCategory   = grocery | fruit | vegetable | fresh | drink | hygiene | frozen | bakery
CompartmentType   = standard-shelf | fruit-bin | refrigerated-shelf | freezer-shelf | bakery-display
```

Les clés précises restent extensibles. Chaque équipement et chaque produit est défini dans son propre fichier, chargé avec `import.meta.glob(..., { eager: true })`.

```text
src/game/
├── definitions.ts
├── equipment/
│   └── EquipmentInventory.ts
└── catalog/
    ├── buildings.ts
    ├── buildings/
    │   ├── shelves/*.building.ts
    │   ├── checkouts/*.building.ts
    │   └── edges/*.building.ts
    ├── products.ts
    └── products/<categorie>/*.product.ts
```

## Structure interne des équipements

Un rayon ne possède plus une capacité globale. Il déclare une grille interne :

```ts
layout: {
  columns: 3,
  levels: 4,
  compartmentType: 'standard-shelf',
}
```

Cet exemple génère automatiquement douze emplacements :

```text
3 colonnes × 4 étagères = 12 emplacements
```

Chaque emplacement peut contenir une seule référence de produit. Deux emplacements différents du même meuble peuvent recevoir des produits différents.

L’état réel est stocké par équipement placé :

```ts
interface EquipmentCompartmentState {
  id: string
  column: number
  level: number
  productKey: string | null
  quantity: number
  capacity: number
}
```

## Capacité propre aux produits

La capacité est déclarée dans le fichier du produit pour chaque type d’emplacement compatible :

```ts
export default defineProduct({
  key: 'pasta',
  category: 'grocery',
  name: 'Pâtes',
  shortName: 'PÂTES',
  salePrice: 3.5,
  purchasePrice: 1.4,
  color: 0xd6a75f,
  capacities: {
    'standard-shelf': 30,
  },
})
```

Un produit volumineux peut avoir une capacité plus faible :

```ts
capacities: {
  'standard-shelf': 6,
}
```

Une capacité absente ou égale à zéro rend le produit incompatible avec ce type d’emplacement.

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
  layout: {
    columns: 3,
    levels: 4,
    compartmentType: 'standard-shelf',
  },
  allowedProductCategories: ['grocery', 'fruit', 'vegetable'],
  customerPickupTimeMs: 750,
})
```

Aucun import manuel n’est nécessaire. Un changement dans `StoreScene` n’est requis que pour une apparence réellement nouvelle.

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
  capacities: {
    'fruit-bin': 34,
  },
})
```

Le produit sera proposé uniquement dans les équipements compatibles avec sa catégorie, ses contraintes de froid et son type d’emplacement.

## Configurer un équipement

1. Placer un rayon dans la scène.
2. Cliquer sur le rayon existant.
3. Le panneau Vue affiche ses colonnes et ses étagères.
4. Choisir un produit pour chaque emplacement.
5. Réapprovisionner un emplacement ou le meuble entier.

Le changement de produit vide volontairement l’emplacement. Il faut ensuite le réapprovisionner, ce qui débite le coût d’achat des marchandises.

Les clients choisissent maintenant un emplacement précis et consomment son stock propre.

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
| Clic gauche sur une case vide | Placer l’équipement sélectionné |
| Clic gauche sur un équipement | Sélectionner et configurer |
| Clic droit | Supprimer |
| `R` | Faire pivoter l’équipement |
| `C` | Faire entrer un client |
| `Maj + S` | Arrivées automatiques |
| `Maj + A` | Réapprovisionner tous les emplacements |
| `N` | Jour suivant |
| `A` / `E` | Tourner la scène |
| `ZQSD` ou flèches | Déplacer la caméra |
| Bouton central + glisser | Déplacer à la souris |
| Molette | Zoomer ou dézoomer |

## Composants principaux

- `definitions.ts` : contrats, catégories et types d’emplacements ;
- `equipment/EquipmentInventory.ts` : génération des emplacements, capacités et compatibilité ;
- `catalog/buildings.ts` : autoload et validation des équipements ;
- `catalog/products.ts` : autoload et validation des produits ;
- `GridManager` : occupation, collisions et placement ;
- `NavigationGrid` : pathfinding A* ;
- `CustomerAgent` : représentation et déplacement ;
- `StoreSimulation` : inventaires, consommation, réapprovisionnement et économie ;
- `StoreScene` : sélection, orchestration et rendu ;
- `App.vue` : configurateur des équipements.

# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Boucle logistique

Le magasin utilise désormais une vraie chaîne d’approvisionnement :

```text
Construire une réserve compatible
→ passer une commande fournisseur
→ attendre le jour de livraison
→ réceptionner dans la réserve
→ remplir les rayons depuis la réserve
→ vendre
→ recommander
```

Un rayon ne peut plus être rempli directement avec de l’argent. Les produits doivent exister physiquement dans la réserve.

## Types de réserve

Trois types de stockage sont disponibles :

```text
ambient  → épicerie, boissons, hygiène, fruits, légumes, boulangerie
cold     → produits réfrigérés
frozen   → produits surgelés
```

Équipements fournis :

- étagère de réserve ambiante : 180 unités ;
- réserve froide : 240 unités ;
- réserve surgelée : 200 unités.

Les capacités de plusieurs équipements du même type s’additionnent.

Sans zone compatible, la capacité vaut zéro et une livraison de ce type est refusée. Une livraison peut aussi être partielle si la place restante est insuffisante.

## Fournisseurs

Le catalogue `src/game/catalog/suppliers.ts` contient actuellement :

- `Metro Market` : catalogue complet, livraison J+1 ;
- `Eco Wholesale` : moins cher, sans surgelés, livraison J+2 ;
- `Fresh Logistics` : spécialisé dans le froid, livraison J+1.

Chaque fournisseur définit :

```ts
interface SupplierDefinition {
  key: string
  name: string
  leadTimeDays: number
  deliveryFee: number
  minimumOrderAmount: number
  priceMultiplier: number
  productKeys: string[]
}
```

## Commandes

Une commande fournisseur contient :

```ts
interface PurchaseOrder {
  id: string
  supplierKey: string
  orderedDay: number
  expectedDay: number
  status: 'ordered' | 'delivered' | 'partially-delivered' | 'cancelled'
  lines: PurchaseOrderLine[]
  deliveryFee: number
  orderedTotal: number
  deliveredTotal: number
  rejectedLines: PurchaseOrderLine[]
}
```

Le montant est débité lors de la commande. La livraison est traitée lorsque le jour attendu est atteint.

## Réserve et réassort

Le stock est séparé en deux parties :

```text
stock de réserve
stock présent dans les rayons
```

Le réassort transfère les quantités disponibles :

```text
Réserve : 100 pâtes
Étagère : 12 / 30

Remplir
→ Réserve : 82
→ Étagère : 30 / 30
```

Trois opérations existent :

```ts
restockCompartment(buildingId, compartmentId)
restockEquipment(buildingId)
restockAll()
```

Lorsqu’un produit est retiré d’un emplacement, son stock restant retourne dans la réserve si une capacité compatible est disponible.

## Équipements configurables

Un rayon déclare une grille interne :

```ts
layout: {
  columns: 3,
  levels: 4,
  compartmentType: 'standard-shelf',
}
```

Chaque emplacement contient une seule référence. La capacité dépend du produit et du type d’emplacement :

```ts
capacities: {
  'standard-shelf': 30,
}
```

## Architecture

```text
src/game/
├── definitions.ts
├── equipment/
│   └── EquipmentInventory.ts
├── logistics/
│   ├── ReserveManager.ts
│   └── PurchaseOrderManager.ts
├── catalog/
│   ├── buildings.ts
│   ├── buildings/
│   │   ├── shelves/
│   │   ├── storage/
│   │   ├── checkouts/
│   │   └── edges/
│   ├── products.ts
│   ├── products/
│   └── suppliers.ts
├── StoreSimulation.ts
├── StoreScene.ts
└── GridManager.ts
```

## Interface

Le panneau latéral comporte trois onglets :

- **Équipement** : configuration des rayons, caisses et réserves ;
- **Réserve** : capacités ambiante, froide et surgelée, ainsi que les quantités stockées ;
- **Commandes** : fournisseur, produit, quantité, date attendue et historique.

## Économie

- budget initial : **2 000 €** ;
- construction débitée lors de la pose ;
- commandes et frais de livraison débités à la validation ;
- chiffre d’affaires ajouté à l’encaissement ;
- électricité des rayons froids et réserves froides débitée à la fermeture.

```text
Bénéfice = CA - construction - commandes - fonctionnement
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

## Scénario de test

1. Construire une étagère de réserve ambiante.
2. Construire un rayon standard et une caisse.
3. Affecter des pâtes à une étagère du rayon.
4. Passer une commande de pâtes supérieure au minimum fournisseur.
5. Passer au jour de livraison.
6. Vérifier l’arrivée des produits dans la réserve.
7. Remplir l’étagère depuis la réserve.
8. Générer des clients et vérifier la diminution du stock en rayon.
9. Tester une commande froide sans réserve froide : les unités doivent être refusées.
10. Construire une réserve froide et recommencer.

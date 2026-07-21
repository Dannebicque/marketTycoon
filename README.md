# Market Tycoon

Prototype de jeu de gestion de magasin en vue isométrique avec Vue 3, TypeScript et Phaser 3.

## Boucle de jeu actuelle

```text
Construire une réserve compatible
→ commander chez un fournisseur
→ attendre la livraison
→ stocker les marchandises
→ configurer les rayons
→ transférer le stock vers les rayons
→ accueillir les clients
→ suivre les résultats dans le menu Gestion
```

## Menu Gestion

Le bouton **Gestion** du HUD ouvre une fenêtre centrale indépendante de la scène Phaser.

Elle contient quatre sections :

- **Tableau de bord** : trésorerie, chiffre d’affaires, résultat, clients, stocks et alertes ;
- **Finances** : construction, achats de marchandises, électricité, charges et résultat ;
- **Réserve** : capacités ambiante, froide et surgelée, occupation et stock par produit ;
- **Commandes** : caractéristiques du fournisseur, produits disponibles, estimation complète et historique.

Le panneau latéral de la scène reste réservé à la configuration de l’équipement sélectionné.

## Validation des commandes

Le formulaire affiche avant validation :

- le délai de livraison ;
- le minimum de marchandises imposé par le fournisseur ;
- les frais de livraison ;
- le coût des marchandises ;
- le total réel débité ;
- les produits effectivement vendus par le fournisseur ;
- la capacité de réserve compatible encore libre.

Le bouton est désactivé tant qu’une règle n’est pas satisfaite. Chaque problème est affiché séparément.

Exemples :

```text
Minimum fournisseur non atteint : il manque 42 € de marchandises.
Budget insuffisant : il manque 120 €.
Aucune réserve froide n’est construite.
Capacité insuffisante : seulement 18 unités peuvent être réceptionnées.
Ce produit n’est pas proposé par le fournisseur sélectionné.
```

La sélection des produits est filtrée selon le catalogue du fournisseur. Le joueur ne peut donc plus sélectionner volontairement une référence indisponible chez lui.

## Équipements

Les grandes catégories sont figées :

```text
BuildingCategory = shelf | checkout | storage | wall | door
StorageType       = ambient | cold | frozen
```

Les rayons possèdent une grille d’emplacements configurables. Chaque emplacement contient au maximum une référence de produit.

```ts
layout: {
  columns: 3,
  levels: 4,
  compartmentType: 'standard-shelf',
}
```

## Capacité des produits

Chaque produit définit une capacité fixe par type d’emplacement :

```ts
capacities: {
  'standard-shelf': 30,
}
```

La capacité de réserve est exprimée en unités et dépend des équipements de stockage construits.

## Réserve

Équipements disponibles :

- étagère de réserve ambiante ;
- réserve froide ;
- réserve surgelée.

Sans zone compatible, un produit ne peut pas être réceptionné ni conservé en réserve.

Le réassort ne crée plus de marchandises et ne débite plus directement le budget : il transfère les unités de la réserve vers les rayons.

## Fournisseurs

Trois fournisseurs sont actuellement définis :

- **Metro Market** : généraliste, livraison rapide ;
- **Eco Wholesale** : moins cher, délai plus long, sans surgelés ;
- **Fresh Logistics** : spécialisé dans le frais et le surgelé.

Chaque fournisseur possède :

- un catalogue de produits ;
- un coefficient de prix ;
- un minimum de commande ;
- des frais de livraison ;
- un délai de livraison.

## Architecture principale

```text
src/game/
├── definitions.ts
├── equipment/
│   └── EquipmentInventory.ts
├── logistics/
│   ├── ReserveManager.ts
│   └── PurchaseOrderManager.ts
├── catalog/
│   ├── buildings/
│   ├── products/
│   └── suppliers.ts
├── StoreSimulation.ts
└── StoreScene.ts
```

## Contrôles

| Commande | Action |
|---|---|
| Clic gauche sur une case vide | Construire |
| Clic gauche sur un équipement | Sélectionner et configurer |
| Clic droit | Supprimer |
| `R` | Faire pivoter l’équipement |
| `C` | Faire entrer un client |
| `Maj + S` | Activer les arrivées automatiques |
| `Maj + A` | Réassort global depuis la réserve |
| `N` | Jour suivant |
| `A` / `E` | Tourner la scène |
| `ZQSD` ou flèches | Déplacer la caméra |
| Molette | Zoomer ou dézoomer |

## Validation locale

```bash
npm install
npm run build
```

Scénario recommandé :

1. construire une réserve ambiante, un rayon et une caisse ;
2. ouvrir **Gestion → Commandes** ;
3. observer le minimum, les frais et le total avant validation ;
4. tester une quantité trop faible et vérifier le montant manquant ;
5. commander des pâtes ;
6. passer au jour de livraison ;
7. vérifier le stock dans **Gestion → Réserve** ;
8. remplir le rayon ;
9. accueillir des clients ;
10. suivre les charges et le résultat dans **Gestion → Finances**.

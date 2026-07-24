# Market Tycoon

Market Tycoon est un prototype de jeu de gestion de magasin en vue isométrique, développé avec Vue 3, TypeScript et Phaser 3.

Le projet vise une simulation extensible dans laquelle le joueur construit son magasin, gère ses fournisseurs, ses stocks, ses prix et ses employés, puis arbitre entre satisfaction client et rentabilité.

## État du projet

La boucle de jeu actuelle couvre :

```text
Construire
→ commander
→ réceptionner
→ stocker
→ approvisionner
→ vendre
→ payer les charges et les salariés
→ piloter les prix et les marges
→ sauvegarder
```

Fonctionnalités principales :

- grille isométrique et équipements configurables ;
- catalogues extensibles de produits, bâtiments et métiers ;
- réserves ambiante, froide et surgelée ;
- fournisseurs et commandes multi-produits ;
- livraisons et réassort réel ;
- clients, paniers et files de caisse ;
- caissiers, employés de rayon et techniciens visibles ;
- salaires et charges journalières ;
- prix de vente personnalisés et indicateurs de marge ;
- sauvegarde locale versionnée.

## Démarrage

Prérequis : Node.js 22 ou une version LTS récente.

```bash
npm install
npm run dev
```

Vérification complète :

```bash
npm run check
```

Commandes disponibles :

| Commande | Usage |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Vérification TypeScript et Vue |
| `npm run build` | Typecheck puis build Vite |
| `npm run check` | Contrôle complet du projet |
| `npm run preview` | Prévisualisation du build |

## Menu Gestion

Le menu central contient :

- **Tableau de bord** : trésorerie, chiffre d’affaires, résultat et alertes ;
- **Finances** : charges, achats, salaires et résultat ;
- **Réserve** : capacités et stocks par produit ;
- **Prix & marges** : tarifs, marge unitaire, taux de marge et taux de marque ;
- **Employés** : recrutement, qualité, salaire, affectations et tâches ;
- **Commandes** : panier fournisseur, validation et historique.

## Contrôles

| Commande | Action |
|---|---|
| Clic gauche sur une case vide | Construire |
| Clic gauche sur un équipement | Sélectionner et configurer |
| Clic droit | Supprimer |
| `R` | Faire pivoter l’équipement |
| `C` | Faire entrer un client |
| `Maj + S` | Activer les arrivées automatiques |
| `Maj + A` | Demander un réassort |
| `N` | Jour suivant |
| `A` / `E` | Tourner la scène |
| `ZQSD` ou flèches | Déplacer la caméra |
| Molette | Zoomer ou dézoomer |

## Architecture

```text
src/
├── components/          # interface Vue
├── composables/         # logique d’interface réutilisable
└── game/
    ├── catalog/         # définitions extensibles
    ├── commerce/        # demande et décisions commerciales
    ├── employees/       # gestion et agents employés
    ├── equipment/       # inventaires des équipements
    ├── events/          # événements métier typés
    ├── logistics/       # réserve et commandes
    ├── pricing/         # prix et marges
    ├── save/            # sauvegarde versionnée
    ├── StoreSimulation.ts
    └── StoreScene.ts
```

Documentation complémentaire :

- [Feuille de route](ROADMAP.md)
- [Architecture détaillée](docs/ARCHITECTURE.md)
- [Guide de contribution](CONTRIBUTING.md)

## Principes techniques

- Les règles métier sont placées dans des managers testables.
- Les éléments extensibles proviennent de catalogues validés.
- Vue orchestre l’interface et Phaser gère le rendu et les agents.
- Les événements métier permettent de découpler statistiques, objectifs et simulation.
- Les sauvegardes utilisent des données sérialisables et des clés de catalogue stables.
- Le mode TypeScript strict reste activé.

## Prochaine étape

La version v0.4 introduit l’intelligence commerciale :

1. sensibilité des clients aux prix ;
2. coût moyen pondéré du stock ;
3. statistiques par produit ;
4. promotions ;
5. écran d’analyse commerciale.

Le premier socle est déjà présent avec un bus d’événements métier typé et un service de décision d’achat selon l’écart au prix du marché.

## Statut

Le projet est en développement actif. La pull request principale reste en brouillon tant que la boucle économique et les contrôles automatisés ne sont pas stabilisés.

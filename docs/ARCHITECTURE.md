# Architecture de Market Tycoon

## Vue d’ensemble

Market Tycoon est une application Vue 3 qui embarque une simulation Phaser 3. Le projet sépare l’interface de gestion, le moteur visuel, les règles métier et les catalogues de contenu.

```text
Vue 3
├── HUD et panneaux
├── formulaires de gestion
└── orchestration de la partie

Phaser 3
├── scène isométrique
├── agents clients
├── agents employés
├── déplacements
└── rendu des équipements

Domaine
├── StoreSimulation
├── managers métier
├── événements métier
├── catalogues
└── sauvegarde
```

## Responsabilités

### `src/App.vue`

Point de composition de l’application. Il relie Vue, Phaser et les managers. Il ne doit pas devenir le lieu d’implémentation des règles métier. Toute règle durable doit être déplacée vers un service ou un manager.

### `src/game/StoreScene.ts`

Responsable de la scène Phaser :

- rendu de la grille et des équipements ;
- contrôles caméra et construction ;
- cycle visuel des clients ;
- affichage des files et états ;
- synchronisation des agents.

La scène demande au domaine d’effectuer les opérations, mais ne calcule pas directement la comptabilité.

### `src/game/StoreSimulation.ts`

Façade principale du domaine. Elle coordonne actuellement :

- inventaires des rayons ;
- réserve ;
- commandes ;
- paniers et ventes ;
- finances et indicateurs journaliers.

À mesure que le projet grandit, ses responsabilités doivent être extraites vers des managers spécialisés.

### Managers métier

Les managers portent un état cohérent et des opérations testables :

```text
ReserveManager
PurchaseOrderManager
EmployeeManager
StorePricingManager
EmployeeRuntime
```

Les prochaines briques prévues sont :

```text
MarketDemandManager
InventoryValuationManager
ProductPerformanceManager
MaintenanceManager
ObjectiveManager
```

### Catalogues

Les catalogues décrivent le contenu extensible du jeu : produits, équipements, employés puis profils clients et événements.

Un catalogue doit :

- charger les modules déclaratifs ;
- vérifier les champs obligatoires ;
- refuser les clés dupliquées ;
- fournir un registre en lecture seule ;
- échouer tôt avec un message explicite.

### Événements métier

Les systèmes ne doivent pas se connaître directement pour chaque interaction. Le bus d’événements diffuse les faits importants :

```text
product:sold
product:rejected-for-price
stock:received
stock:out
employee:task-completed
checkout:breakdown
store:day-closed
```

Les statistiques, objectifs, succès et événements futurs pourront écouter ces faits sans modifier les producteurs.

### Sauvegarde

Le format de sauvegarde est versionné. Les données persistantes doivent être des objets sérialisables, indépendants des instances Phaser et des classes runtime.

Règles :

- ne jamais sauvegarder de références de scène ;
- sauvegarder les clés de catalogue plutôt que les définitions complètes ;
- prévoir les champs nouveaux comme optionnels tant qu’une migration n’existe pas ;
- reconstruire les identifiants runtime au chargement ;
- ajouter une migration lors d’une rupture de format.

## Flux principaux

### Vente

```text
ClientAgent
→ sélection d’un produit
→ décision d’achat
→ StoreSimulation.takeItems
→ passage en caisse
→ StoreSimulation.finishCheckout
→ événement product:sold
→ statistiques et objectifs
```

### Commande et réception

```text
PurchaseOrdersPanel
→ PurchaseOrderManager.createOrder
→ débit de trésorerie
→ attente du jour de livraison
→ ReserveManager.add
→ valorisation du stock
→ événement stock:received
```

### Travail d’un employé

```text
EmployeeRuntime
→ recherche d’une tâche
→ déplacement de EmployeeAgent
→ opération métier
→ EmployeeManager.completeTask
→ événement employee:task-completed
```

## Règles de dépendances

- `components` peut dépendre des types et services du domaine.
- `game` ne dépend jamais des composants Vue.
- les catalogues ne dépendent pas de la scène Phaser.
- les managers ne manipulent pas d’objets graphiques.
- les événements utilisent des données simples et immuables.
- les composants n’écrivent pas directement dans les collections internes des managers.

## Dette technique identifiée

- `App.vue` concentre encore trop d’orchestration.
- `StoreSimulation` doit être progressivement découpé.
- plusieurs vues utilisent encore `any`.
- les catalogues ont des validations dispersées.
- le projet ne possède pas encore de suite de tests automatisés.
- les politiques employés sont branchées par remplacement de méthodes runtime ; elles devront devenir des dépendances explicites.

## Cible progressive

```text
src/
├── app/                 # composition Vue et adaptateurs
├── components/          # présentation
├── game/
│   ├── catalog/         # contenu déclaratif
│   ├── domain/          # règles et agrégats
│   ├── events/          # événements typés
│   ├── runtime/         # agents Phaser
│   ├── save/            # formats et migrations
│   └── ui-models/       # DTO destinés à Vue
└── tests/
```

Cette cible sera atteinte par extractions successives, sans réécriture complète.

## Frontières des packages

- `apps/game` contient Vue, Phaser, les agents visuels et les adaptateurs navigateur.
- `packages/employees` contient l’état, le recrutement, l’affectation et les règles métier des employés.
- `packages/save` contient le format versionné, la sérialisation et l’analyse des sauvegardes.
- `apps/game/src/infrastructure/LocalStorageSaveRepository.ts` est l’adaptateur navigateur de persistance.
- aucun package ne peut importer `apps/*` ni sortir de son propre dossier par un chemin relatif.
- `npm run architecture:check` vérifie ces frontières en CI.

# Roadmap Market Tycoon

Cette feuille de route organise l’évolution du prototype vers un véritable jeu de gestion. Chaque version doit rester jouable, testable et compatible avec les sauvegardes existantes.

## Vision

Market Tycoon doit devenir à la fois :

- un jeu de gestion complet et rejouable ;
- un moteur de simulation indépendant du rendu ;
- une application pilotée par des catalogues déclaratifs ;
- un système dont chaque décision importante est mesurable ;
- une base capable d’exécuter des simulations accélérées sans Vue ni Phaser.

## Principes directeurs

- Les systèmes métier sont isolés dans des packages dédiés.
- Le moteur ne dépend jamais de Vue ou Phaser.
- Vue et Phaser sont des adaptateurs de présentation et d’interaction.
- Les éléments extensibles sont déclarés dans des catalogues validés.
- Les interactions importantes émettent des événements métier typés.
- Les sauvegardes sont versionnées et migrables.
- Toutes les chaînes visibles passent par l’i18n.
- Toute nouvelle mécanique produit des indicateurs exploitables par le joueur.

## Architecture cible

```text
apps/
  game/                    # Vue, Phaser, HUD, panneaux, entrées, animations

packages/
  simulation-engine/       # boucle, temps, grille, navigation, état global
  economy/                 # prix, demande, stock, fournisseurs, promotions
  customers/               # profils, satisfaction, fidélité, comportements
  employees/               # RH, compétences, tâches, hiérarchie
  analytics/               # observations, KPI, diagnostics, historique
  events/                  # bus d’événements métier
  catalog/                 # produits, bâtiments, fournisseurs, scénarios
  save/                    # format, migrations, persistance
  i18n/                    # locales et outils de traduction
  ui-shared/               # composants réutilisables
```

### Migration d’architecture

- [x] Transformer le dépôt en workspace `apps/*` + `packages/*`
- [x] Créer les premières API publiques de packages
- [x] Configurer les alias TypeScript et Vite
- [ ] Faire consommer tous les imports métier via `@market-tycoon/*`
- [ ] Déplacer physiquement les implémentations hors de `src/game`
- [ ] Déplacer l’application Vue/Phaser dans `apps/game`
- [ ] Ajouter des règles de dépendances entre packages
- [ ] Supprimer les façades temporaires une fois la migration terminée

## État actuel — v0.3

- [x] Construction isométrique et navigation
- [x] Catalogues de produits et d’équipements
- [x] Réserve ambiante, froide et surgelée
- [x] Fournisseurs et commandes multi-produits
- [x] Livraisons et réassort réel
- [x] Clients et files de caisse
- [x] Employés extensibles
- [x] Caissiers, employés de rayon et techniciens visibles
- [x] Salaires et charges journalières
- [x] Prix de vente personnalisés et marges
- [x] Sauvegarde locale versionnée
- [x] Base multilingue avec Vue I18n et pont Phaser

## v0.4 — Intelligence commerciale

### Sensibilité des clients aux prix

- [x] Prix de marché et sensibilité par produit
- [x] Décisions accepter, réduire ou refuser
- [x] Intégration dans le retrait réel du stock
- [x] Quantités et chiffre d’affaires potentiel perdus
- [x] Écran de suivi commercial par produit et période
- [x] Diagnostics tarifaires
- [ ] Sensibilité et budget stables pendant toute la visite
- [ ] Satisfaction finale détaillée selon l’écart au marché
- [ ] Produits de substitution
- [ ] Élasticité configurable par profil client

### Coût réel du stock

- [ ] Valeur du stock et coût moyen pondéré
- [ ] Prix fournisseur réellement payé
- [ ] Répartition des frais de livraison
- [ ] Coût des marchandises vendues
- [ ] Marge brute réelle par vente et produit

### Promotions

- [ ] Promotions temporaires
- [ ] Prix barrés et durée
- [ ] Lots, deuxième produit remisé, produit d’appel
- [ ] Impact sur demande, fréquentation et satisfaction
- [ ] Mesure de rentabilité de chaque promotion

### Fournisseurs évolutifs

- [ ] Qualité, prix, délai, fiabilité et minimum de commande
- [ ] Promotions fournisseurs
- [ ] Retards, grèves, ruptures et hausses tarifaires
- [ ] Négociation et niveaux de relation

### Comptabilité simplifiée

- [ ] Résultat journalier et mensuel
- [ ] Trésorerie et besoins de financement
- [ ] Immobilisations et amortissements
- [ ] Charges fixes, variables et exceptionnelles
- [ ] Inflation et évolution des coûts

## v0.5 — Clients et vie du magasin

### Profils clients

- [ ] Catalogue extensible de profils
- [ ] Âge, budget, temps disponible, exigence et fidélité
- [ ] Préférences de catégories et habitudes
- [ ] Profils budget, réguliers, premium, familles et pressés

### Comportements

- [ ] Comparer, hésiter et rechercher
- [ ] Se perdre, changer de produit et faire demi-tour
- [ ] Attendre ou quitter la file
- [ ] Revenir plus tard selon l’expérience passée

### Satisfaction détaillée

- [ ] Prix
- [ ] Temps d’attente
- [ ] Disponibilité et choix
- [ ] Fluidité du parcours
- [ ] Propreté, ambiance et personnel

### Fidélité

- [ ] Occasionnels, habitués et premium
- [ ] Historique individuel ou agrégé
- [ ] Probabilité de retour
- [ ] Réputation et bouche-à-oreille

## v0.6 — Ressources humaines et magasin

### Employés

- [ ] Compétences, expérience et progression
- [ ] Salaire, fatigue, motivation et formation
- [ ] Horaires, congés et maladie
- [ ] Priorités de tâches et affectation par zone
- [ ] Hiérarchie : employé, chef de rayon, manager, directeur
- [ ] Managers capables de distribuer automatiquement les tâches
- [ ] Variété des employés et profils selon le scénario (hotesse d'accueil, animateur en rayon, technicien de maintenance, caissier, préparateur de commandes, etc.)

### Maintenance

- [ ] État et usure des équipements
- [ ] Maintenance préventive et curative
- [ ] Risque de panne selon l’utilisation
- [ ] Priorisation des interventions
- [ ] Pannes du froid et pertes de stock

### Magasin et zones

- [ ] Entrée, réserve, parking (et ses équipements), quai, bureaux, sanitaires et salle de pause, drive
- [ ] Galeries marchandes, rayons, caisses et zones de circulation
- [ ] Agrandissement de la surface
- [ ] Arbitrage entre vente, stock, personnel et extension
- [ ] Rentabilité par mètre carré

### Ambiance et décoration

- [ ] Signalétique, plantes, musique, couleurs et éclairage
- [ ] Effets sur satisfaction, temps passé et image du magasin

## v0.7 — Progression et monde vivant

### Progression

- [ ] Objectifs courts et indicateurs de réussite
- [ ] Niveaux : épicerie, supérette, supermarché, hypermarché
- [ ] Déblocage de produits, fournisseurs et équipements
- [ ] Scénarios et contraintes de départ

### Calendrier et saisonnalité

- [ ] Week-ends, vacances, Noël, rentrée et soldes
- [ ] Tendances produits et saisonnalité
- [ ] Affluence variable selon le calendrier

### Météo et actualité

- [ ] Pluie, canicule et neige
- [ ] Grèves, pénuries et réglementation
- [ ] Hausse de l’énergie et événements exceptionnels

### Concurrence

- [ ] Magasins concurrents simulés
- [ ] Prix, promotions, assortiment et réputation concurrents
- [ ] Parts de marché et réaction du joueur
- [ ] Événements concurrentiels locaux

## Analytics et tableau de bord décisionnel

### KPI

- [ ] Chiffre d’affaires
- [ ] Marge brute et nette
- [ ] Rotation des stocks
- [ ] Taux de rupture
- [ ] Temps moyen en caisse
- [ ] Satisfaction globale et détaillée
- [ ] Occupation des employés
- [ ] Rentabilité par mètre carré

### Graphiques

- [ ] Évolution du CA et du nombre de clients
- [ ] Évolution des prix et marges
- [ ] Rotation et couverture des stocks
- [ ] Répartition des ventes
- [ ] Top produits et produits en difficulté

### Alertes intelligentes

- [ ] Détecter une rupture stratégique
- [ ] Quantifier les ventes perdues pour prix trop élevé
- [ ] Recommander une commande urgente
- [ ] Signaler une marge anormalement faible
- [ ] Expliquer les causes probables d’une baisse de performance

## Professionnalisation continue

- [x] Bus d’événements métier typé
- [x] Validation centralisée des catalogues
- [x] CI de typecheck et build
- [x] Documentation des décisions d’architecture
- [ ] Tests unitaires des managers
- [ ] Tests des règles économiques et comportements clients
- [ ] Tests de sauvegarde et migration
- [ ] Journal métier pour le diagnostic
- [ ] Simulation accélérée sans rendu
- [ ] Réduction progressive du rôle d’orchestrateur de `App.vue`
- [ ] Contrôle automatique des dépendances entre packages

## Ordre d’implémentation recommandé

1. terminer la migration vers les packages publics ;
2. stabiliser le profil client pendant toute une visite ;
3. relier prix et satisfaction finale ;
4. calculer le coût moyen pondéré ;
5. ajouter ventes et marges réelles aux analytics ;
6. persister l’historique analytique ;
7. introduire promotions et substitutions ;
8. extraire totalement Vue et Phaser dans `apps/game`.

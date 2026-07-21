# Roadmap Market Tycoon

Cette feuille de route organise l’évolution du prototype vers un véritable jeu de gestion. Chaque version doit rester jouable, testable et compatible avec les sauvegardes existantes.

## Principes directeurs

- Les systèmes métier sont isolés dans des managers dédiés.
- Les éléments extensibles sont déclarés dans des catalogues validés.
- Les interactions importantes émettent des événements métier typés.
- Les sauvegardes sont versionnées et migrables.
- Les composants Vue affichent et orchestrent, mais ne portent pas les règles métier.
- Phaser reste responsable de la scène, des agents et des animations.
- Toute nouvelle mécanique doit produire des indicateurs exploitables par le joueur.

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

## v0.4 — Intelligence commerciale

### 1. Sensibilité des clients aux prix

- [ ] Ajouter un prix de marché et une sensibilité au prix par produit
- [ ] Introduire des décisions d’achat : accepter, réduire, refuser ou substituer
- [ ] Faire varier la satisfaction selon l’écart au marché
- [ ] Comptabiliser les ventes perdues pour prix excessif
- [ ] Ajouter une élasticité configurable par profil client

### 2. Coût réel du stock

- [ ] Gérer la valeur du stock et le coût moyen pondéré
- [ ] Intégrer le prix fournisseur réellement payé
- [ ] Répartir les frais de livraison entre les lignes
- [ ] Calculer le coût des marchandises vendues
- [ ] Calculer la marge brute réelle par vente

### 3. Statistiques par produit

- [ ] Quantités vendues, chiffre d’affaires et marge brute
- [ ] Refus liés au prix et ruptures
- [ ] Rotation du stock et jours de couverture
- [ ] Historique journalier
- [ ] Tableau de performance produit

### 4. Promotions

- [ ] Promotions temporaires
- [ ] Prix barrés et durée
- [ ] Impact sur la demande
- [ ] Mesure de rentabilité de la promotion

## v0.5 — Clients et vie du magasin

### Profils clients

- [ ] Catalogue extensible de profils
- [ ] Budget, patience, sensibilité au prix et taille du panier
- [ ] Préférences de catégories
- [ ] Clients budget, réguliers, premium, familles et pressés

### Maintenance complète

- [ ] État et usure des équipements
- [ ] Risque de panne selon l’utilisation
- [ ] Maintenance préventive et curative
- [ ] Priorisation des interventions
- [ ] Pannes du froid avec risque de perte de stock

### Organisation du travail

- [ ] Horaires et équipes
- [ ] Affectation par zone ou catégorie
- [ ] Priorités de tâches
- [ ] Fatigue, moral et expérience
- [ ] Formation et progression des salariés

## v0.6 — Progression du magasin

- [ ] Objectifs courts et indicateurs de réussite
- [ ] Niveaux : épicerie, supérette, supermarché, hypermarché
- [ ] Déblocage de produits, fournisseurs et équipements
- [ ] Agrandissement de la surface
- [ ] Réserve, bureaux, parking et quai de livraison
- [ ] Arbitrage entre stock, personnel, équipement et extension

## v0.7 — Monde vivant

- [ ] Catalogue d’événements
- [ ] Tendances produits et saisonnalité
- [ ] Promotions fournisseurs
- [ ] Hausses de coûts et pénuries
- [ ] Affluence exceptionnelle
- [ ] Incidents techniques et administratifs
- [ ] Publicité et réputation

## Professionnalisation continue

- [ ] Bus d’événements métier typé
- [ ] Validation centralisée des catalogues
- [ ] Tests unitaires des managers
- [ ] Tests de sauvegarde et de migration
- [ ] Tests des règles économiques
- [ ] Tests des comportements clients
- [ ] CI de typecheck et build
- [ ] Journal métier pour le diagnostic
- [ ] Réduction progressive du rôle d’orchestrateur de `App.vue`
- [ ] Documentation des décisions d’architecture

## Prochain lot d’implémentation

Le prochain lot cible **v0.4 — Intelligence commerciale** dans cet ordre :

1. bus d’événements métier ;
2. modèle de demande et sensibilité au prix ;
3. coût moyen pondéré du stock ;
4. statistiques par produit ;
5. écran d’analyse commerciale ;
6. persistance et tests.

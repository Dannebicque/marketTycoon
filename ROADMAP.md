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

- [x] Ajouter un prix de marché et une sensibilité au prix par produit
- [x] Introduire des décisions d’achat : accepter, réduire ou refuser
- [x] Intégrer ces décisions dans le retrait réel du stock en rayon
- [x] Comptabiliser les quantités et le chiffre d’affaires potentiel perdus
- [x] Ajouter un écran de suivi commercial par produit et par période
- [x] Produire des diagnostics pour ajuster les tarifs
- [ ] Conserver une sensibilité stable pendant toute la visite d’un client
- [ ] Faire varier la satisfaction finale selon l’écart au marché
- [ ] Proposer un produit de substitution après un refus
- [ ] Ajouter une élasticité configurable par profil client

### 2. Coût réel du stock

- [ ] Gérer la valeur du stock et le coût moyen pondéré
- [ ] Intégrer le prix fournisseur réellement payé
- [ ] Répartir les frais de livraison entre les lignes
- [ ] Calculer le coût des marchandises vendues
- [ ] Calculer la marge brute réelle par vente

### 3. Statistiques par produit

- [x] Quantités demandées, acceptées et refusées
- [x] Conversion et chiffre d’affaires potentiel perdu
- [ ] Quantités vendues, chiffre d’affaires et marge brute
- [ ] Ruptures et demandes perdues
- [ ] Rotation du stock et jours de couverture
- [ ] Historique journalier consolidé
- [ ] Tableau de performance produit complet

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

- [x] Bus d’événements métier typé
- [x] Validation centralisée des catalogues
- [ ] Tests unitaires des managers
- [ ] Tests de sauvegarde et de migration
- [ ] Tests des règles économiques
- [ ] Tests des comportements clients
- [x] CI de typecheck et build
- [x] Conservation des diagnostics de CI sous forme d’artefacts
- [ ] Journal métier pour le diagnostic
- [ ] Réduction progressive du rôle d’orchestrateur de `App.vue`
- [x] Documentation des décisions d’architecture

## Prochain lot d’implémentation

Le prochain lot poursuit **v0.4 — Intelligence commerciale** dans cet ordre :

1. stabiliser la sensibilité et le budget pendant toute une visite client ;
2. relier les décisions de prix à la satisfaction finale ;
3. persister l’historique analytique dans la sauvegarde ;
4. calculer le coût moyen pondéré du stock ;
5. ajouter les ventes et marges réelles au tableau produit ;
6. introduire les substitutions et promotions.

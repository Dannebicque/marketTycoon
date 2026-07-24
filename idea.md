Je pense qu'on arrive à un moment intéressant du projet.

Jusqu'à présent, nous avons surtout construit les **fondations techniques** :

* catalogue modulaire,
* moteur de simulation,
* domaine `customers`,
* analytics,
* employés,
* sauvegarde,
* menus dynamiques.

Le jeu commence à être bien structuré. À partir de maintenant, chaque évolution va davantage enrichir le gameplay que l'architecture.

## Ma proposition de roadmap

Je la verrais dans cet ordre.

### 1. Construire un véritable moteur de progression ⭐⭐⭐⭐⭐

**=> Fait**

C'est, selon moi, la priorité.

Aujourd'hui, le joueur peut tout construire dès le premier jour.

Je mettrais en place un système de :

* niveaux du magasin ;
* technologies ;
* licences ;
* objectifs.

Par exemple :

```
Niveau 1
----------
✔ Rayons standards
✔ Caisse classique

Niveau 2
----------
✔ Réserve froide
✔ Fruits/Légumes

Niveau 3
----------
✔ Surgelés
✔ Promotions

Niveau 4
----------
✔ Caisse automatique

...
```

Techniquement :

```text
packages/progression
```

avec

```
ResearchTree
UnlockManager
StoreLevel
Objectives
Achievements
```

Tout le catalogue pourrait simplement déclarer :

```ts
unlock: {
    level: 3
}
```

ou

```ts
unlock: {
    research: 'cold-chain'
}
```

Le menu cacherait automatiquement les éléments verrouillés.

---

## 2. Améliorer le comportement des clients ⭐⭐⭐⭐⭐

Le domaine `customers` est maintenant suffisamment propre pour devenir beaucoup plus intelligent.

Aujourd'hui un client :

```
entre
↓
achète
↓
sort
```

Je voudrais arriver à :

```
entre

↓

cherche un produit

↓

ne le trouve pas

↓

demande un autre produit

↓

change d'avis

↓

compare les prix

↓

abandonne

↓

attend en caisse

↓

râle

↓

paie

↓

revient quelques jours plus tard
```

C'est là que le jeu deviendra vivant.

---

## 3. Introduire les besoins du magasin ⭐⭐⭐⭐☆

**=> Fait**

Aujourd'hui le magasin est "gratuit".

Il faudrait :

* électricité
* nettoyage
* maintenance
* usure
* pannes
* déchets
* pertes

Les techniciens auraient enfin un vrai rôle.

---

## 4. Marketing ⭐⭐⭐⭐☆

Ensuite :

* promotions
* prospectus
* publicité
* réputation
* fidélité

Les analytics que nous avons développés prendraient alors tout leur sens.

---

## 5. Entrepôt et logistique ⭐⭐⭐⭐☆

Aujourd'hui le réassort est très simplifié.

Je voudrais ensuite introduire :

* palettes,
* cartons,
* préparation,
* livraisons,
* employés qui déplacent réellement les marchandises.

---

## 6. Concurrence ⭐⭐⭐⭐☆

À ce moment-là, on peut imaginer :

```
Ville

├── Mon magasin
├── Carrefour
├── Lidl
├── Intermarché
```

avec :

* évolution des prix,
* réputation,
* transfert de clientèle,
* guerres de prix.

---

# Ce que je ferais tout de suite

Je ne commencerais **pas** encore par la progression.

Je pense qu'il manque une pièce centrale de l'architecture :

## Un vrai moteur d'événements

Aujourd'hui beaucoup de systèmes appellent directement d'autres systèmes.

Je créerais un package :

```
packages/events
```

avec des événements métier tels que :

```
CustomerEnteredStore
CustomerPickedProduct
CustomerAbandonedPurchase
CheckoutStarted
CheckoutCompleted

EmployeeHired
EmployeeAssigned

BuildingPlaced
BuildingRemoved

OrderDelivered

DayStarted
DayEnded
```

Ensuite :

* les analytics écouteraient ces événements ;
* les objectifs écouteraient ces événements ;
* les succès écouteraient ces événements ;
* le tutoriel écouterait ces événements ;
* la progression écouterait ces événements.

Chaque système deviendrait indépendant.

C'est une architecture très utilisée dans les jeux de gestion (event-driven) et elle permettra d'ajouter de nombreuses fonctionnalités sans créer de dépendances entre packages.

## Ma recommandation

Je proposerais donc les deux prochaines étapes dans cet ordre :

1. **Créer le package `events`**, qui deviendra la colonne vertébrale de toute la simulation.
2. **Construire le package `progression`** en s'appuyant sur ces événements.

Cela donnera une base extrêmement évolutive, où chaque nouveau système (missions, tutoriel, IA des clients, campagnes marketing, succès, statistiques avancées...) pourra se brancher simplement sur les événements existants, sans modifier le cœur de la simulation.

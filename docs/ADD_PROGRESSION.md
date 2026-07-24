Oui, mais `average-satisfaction` est un peu différent des critères actuels.

Les critères comme `revenue` ou `customers-served` sont **cumulatifs** :

```ts
revenue += vente
customersServed += 1
```

Une moyenne doit conserver au minimum :

```text
somme des satisfactions
nombre de clients concernés
```

Puis calculer :

```text
satisfaction moyenne = somme / nombre
```

Je te conseille de calculer la satisfaction moyenne à partir de chaque événement :

```ts
customer:visit-completed
```

Cet événement contient déjà la satisfaction finale du client. Il ne faut pas faire une moyenne des moyennes journalières, car elle serait fausse lorsque les journées n’ont pas le même nombre de clients.

## 1. Déclarer la nouvelle métrique

Dans :

```text
packages/progression/src/contracts.ts
```

Ajouter la métrique à `PROGRESSION_METRICS` :

```ts
export const PROGRESSION_METRICS = [
  'customers-entered',
  'customers-served',
  'customers-lost',
  'revenue',
  'buildings-placed',
  'employees-hired',
  'days-completed',
  'average-satisfaction',
] as const
```

Le type TypeScript sera automatiquement enrichi grâce à :

```ts
export type ProgressionMetric =
  typeof PROGRESSION_METRICS[number]
```

Le validateur JSON acceptera alors :

```json
"metric": "average-satisfaction"
```

## 2. Initialiser la métrique

Dans :

```text
packages/progression/src/ProgressionManager.ts
```

Ajouter la valeur initiale :

```ts
const EMPTY_METRICS: Record<ProgressionMetric, number> = {
  'customers-entered': 0,
  'customers-served': 0,
  'customers-lost': 0,
  revenue: 0,
  'buildings-placed': 0,
  'employees-hired': 0,
  'days-completed': 0,
  'average-satisfaction': 0,
}
```

## 3. Conserver les données nécessaires au calcul

Dans la classe `ProgressionManager`, ajouter deux compteurs :

```ts
private satisfactionTotal = 0
private satisfactionSamples = 0
```

Puis une méthode spécifique :

```ts
private registerSatisfaction(satisfaction: number) {
  const normalizedSatisfaction = Math.max(
    0,
    Math.min(100, satisfaction),
  )

  this.satisfactionTotal += normalizedSatisfaction
  this.satisfactionSamples += 1

  this.metrics['average-satisfaction'] =
    this.satisfactionTotal / this.satisfactionSamples

  this.recalculate()
}
```

La normalisation entre `0` et `100` évite qu’une valeur incorrecte pollue toute la progression.

## 4. Alimenter la métrique depuis les événements

Le listener actuel ressemble à ceci :

```ts
gameEvents.on('customer:visit-completed', event => {
  this.increment('customers-served', 1)
  this.increment('revenue', event.saleTotal)
})
```

Il devient :

```ts
gameEvents.on('customer:visit-completed', event => {
  this.increment('customers-served', 1)
  this.increment('revenue', event.saleTotal)
  this.registerSatisfaction(event.satisfaction)
})
```

À chaque client servi, le gestionnaire recalcule donc la moyenne cumulée.

Exemple :

```text
Client 1 : 80
Client 2 : 60
Client 3 : 100

Total : 240
Nombre : 3
Moyenne : 80
```

## 5. Sauvegarder les composants de la moyenne

C’est indispensable. Sauvegarder uniquement la moyenne ne permettrait pas de poursuivre correctement le calcul après rechargement.

Dans `ProgressionSnapshot`, ajouter :

```ts
export interface ProgressionSnapshot {
  configurationVersion: number
  level: number
  metrics: Record<ProgressionMetric, number>
  completedObjectiveKeys: string[]
  unlockedKeys: string[]

  aggregations?: {
    satisfactionTotal: number
    satisfactionSamples: number
  }
}
```

J’utilise `aggregations?` comme propriété optionnelle pour conserver la compatibilité avec les anciennes sauvegardes.

Dans `snapshot()` :

```ts
snapshot(): ProgressionSnapshot {
  return {
    configurationVersion: this.configuration.version,
    level: this.level,
    metrics: { ...this.metrics },
    completedObjectiveKeys: [...this.completedObjectiveKeys],
    unlockedKeys: [...this.unlockedKeys],

    aggregations: {
      satisfactionTotal: this.satisfactionTotal,
      satisfactionSamples: this.satisfactionSamples,
    },
  }
}
```

Dans `restore()` :

```ts
restore(snapshot: ProgressionSnapshot) {
  Object.assign(this.metrics, EMPTY_METRICS, snapshot.metrics)

  this.satisfactionTotal =
    snapshot.aggregations?.satisfactionTotal ?? 0

  this.satisfactionSamples =
    snapshot.aggregations?.satisfactionSamples ?? 0

  if (this.satisfactionSamples > 0) {
    this.metrics['average-satisfaction'] =
      this.satisfactionTotal / this.satisfactionSamples
  }

  this.completedObjectiveKeys.clear()

  snapshot.completedObjectiveKeys.forEach(key => {
    this.completedObjectiveKeys.add(key)
  })

  this.recalculate()
}
```

## 6. Utiliser le critère dans le JSON

Dans :

```text
apps/game/public/config/progression.json
```

Tu peux désormais déclarer :

```json
{
  "key": "maintain-customer-satisfaction",
  "title": "Clients satisfaits",
  "description": "Atteindre une satisfaction moyenne de 80 %.",
  "metric": "average-satisfaction",
  "target": 80,
  "level": 2
}
```

Puis référencer cet objectif dans le niveau suivant :

```json
{
  "level": 3,
  "title": "Supermarché reconnu",
  "description": "La clientèle apprécie durablement le magasin.",
  "requiredObjectiveKeys": [
    "maintain-customer-satisfaction"
  ],
  "unlockKeys": [
    "premium-products"
  ]
}
```

## Attention au comportement de cet objectif

Avec le système actuel, un objectif complété reste complété :

```ts
if (value >= target) {
  completedObjectiveKeys.add(objective.key)
}
```

Ainsi, si la moyenne atteint une fois `80`, l’objectif est définitivement validé, même si elle redescend ensuite à `75`.

Pour une progression de niveau, c’est généralement le comportement souhaité.

Il faut distinguer deux notions :

* **Objectif permanent** : « avoir atteint 80 % de satisfaction moyenne » ;
* **Condition active** : « maintenir actuellement au moins 80 % ».

Une condition active ne devrait pas utiliser `completedObjectiveKeys`. Elle devrait être réévaluée en permanence et pourrait redevenir fausse.

## Une évolution plus générique

Comme d’autres métriques non cumulatives arriveront probablement :

* satisfaction moyenne ;
* temps d’attente moyen ;
* bénéfice d’une journée ;
* taux de rupture ;
* pourcentage de clients perdus ;
* nombre maximal d’employés simultanés ;

je conseillerais ensuite de formaliser plusieurs stratégies d’agrégation :

```ts
type MetricAggregation =
  | 'sum'
  | 'count'
  | 'average'
  | 'latest'
  | 'maximum'
  | 'minimum'
```

Mais dans l’architecture actuelle, pour ajouter `average-satisfaction`, les six modifications ci-dessus sont suffisantes et propres.

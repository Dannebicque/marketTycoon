import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'frozen-storage',
  category: 'storage',
  name: 'Réserve surgelée',
  description: 'Zone négative dédiée aux produits surgelés.',
  width: 2,
  height: 2,
  price: 900,
  color: 0x38bdf8,
  renderer: 'frozen-storage',
  toolbar: { icon: '❄️', order: 80 },
  storageType: 'frozen',
  capacity: 200,
  electricityCostPerDay: 34,
})
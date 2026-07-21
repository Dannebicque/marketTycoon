import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'cold-storage',
  category: 'storage',
  name: 'Réserve froide',
  description: 'Zone réfrigérée pour conserver les produits frais.',
  width: 2,
  height: 2,
  price: 650,
  color: 0x22c55e,
  renderer: 'cold-storage',
  toolbar: { icon: '🧊', order: 70 },
  storageType: 'cold',
  capacity: 240,
  electricityCostPerDay: 22,
})
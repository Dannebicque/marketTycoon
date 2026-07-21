import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'refrigerated-shelf',
  category: 'shelf',
  name: 'Rayon réfrigéré',
  description: 'Meuble froid pour yaourts, fromages et produits frais.',
  width: 1,
  height: 3,
  price: 320,
  color: 0x22c55e,
  renderer: 'refrigerated-shelf',
  toolbar: { icon: '🧊', order: 30 },
  capacity: 30,
  allowedProductCategories: ['fresh'],
  refrigerated: true,
  electricityCostPerDay: 12,
  customerPickupTimeMs: 900,
})

import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'bakery-shelf', category: 'shelf', name: 'Boulangerie',
  description: 'Présentoir dédié au pain et aux produits de boulangerie.',
  width: 2, height: 1, price: 220, color: 0xc08457, renderer: 'bakery-shelf',
  toolbar: { icon: '🥖', order: 50 },
  capacity: 20, allowedProductCategories: ['bakery'], customerPickupTimeMs: 700,
})

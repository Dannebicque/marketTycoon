import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'fruit-shelf',
  category: 'shelf',
  name: 'Fruits et légumes',
  description: 'Présentoir ouvert pour produits frais non réfrigérés.',
  width: 2,
  height: 2,
  price: 180,
  color: 0x84cc16,
  renderer: 'fruit-shelf',
  toolbar: { icon: '🍎', order: 20 },
  layout: { columns: 4, levels: 2, compartmentType: 'fruit-bin' },
  allowedProductCategories: ['fruit', 'vegetable'],
  customerPickupTimeMs: 850,
})
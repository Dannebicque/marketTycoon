import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'standard-shelf',
  category: 'shelf',
  name: 'Rayon standard',
  description: 'Rayon polyvalent pour épicerie, boissons et hygiène.',
  width: 1,
  height: 3,
  price: 100,
  color: 0xb07a4f,
  renderer: 'standard-shelf',
  toolbar: { icon: '▥', order: 10 },
  capacity: 24,
  allowedProductCategories: ['grocery', 'drink', 'hygiene'],
  customerPickupTimeMs: 650,
})

import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'ambient-storage',
  category: 'storage',
  name: 'Étagère de réserve',
  description: 'Stockage ambiant pour l’épicerie, les boissons et l’hygiène.',
  width: 1,
  height: 2,
  price: 180,
  color: 0x64748b,
  renderer: 'ambient-storage',
  toolbar: { icon: '📦', order: 60 },
  storageType: 'ambient',
  capacity: 180,
})
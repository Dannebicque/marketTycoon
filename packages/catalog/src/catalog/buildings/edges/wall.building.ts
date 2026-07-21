import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'wall', category: 'wall', name: 'Mur',
  description: 'Délimite les allées et bloque les déplacements.',
  width: 1, height: 1, price: 20, color: 0xcbd5e1, renderer: 'wall',
  toolbar: { icon: '▤', order: 90 },
})

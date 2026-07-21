import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'door', category: 'door', name: 'Porte',
  description: 'Crée un passage dans un mur.',
  width: 1, height: 1, price: 150, color: 0x7c3aed, renderer: 'door',
  toolbar: { icon: '▯', order: 100 },
})

import { defineBuilding } from '../../../definitions'

export default defineBuilding({
  key: 'standard-checkout', category: 'checkout', name: 'Caisse classique',
  description: 'Caisse avec employé, rapide et compatible avec tous les paiements.',
  width: 1, height: 2, price: 300, color: 0x2563eb, renderer: 'standard-checkout',
  toolbar: { icon: '🛒', order: 60 },
  scanTimePerArticleMs: 500, baseCheckoutTimeMs: 1200,
  acceptedPayments: ['contactless', 'card', 'cash'], requiresEmployee: true,
})

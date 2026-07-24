import { defineEmployeeRole } from '../../employees/employeeTypes'

export default defineEmployeeRole({
  key: 'cashier',
  name: 'Caissier',
  description: 'Tient une caisse classique et accélère l’encaissement selon sa qualité.',
  icon: '🧾',
  baseDailySalary: 95,
  qualityRange: [45, 90],
  skills: ['checkout'],
  requiredUnlockKey: 'core-store',
  order: 10,
})

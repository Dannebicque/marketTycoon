import { defineEmployeeRole } from '../../employees/employeeTypes'

export default defineEmployeeRole({
  key: 'stocker',
  name: 'Employé de rayon',
  description: 'Transfère les produits de la réserve vers les rayons. Sa qualité augmente la vitesse de réassort.',
  icon: '📦',
  baseDailySalary: 88,
  qualityRange: [40, 88],
  skills: ['restocking'],
  requiredUnlockKey: 'core-store',
  order: 20,
})

import { defineEmployeeRole } from '../../employees/employeeTypes'

export default defineEmployeeRole({
  key: 'technician',
  name: 'Technicien',
  description: 'Réduit les risques de panne et accélère les réparations des équipements.',
  icon: '🛠️',
  baseDailySalary: 120,
  qualityRange: [50, 95],
  skills: ['maintenance'],
  order: 30,
})

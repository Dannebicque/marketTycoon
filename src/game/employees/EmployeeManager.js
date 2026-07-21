import { EMPLOYEE_ROLES, getEmployeeRole } from '@market-tycoon/catalog';
const FIRST_NAMES = ['Léa', 'Hugo', 'Emma', 'Lucas', 'Chloé', 'Nathan', 'Inès', 'Tom', 'Sarah', 'Noah'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy'];
export class EmployeeManager {
    employees = [];
    candidates = [];
    constructor() { this.refreshCandidates(1); }
    refreshCandidates(day) {
        this.candidates = EMPLOYEE_ROLES.flatMap(role => Array.from({ length: 2 }, () => this.generateCandidate(role.key, day)));
    }
    generateCandidate(roleKey, day) {
        const role = getEmployeeRole(roleKey);
        if (!role)
            throw new Error(`Rôle employé inconnu : ${roleKey}`);
        const quality = randomBetween(role.qualityRange[0], role.qualityRange[1]);
        const salary = Math.round(role.baseDailySalary * (.75 + quality / 200));
        return {
            id: crypto.randomUUID(),
            firstName: FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)],
            lastName: LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)],
            roleKey,
            quality,
            dailySalary: salary,
            status: 'available',
            completedTasks: 0,
            hiredDay: day,
        };
    }
    hire(candidateId, day) {
        const index = this.candidates.findIndex(item => item.id === candidateId);
        if (index < 0)
            return null;
        const [employee] = this.candidates.splice(index, 1);
        employee.hiredDay = day;
        employee.status = 'available';
        employee.completedTasks = 0;
        this.employees.push(employee);
        return { ...employee };
    }
    dismiss(employeeId) {
        const previous = this.employees.length;
        this.employees = this.employees.filter(item => item.id !== employeeId);
        return this.employees.length < previous;
    }
    assign(employeeId, buildingId) {
        const employee = this.employees.find(item => item.id === employeeId);
        if (!employee)
            return false;
        employee.assignedBuildingId = buildingId;
        employee.status = buildingId ? 'assigned' : 'available';
        employee.currentTask = undefined;
        return true;
    }
    setTask(employeeId, type, label, targetBuildingId) {
        const employee = this.employees.find(item => item.id === employeeId);
        if (!employee)
            return false;
        employee.status = type === 'idle' ? (employee.assignedBuildingId ? 'assigned' : 'available') : 'working';
        employee.currentTask = { type, label, targetBuildingId, startedAt: Date.now() };
        return true;
    }
    completeTask(employeeId) {
        const employee = this.employees.find(item => item.id === employeeId);
        if (!employee)
            return false;
        employee.completedTasks = (employee.completedTasks ?? 0) + 1;
        employee.status = employee.assignedBuildingId ? 'assigned' : 'available';
        employee.currentTask = undefined;
        return true;
    }
    getEmployee(employeeId) {
        const employee = this.employees.find(item => item.id === employeeId);
        return employee ? { ...employee, currentTask: employee.currentTask ? { ...employee.currentTask } : undefined } : undefined;
    }
    getEmployees() { return this.employees.map(item => ({ ...item, currentTask: item.currentTask ? { ...item.currentTask } : undefined })); }
    getCandidates() { return this.candidates.map(item => ({ ...item })); }
    getRoles() { return EMPLOYEE_ROLES; }
    getDailyPayroll() { return this.employees.reduce((total, item) => total + item.dailySalary, 0); }
    hasRole(roleKey) { return this.employees.some(item => item.roleKey === roleKey); }
    getAssignedTo(buildingId) { const employee = this.employees.find(item => item.assignedBuildingId === buildingId); return employee ? { ...employee } : undefined; }
    getAverageQuality(roleKey) {
        const matches = this.employees.filter(item => item.roleKey === roleKey);
        return matches.length ? matches.reduce((sum, item) => sum + item.quality, 0) / matches.length : 0;
    }
    exportState() { return { employees: this.getEmployees(), candidates: this.getCandidates() }; }
    importState(state) {
        this.employees = (state.employees ?? []).map(item => ({ ...item, currentTask: undefined, status: item.assignedBuildingId ? 'assigned' : 'available' }));
        this.candidates = (state.candidates ?? []).map(item => ({ ...item }));
    }
}
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

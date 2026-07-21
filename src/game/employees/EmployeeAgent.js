import Phaser from 'phaser';
const ROLE_COLORS = {
    cashier: 0x2563eb,
    stocker: 0x16a34a,
    technician: 0xf59e0b,
};
export class EmployeeAgent {
    scene;
    grid;
    employeeId;
    container;
    taskLabel;
    current;
    constructor(scene, grid, employeeId, employee, start) {
        this.scene = scene;
        this.grid = grid;
        this.employeeId = employeeId;
        this.current = start;
        const point = grid.gridToScreen(start.x, start.y);
        const color = ROLE_COLORS[employee.roleKey] ?? 0x8b5cf6;
        const shadow = scene.add.ellipse(0, 10, 22, 10, 0x000000, .25);
        const body = scene.add.circle(0, -2, 9, color);
        const head = scene.add.circle(0, -17, 6, 0xf5c2a8);
        const name = scene.add.text(0, -37, `${employee.firstName} ${employee.lastName[0]}.`, {
            fontSize: '9px', color: '#ffffff', backgroundColor: '#111827dd', padding: { x: 3, y: 1 },
        }).setOrigin(.5);
        this.taskLabel = scene.add.text(0, 18, 'Disponible', {
            fontSize: '8px', color: '#dbeafe', backgroundColor: '#172554dd', padding: { x: 3, y: 1 },
        }).setOrigin(.5, 0);
        this.container = scene.add.container(point.x, point.y + 10, [shadow, body, head, name, this.taskLabel]).setDepth(110);
    }
    get position() { return this.current; }
    setTask(label) { this.taskLabel.setText(label); }
    moveInstantly(cell) {
        this.current = cell;
        const point = this.grid.gridToScreen(cell.x, cell.y);
        this.container.setPosition(point.x, point.y + 10);
    }
    async follow(path, quality) {
        const duration = Phaser.Math.Clamp(360 - quality * 2.2, 130, 280);
        for (const cell of path.slice(1)) {
            if (this.grid.isMovementBlocked(this.current, cell) || !this.grid.isWalkable(cell.x, cell.y))
                throw new Error('employee-path-blocked');
            await this.moveTo(cell, duration);
            this.current = cell;
        }
    }
    destroy() { this.container.destroy(true); }
    moveTo(cell, duration) {
        const point = this.grid.gridToScreen(cell.x, cell.y);
        return new Promise(resolve => {
            this.scene.tweens.add({ targets: this.container, x: point.x, y: point.y + 10, duration, ease: 'Linear', onComplete: () => resolve() });
        });
    }
}

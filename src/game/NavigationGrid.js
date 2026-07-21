export class NavigationGrid {
    grid;
    constructor(grid) {
        this.grid = grid;
    }
    findPath(start, goal) {
        if (!this.grid.isWalkable(start.x, start.y) || !this.grid.isWalkable(goal.x, goal.y))
            return [];
        const open = new Map([[this.key(start), start]]);
        const cameFrom = new Map();
        const gScore = new Map([[this.key(start), 0]]);
        const fScore = new Map([[this.key(start), this.heuristic(start, goal)]]);
        while (open.size > 0) {
            const current = [...open.values()].sort((a, b) => (fScore.get(this.key(a)) ?? Infinity) - (fScore.get(this.key(b)) ?? Infinity))[0];
            if (current.x === goal.x && current.y === goal.y)
                return this.reconstruct(cameFrom, current);
            open.delete(this.key(current));
            for (const neighbour of this.grid.getWalkableNeighbours(current)) {
                const tentative = (gScore.get(this.key(current)) ?? Infinity) + 1;
                if (tentative >= (gScore.get(this.key(neighbour)) ?? Infinity))
                    continue;
                cameFrom.set(this.key(neighbour), current);
                gScore.set(this.key(neighbour), tentative);
                fScore.set(this.key(neighbour), tentative + this.heuristic(neighbour, goal));
                open.set(this.key(neighbour), neighbour);
            }
        }
        return [];
    }
    findPathToAny(start, goals) {
        const paths = goals.map(goal => this.findPath(start, goal)).filter(path => path.length > 0);
        return paths.sort((a, b) => a.length - b.length)[0] ?? [];
    }
    reconstruct(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.key(current))) {
            current = cameFrom.get(this.key(current));
            path.unshift(current);
        }
        return path;
    }
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    key(cell) {
        return `${cell.x}:${cell.y}`;
    }
}

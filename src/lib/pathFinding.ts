import { getDistance } from "./marketGrid";

function getAdjacentCorridors(grid: GridNode[][], pos: Position): Position[] {
	const directions = [
		{ x: 0, y: -1 }, // up
		{ x: 1, y: 0 }, // right
		{ x: 0, y: 1 }, // down
		{ x: -1, y: 0 }, // left
	];

	const corridors: Position[] = [];

	for (const dir of directions) {
		const x = pos.x + dir.x;
		const y = pos.y + dir.y;

		if (
			x >= 0 &&
			x < grid[0].length &&
			y >= 0 &&
			y < grid.length &&
			(grid[y][x].isCorridor || grid[y][x].isEntrance || grid[y][x].isCashier)
		) {
			corridors.push({ x, y });
		}
	}

	return corridors;
}

export function calculateRoutePoints(
	path: Section[],
	grid: GridNode[][],
	entrance: Position,
	cashier: Position,
): Position[] {
	// Quick exit if no sections to visit - direct path from entrance to cashier
	if (path.length === 0) {
		return generateSimplePath(grid, entrance, cashier);
	}

	// Start with entrance point
	const allPoints: Position[] = [entrance];

	// Convert section positions to grid coordinates
	const keyPoints: Position[] = path.map((section) => ({
		x: section.position.x * 2,
		y: section.position.y * 2,
	}));

	// For each section, find adjacent corridor points to visit
	const corridorPoints: Position[] = [];

	// First add entry point
	corridorPoints.push(entrance);

	// Then add an accessible corridor point for each section
	for (const point of keyPoints) {
		const nearestCorridors = getAdjacentCorridors(grid, point);
		if (nearestCorridors.length > 0) {
			// Find the corridor closest to the previous point to ensure continuous path
			const prevPoint = corridorPoints[corridorPoints.length - 1];
			let bestCorridor = nearestCorridors[0];
			let minDist = manhattanDistance(prevPoint, bestCorridor);

			for (let i = 1; i < nearestCorridors.length; i++) {
				const dist = manhattanDistance(prevPoint, nearestCorridors[i]);
				if (dist < minDist) {
					minDist = dist;
					bestCorridor = nearestCorridors[i];
				}
			}
			corridorPoints.push(bestCorridor);
		}
	}

	// Finally add exit point (cashier)
	corridorPoints.push(cashier);

	// For each pair of points, generate a simple path between them
	for (let i = 0; i < corridorPoints.length - 1; i++) {
		const current = corridorPoints[i];
		const next = corridorPoints[i + 1];

		// Skip if the points are the same
		if (current.x === next.x && current.y === next.y) continue;

		// Generate a simple path between these two points
		const pathSegment = generateSimplePath(grid, current, next);

		// Add to route (excluding the first point to avoid duplicates)
		if (pathSegment.length > 1) {
			for (let j = 1; j < pathSegment.length; j++) {
				allPoints.push(pathSegment[j]);
			}
		}
	}

	// Ensure the path doesn't have too many points that could cause rendering issues
	const MAX_TOTAL_POINTS = 100;
	if (allPoints.length > MAX_TOTAL_POINTS) {
		// Simplify the path by taking evenly spaced points
		const simplified: Position[] = [allPoints[0]];
		const step = Math.ceil(allPoints.length / MAX_TOTAL_POINTS);

		for (let i = step; i < allPoints.length - 1; i += step) {
			simplified.push(allPoints[i]);
		}

		// Always include the last point
		simplified.push(allPoints[allPoints.length - 1]);
		return simplified;
	}

	return allPoints;
}

export function calculateShortestPath(
	allSections: Section[],
	sectionsToVisit: Section[],
): Section[] {
	if (sectionsToVisit.length === 0) return [];

	if (sectionsToVisit.length === 1) return [...sectionsToVisit];

	// Start from the entrance: find the section closest to the entrance (0,0) in allSections
	const entrance = { x: 0, y: 0 };
	let startSectionIndex = 0;
	let minEntranceDist = Number.MAX_VALUE;
	for (let i = 0; i < sectionsToVisit.length; i++) {
		const dist = getDistance(entrance, sectionsToVisit[i].position);
		if (dist < minEntranceDist) {
			minEntranceDist = dist;
			startSectionIndex = i;
		}
	}

	const path: Section[] = [sectionsToVisit[startSectionIndex]];
	const remainingSections = sectionsToVisit.filter(
		(_, i) => i !== startSectionIndex,
	);

	while (remainingSections.length > 0) {
		const lastSection = path[path.length - 1];
		let closestSectionIndex = 0;
		let closestDistance = Number.MAX_VALUE;

		for (let i = 0; i < remainingSections.length; i++) {
			// Use allSections to get the actual section object if needed (for extensibility)
			const candidateId = remainingSections[i].id;
			const candidate =
				allSections.find((section) => section.id === candidateId) ||
				remainingSections[i];
			const distance = getDistance(lastSection.position, candidate.position);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestSectionIndex = i;
			}
		}

		const closestSection = remainingSections[closestSectionIndex];
		path.push(closestSection);
		remainingSections.splice(closestSectionIndex, 1);
	}

	return path;
}

function manhattanDistance(a: Position, b: Position): number {
	return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

function generateSimplePath(
	grid: GridNode[][],
	start: Position,
	end: Position,
): Position[] {
	// Use A* search algorithm for better path finding
	// It will find the shortest path considering corridor constraints

	// Define directions (up, right, down, left)
	const directions = [
		{ x: 0, y: -1 }, // up
		{ x: 1, y: 0 }, // right
		{ x: 0, y: 1 }, // down
		{ x: -1, y: 0 }, // left
	];

	// Create open and closed sets for A* search
	const openSet: {
		pos: Position;
		f: number; // total estimated cost
		g: number; // cost from start to this node
		h: number; // heuristic (estimated cost from this node to goal)
		parent: Position | null;
		direction: number | null; // Direction index from parent (-1 for no parent)
	}[] = [];

	const closedSet = new Set<string>();
	const gScores = new Map<string, number>();
	const cameFrom = new Map<string, Position | null>();
	const directionFrom = new Map<string, number>();

	// Add start position to open set
	const h = manhattanDistance(start, end);
	openSet.push({
		pos: start,
		f: h,
		g: 0,
		h,
		parent: null,
		direction: null,
	});
	gScores.set(`${start.x},${start.y}`, 0);

	// Main A* loop
	while (openSet.length > 0) {
		// Find the node with lowest f score
		openSet.sort((a, b) => a.f - b.f);
		const current = openSet.shift();
		if (!current) break; // Safety check

		const posKey = `${current.pos.x},${current.pos.y}`;

		// If we reached the goal
		if (current.pos.x === end.x && current.pos.y === end.y) {
			// Reconstruct the path
			const path: Position[] = [current.pos];
			let parentPos = current.parent;

			while (parentPos) {
				path.unshift(parentPos);
				const nextParent = cameFrom.get(`${parentPos.x},${parentPos.y}`);
				parentPos = nextParent || null;
			}

			return path;
		}

		// Add current to closed set
		closedSet.add(posKey);

		// Check all neighbors
		for (const dir of directions) {
			const neighbor: Position = {
				x: current.pos.x + dir.x,
				y: current.pos.y + dir.y,
			};

			const neighborKey = `${neighbor.x},${neighbor.y}`;

			// Skip if neighbor is already processed or not valid
			if (closedSet.has(neighborKey) || !isValidPosition(grid, neighbor)) {
				continue;
			}
			// Calculate scores
			// Calculate a slight preference for paths that continue in the same direction
			// Get the current direction (which direction we're coming from)
			let currentDir = -1;
			if (current.parent) {
				// Calculate what direction we came from
				const dx = current.pos.x - current.parent.x;
				const dy = current.pos.y - current.parent.y;

				if (dx === 1 && dy === 0)
					currentDir = 1; // right
				else if (dx === -1 && dy === 0)
					currentDir = 3; // left
				else if (dx === 0 && dy === 1)
					currentDir = 2; // down
				else if (dx === 0 && dy === -1) currentDir = 0; // up
			}

			// Calculate the new direction
			let newDir = -1;
			const dx = neighbor.x - current.pos.x;
			const dy = neighbor.y - current.pos.y;

			if (dx === 1 && dy === 0)
				newDir = 1; // right
			else if (dx === -1 && dy === 0)
				newDir = 3; // left
			else if (dx === 0 && dy === 1)
				newDir = 2; // down
			else if (dx === 0 && dy === -1) newDir = 0; // up

			// Slightly prefer movements that continue in the same direction
			// This avoids unnecessary zigzags in the path
			let moveCost = 1.0;
			if (currentDir === newDir && currentDir !== -1) {
				moveCost = 0.9; // Slight discount for continuing straight
			}

			const tentativeG = current.g + moveCost;
			const neighborH = manhattanDistance(neighbor, end);
			const neighborF = tentativeG + neighborH;

			// If neighbor is not in open set or we found a better path
			const existingG = gScores.get(neighborKey) ?? Number.POSITIVE_INFINITY;
			if (tentativeG < existingG) {
				// Update or add neighbor to open set
				gScores.set(neighborKey, tentativeG);
				cameFrom.set(neighborKey, current.pos);

				// If not in open set, add it
				const existingIndex = openSet.findIndex(
					(item) => item.pos.x === neighbor.x && item.pos.y === neighbor.y,
				);

				if (existingIndex === -1) {
					openSet.push({
						pos: neighbor,
						f: neighborF,
						g: tentativeG,
						h: neighborH,
						parent: current.pos,
						direction: newDir,
					});
				} else {
					// Update existing entry
					openSet[existingIndex] = {
						pos: neighbor,
						f: neighborF,
						g: tentativeG,
						h: neighborH,
						parent: current.pos,
						direction: newDir,
					};
				}
			}
		}
	}

	// If no path is found, return direct line as fallback
	return [start, end];
}

// Helper function - check if a position is valid (corridor, entrance, or cashier)
function isValidPosition(grid: GridNode[][], pos: Position): boolean {
	// Check if out of bounds
	if (
		pos.y < 0 ||
		pos.y >= grid.length ||
		pos.x < 0 ||
		pos.x >= grid[0].length
	) {
		return false;
	}

	// Check if this is a walkable tile
	const node = grid[pos.y][pos.x];
	return !!(node.isCorridor || node.isEntrance || node.isCashier);
}

// This function checks if a move is valid and if the position has not been visited before
function isValidMove(
	grid: GridNode[][],
	pos: Position,
	visited: Set<string>,
): boolean {
	// First check if the position is valid
	if (!isValidPosition(grid, pos)) {
		return false;
	}

	// Check if already visited
	if (visited.has(`${pos.x},${pos.y}`)) {
		return false;
	}

	return true;
}

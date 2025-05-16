export function createMarketGrid(sections: Section[]): {
	grid: GridNode[][];
	entrance: Position;
	cashier: Position;
} {
	if (!sections || sections.length === 0) {
		console.error("No sections provided to createMarketGrid");
		return {
			grid: [[{ x: 0, y: 0, isCorridor: true, isSection: false }]],
			entrance: { x: 0, y: 0 },
			cashier: { x: 0, y: 0 },
		};
	}

	console.log(
		"Sections received:",
		sections.map((s) => ({
			id: s.id,
			pos: s.position,
		})),
	);

	const maxX = Math.max(...sections.map((s) => s.position.x)) + 1;
	const maxY = Math.max(...sections.map((s) => s.position.y)) + 1;

	const gridWidth = maxX * 2 + 1;
	const gridHeight = maxY * 2 + 1;

	console.log(`Detected dimensions: ${maxX}x${maxY}`);
	console.log(`Grid dimensions: ${gridWidth}x${gridHeight}`);

	const grid: GridNode[][] = Array(gridHeight)
		.fill(null)
		.map((_, y) =>
			Array(gridWidth)
				.fill(null)
				.map((_, x) => ({
					x,
					y,
					isCorridor: true,
					isSection: false,
				})),
		);

	let sectionCount = 0;
	for (const section of sections) {
		const gridX = section.position.x * 2;
		const gridY = section.position.y * 2;

		if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
			grid[gridY][gridX] = {
				x: gridX,
				y: gridY,
				isCorridor: false,
				isSection: true,
				sectionId: section.id,
			};
			sectionCount++;
		} else {
			console.warn(
				`Section ${section.id} is outside grid boundaries: (${gridX},${gridY})`,
			);
		}
	}

	console.log(`Total sections placed on grid: ${sectionCount}`);
	const entranceX = Math.floor(gridWidth / 2);
	const entranceY = 0;

	grid[entranceY][entranceX] = {
		x: entranceX,
		y: entranceY,
		isCorridor: true,
		isSection: false,
		isEntrance: true,
	};

	const entrance: Position = { x: entranceX, y: entranceY };

	const cashierX = Math.floor(gridWidth / 2);
	const cashierY = gridHeight - 1;

	grid[cashierY][cashierX] = {
		x: cashierX,
		y: cashierY,
		isCorridor: true,
		isSection: false,
		isCashier: true,
	};

	const cashier: Position = { x: cashierX, y: cashierY };

	return { grid, entrance, cashier };
}

export function getDistance(
	pos1: { x: number; y: number },
	pos2: { x: number; y: number },
): number {
	return Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2);
}

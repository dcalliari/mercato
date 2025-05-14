interface Position {
	x: number;
	y: number;
}

interface Section {
	id: string;
	name: string;
	categories: string[];
	position: Position;
	neighbors: string[];
}

interface Market {
	id: number;
	name: string;
	distance: number;
	sections?: Section[];
}

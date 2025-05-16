"use client";

import { useState, useEffect } from "react";
import { getMarketById } from "@/services/marketService";
import { createMarketGrid } from "@/lib/marketGrid";
import { calculateRoutePoints, calculateShortestPath } from "@/lib/pathFinding";
import { findRelevantSections } from "@/lib/sectionUtils";

export function useMarketMap(items: string[], marketId: number) {
	const [path, setPath] = useState<Section[]>([]);
	const [routePoints, setRoutePoints] = useState<Position[]>([]);
	const [sectionsToVisit, setSectionsToVisit] = useState<Section[]>([]);
	const [market, setMarket] = useState<Market | null>(null);
	const [gridMap, setGridMap] = useState<GridNode[][]>([]);
	const [cashierPosition, setCashierPosition] = useState<Position | null>(null);
	const [entrancePosition, setEntrancePosition] = useState<Position | null>(
		null,
	);
	const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const fetchMarketData = async () => {
			console.log(`MarketMap received marketId: ${marketId}`);

			try {
				const data = await getMarketById(marketId);

				if (!data) {
					console.error(`Could not load data for market ID: ${marketId}`);
					return;
				}

				setMarket(data);

				const relevantSections = findRelevantSections(items, data.sections);
				setSectionsToVisit(relevantSections);

				const { grid, entrance, cashier } = createMarketGrid(data.sections);
				setGridMap(grid);
				setEntrancePosition(entrance);
				setCashierPosition(cashier);

				const shortestPath = calculateShortestPath(
					data.sections,
					relevantSections,
				);
				setPath(shortestPath);

				if (shortestPath.length > 0) {
					const routePoints = calculateRoutePoints(
						shortestPath,
						grid,
						entrance,
						cashier,
					);
					setRoutePoints(routePoints);
				}

				const maxX =
					Math.max(...(data.sections || []).map((s: Section) => s.position.x)) +
					1;
				const maxY =
					Math.max(...(data.sections || []).map((s: Section) => s.position.y)) +
					1;

				setGridDimensions({
					width: maxX * 2 + 1,
					height: maxY * 2 + 1,
				});
			} catch (error) {
				console.error("Error when fetching market data:", error);
			}
		};

		fetchMarketData();
	}, [items, marketId]);

	return {
		market,
		path,
		routePoints,
		sectionsToVisit,
		gridMap,
		cashierPosition,
		entrancePosition,
		gridDimensions,
	};
}

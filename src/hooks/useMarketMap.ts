"use client";

import { useState, useEffect } from "react";
import {
	getMarketById,
	categorizeItemsForMarket,
} from "@/services/marketService";
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
	const [isLoading, setIsLoading] = useState(true);
	const [categorizedItems, setCategorizedItems] = useState<
		Record<string, string[]>
	>({});
	const [uncategorizedItems, setUncategorizedItems] = useState<string[]>([]);

	useEffect(() => {
		const fetchMarketData = async () => {
			setIsLoading(true);
			console.log(`MarketMap received marketId: ${marketId}`);

			try {
				const data = await getMarketById(marketId);

				if (!data) {
					console.error(`Could not load data for market ID: ${marketId}`);
					setIsLoading(false);
					return;
				}

				setMarket(data);

				// Use AI categorization to analyze items
				const { categorized, uncategorized } = await categorizeItemsForMarket(
					items,
					marketId,
				);
				setCategorizedItems(categorized);
				setUncategorizedItems(uncategorized);

				// Get relevant sections based on the categorization
				let relevantSections: Section[] = [];

				// Add sections from the AI categorization
				for (const sectionId of Object.keys(categorized)) {
					const section = data.sections.find((s) => s.id === sectionId);
					if (section && !relevantSections.some((s) => s.id === section.id)) {
						relevantSections.push(section);
					}
				}

				// For any uncategorized items, fall back to the traditional method
				if (uncategorized.length > 0) {
					const traditionalSections = findRelevantSections(
						uncategorized,
						data.sections,
					);
					for (const section of traditionalSections) {
						if (!relevantSections.some((s) => s.id === section.id)) {
							relevantSections.push(section);
						}
					}
				}

				// If no sections were found, include all sections
				if (relevantSections.length === 0) {
					relevantSections = data.sections;
				}

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

				setIsLoading(false);
			} catch (error) {
				console.error("Error when fetching market data:", error);
				setIsLoading(false);
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
		isLoading,
		categorizedItems,
		uncategorizedItems,
	};
}

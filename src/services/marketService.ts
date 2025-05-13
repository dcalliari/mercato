import type { Market } from "@/components/MarketList";

export const mockMarkets: Market[] = [
	{ id: 1, name: "Capitão", distance: 0.5 },
	{ id: 2, name: "SuperBarato", distance: 1.2 },
	{ id: 3, name: "Taiwan", distance: 2.8 },
];

export function getMarkets(): Market[] {
	return mockMarkets;
}

export function getMarketById(id: number): Market | undefined {
	return mockMarkets.find((market) => market.id === id);
}

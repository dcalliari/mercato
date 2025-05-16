"use client";

import { ItemsInput } from "@/components/ItemsInput";
import { MarketList } from "@/components/MarketList";
import { MarketMap } from "@/components/MarketMap";
import { useHomePage } from "@/hooks/useHomePage";

export function HomePage() {
	const {
		step,
		items,
		selectedMarket,
		markets,
		handleSubmitItems,
		handleSelectMarket,
	} = useHomePage();

	return (
		<div className="min-h-screen flex items-center justify-center bg-white px-4">
			{step === "input" && <ItemsInput onSubmit={handleSubmitItems} />}

			{step === "markets" && (
				<MarketList markets={markets} onSelect={handleSelectMarket} />
			)}

			{step === "map" && selectedMarket && (
				<MarketMap items={items} marketId={selectedMarket} />
			)}
		</div>
	);
}

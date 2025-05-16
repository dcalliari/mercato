"use client";

import { getMarkets } from "@/services/marketService";
import { useState, useEffect } from "react";

export function useHomePage() {
	const [step, setStep] = useState<"input" | "markets" | "map">("input");
	const [items, setItems] = useState<string[]>([]);
	const [selectedMarket, setSelectedMarket] = useState<number | null>(null);
	const [markets, setMarkets] = useState<Market[]>([]);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	useEffect(() => {
		getMarkets().then((data) => setMarkets(data));
	}, []);

	const handleSubmitItems = (parsedItems: string[]) => {
		setIsProcessing(true);
		setItems(parsedItems);

		setStep("markets");
		setIsProcessing(false);
	};

	const handleSelectMarket = (id: number) => {
		setSelectedMarket(id);
		setStep("map");
	};

	return {
		step,
		items,
		selectedMarket,
		markets,
		isProcessing,
		handleSubmitItems,
		handleSelectMarket,
	};
}

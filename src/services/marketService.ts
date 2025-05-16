import { readData } from "../firebase/database";
import llmService from "./llmService";

export const getMarkets = async (): Promise<Market[]> => {
	try {
		const marketsData = await readData("markets");
		return marketsData;
	} catch (error) {
		console.error("Erro ao buscar mercados:", error);
		return [];
	}
};

export const getMarketById = async (id: number): Promise<Market | null> => {
	try {
		const market = await readData(`markets/${id - 1}`);

		if (!market) {
			console.warn(`Mercado com ID ${id} não encontrado.`);
			return null;
		}
		return market;
	} catch (error) {
		console.error(`Erro ao buscar mercado com ID ${id}:`, error);
		return null;
	}
};

/**
 * Categorizes a list of items based on available sections in a specific market.
 * Uses LLM to intelligently map items to the most appropriate sections.
 */
export const categorizeItemsForMarket = async (
	items: string[],
	marketId: number,
): Promise<{
	categorized: Record<string, string[]>;
	uncategorized: string[];
}> => {
	try {
		// Get the market data
		const market = await getMarketById(marketId);
		if (!market) {
			throw new Error(`Market with ID ${marketId} not found`);
		}

		// Use the LLM service to categorize items
		const categorization = await llmService.categorizeItems(
			items,
			market.sections,
		);

		// Group items by section ID for easier consumption
		const categorized: Record<string, string[]> = {};

		for (const item of categorization.categories) {
			const section = market.sections.find((s) => s.name === item.section);
			if (section) {
				if (!categorized[section.id]) {
					categorized[section.id] = [];
				}
				categorized[section.id].push(item.item);
			} else {
				// If section name doesn't match exactly, add to uncategorized
				categorization.uncategorized.push(item.item);
			}
		}

		return {
			categorized,
			uncategorized: categorization.uncategorized,
		};
	} catch (error) {
		console.error("Error categorizing items:", error);
		// Return all items as uncategorized in case of error
		return {
			categorized: {},
			uncategorized: items,
		};
	}
};

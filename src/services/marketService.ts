import { readData } from "../firebase/database";

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
		console.log(`Attempting to fetch market with ID: ${id}`);
		const market = await readData(`markets/${id - 1}`);
		console.log(`Result for market ${id}:`, market);

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

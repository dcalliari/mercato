import { readData } from "../firebase/database";

// Função para obter mercados
export const getMarkets = async (): Promise<Market[]> => {
	const marketsData = await readData("markets");
	return marketsData ? Object.values(marketsData) : [];
};

// Função para obter um mercado por ID
export const getMarketById = async (id: number): Promise<Market> => {
	return await readData(`markets/${id}`);
};

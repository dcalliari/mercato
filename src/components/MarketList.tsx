"use client";

import { motion } from "framer-motion";

interface MarketListProps {
	markets: Market[];
	onSelect: (id: number) => void;
}

export function MarketList({ markets, onSelect }: MarketListProps) {
	const validMarkets = Array.isArray(markets) ? markets : [];
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-md"
		>
			<h2 className="text-2xl font-medium mb-4 text-center">
				Escolha um mercado
			</h2>{" "}
			<div className="grid gap-4">
				{validMarkets
					.sort((a, b) => a.distance - b.distance)
					.map((market) => (
						<motion.div
							key={market.id}
							whileHover={{ scale: 1.03 }}
							className="p-4 rounded-2xl shadow-md border cursor-pointer hover:bg-gray-50"
							onClick={() => onSelect(market.id)}
						>
							<div className="text-xl font-semibold">{market.name}</div>
							<div className="text-sm text-gray-500">
								{market.distance.toFixed(1)} km de distância
							</div>
						</motion.div>
					))}
			</div>
		</motion.div>
	);
}

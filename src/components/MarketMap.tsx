"use client";

import { motion } from "framer-motion";

interface MarketMapProps {
	items: string[];
	marketId: number;
}

export function MarketMap({ items, marketId }: MarketMapProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-lg text-center"
		>
			<h2 className="text-2xl font-medium mb-4">Mapa do mercado</h2>
			<p className="text-gray-600 mb-2">
				Produtos: <strong>{items.join(", ")}</strong>
			</p>
			<div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
				<span>🛒 Mapa do mercado (grafo simplificado)</span>
			</div>
		</motion.div>
	);
}

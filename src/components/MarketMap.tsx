"use client";

import { getMarketById } from "@/services/marketService";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MarketMapProps {
	items: string[];
	marketId: number;
}

export function MarketMap({ items, marketId }: MarketMapProps) {
	const [path, setPath] = useState<Section[]>([]);
	const [sectionsToVisit, setSectionsToVisit] = useState<Section[]>([]);
	const [market, setMarket] = useState<Market | null>(null);

	useEffect(() => {
		getMarketById(marketId).then((data) => {
			setMarket(data);

			if (!data?.sections) return;

			// Encontrar as seções que contêm os itens da lista
			const relevantSections = findRelevantSections(items, data.sections);
			setSectionsToVisit(relevantSections);

			// Calcular o caminho mais curto para visitar todas as seções
			const shortestPath = calculateShortestPath(
				data.sections,
				relevantSections,
			);
			setPath(shortestPath);
		});
	}, [items, marketId]);

	// Não faz sentido continuar se não há market
	if (!market) {
		return <div>Mercado não encontrado</div>;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-lg"
		>
			<h2 className="text-2xl font-medium mb-4 text-center">
				Mapa de {market.name}
			</h2>
			<p className="text-gray-600 mb-2 text-center">
				Produtos: <strong>{items.join(", ")}</strong>
			</p>

			{/* Grid do mercado */}
			<div className="w-full bg-white p-4 rounded-xl border shadow-sm">
				<div
					className="grid gap-1 mb-4 relative"
					style={{
						gridTemplateColumns: `repeat(${Math.max(...(market.sections ?? []).map((s) => s.position.x))}, minmax(0, 1fr))`,
						gridTemplateRows: `repeat(${Math.max(...(market.sections ?? []).map((s) => s.position.y))}, minmax(0, 1fr))`,
					}}
				>
					{(market.sections ?? []).map((section) => {
						const isInPath = path.some((s) => s.id === section.id);
						const pathIndex = path.findIndex((s) => s.id === section.id);
						const isStart = path[0]?.id === section.id;
						const isEnd =
							path[path.length - 1]?.id === section.id && path.length > 1;
						return (
							<div
								key={section.id}
								style={{
									gridColumn: section.position.x,
									gridRow: section.position.y,
								}}
								className={`
            relative p-2 rounded-lg text-center text-xs border
            ${isInPath ? "bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400" : ""}
            ${isStart ? "ring-2 ring-green-500" : ""}
            ${isEnd ? "ring-2 ring-red-500" : ""}
          `}
							>
								<div className="font-medium">{section.name}</div>
								<div className="text-[10px] text-gray-500 mt-1">
									{section.categories.slice(0, 2).join(", ")}
									{section.categories.length > 2 ? "..." : ""}
								</div>
								{isInPath && (
									<div className="absolute top-1 left-1 bg-yellow-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
										{pathIndex + 1}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Legenda */}
				<div className="flex flex-wrap gap-20 text-xs mt-4 justify-center">
					<div className="flex items-center">
						<div className="w-3 h-3 bg-blue-100 border-blue-300 border-2 rounded mr-1">
							<span>Seções para visitar</span>
						</div>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-gray-50 border rounded mr-1">
							<span>Outras seções</span>
						</div>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-gray-50 ring-2 ring-green-500 rounded mr-1">
							<span>Início</span>
						</div>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-gray-50 ring-2 ring-red-500 rounded mr-1">
							<span>Fim</span>
						</div>
					</div>
				</div>

				{/* Informações do caminho */}
				<div className="mt-6 pt-4 border-t">
					<h3 className="font-medium text-lg mb-2">Rota recomendada:</h3>
					{path.length > 0 ? (
						<ol className="list-decimal pl-5">
							{path.map((section) => (
								<li key={section.id} className="mb-1">
									<strong>{section.name}</strong> -
									<span className="text-sm text-gray-600">
										{" "}
										{filterRelevantCategories(section, items).join(", ")}
									</span>
								</li>
							))}
						</ol>
					) : (
						<p className="text-gray-500">Calculando rota...</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}

// Função para encontrar seções relevantes baseadas nos itens da lista
function findRelevantSections(items: string[], sections: Section[]): Section[] {
	const relevantSections: Section[] = [];

	for (const item of items) {
		for (const section of sections) {
			// Verifica se alguma categoria contém o item
			if (
				section.categories.some(
					(cat) =>
						cat.toLowerCase().includes(item.toLowerCase()) ||
						item.toLowerCase().includes(cat.toLowerCase()),
				)
			) {
				if (!relevantSections.includes(section)) {
					relevantSections.push(section);
				}
				break;
			}
		}
	}

	return relevantSections;
}

// Função para calcular o caminho mais curto usando algoritmo de Dijkstra simplificado
function calculateShortestPath(
	allSections: Section[],
	sectionsToVisit: Section[],
): Section[] {
	if (sectionsToVisit.length === 0) return [];
	if (sectionsToVisit.length === 1) return [...sectionsToVisit];

	// Começar da entrada do mercado (consideramos A1)
	const startSection = allSections.find((s) => s.id === "A1") || allSections[0];

	// Algoritmo simplificado de caminho mais curto
	const path: Section[] = [startSection];
	let currentSection = startSection;
	const remainingSections = [...sectionsToVisit].filter(
		(s) => s.id !== startSection.id,
	);

	// Enquanto houver seções para visitar
	while (remainingSections.length > 0) {
		// Encontrar a próxima seção mais próxima
		let nextSection: Section | null = null;
		let shortestDistance = Number.POSITIVE_INFINITY;

		for (const section of remainingSections) {
			const distance = getDistance(currentSection.position, section.position);
			if (distance < shortestDistance) {
				shortestDistance = distance;
				nextSection = section;
			}
		}

		if (nextSection) {
			path.push(nextSection);
			currentSection = nextSection;

			// Remover a seção visitada da lista de pendentes
			const index = remainingSections.findIndex(
				(s) => s.id === nextSection?.id,
			);
			if (index !== -1) {
				remainingSections.splice(index, 1);
			}
		}
	}

	return path;
}

// Função para calcular a distância euclidiana entre duas posições
function getDistance(
	pos1: { x: number; y: number },
	pos2: { x: number; y: number },
): number {
	return Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2);
}

// Função para filtrar categorias relevantes para os itens da lista
function filterRelevantCategories(section: Section, items: string[]): string[] {
	return section.categories.filter((category) =>
		items.some(
			(item) =>
				category.toLowerCase().includes(item.toLowerCase()) ||
				item.toLowerCase().includes(category.toLowerCase()),
		),
	);
}

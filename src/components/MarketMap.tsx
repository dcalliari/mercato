"use client";

import { filterRelevantCategories } from "@/lib/categoryUtils";
import { useMarketMap } from "@/hooks/useMarketMap";
import { motion } from "framer-motion";

interface MarketMapProps {
	items: string[];
	marketId: number;
}

export function MarketMap({ items, marketId }: MarketMapProps) {
	const {
		market,
		path,
		routePoints,
		sectionsToVisit,
		gridMap,
		gridDimensions,
		isLoading,
		categorizedItems,
		uncategorizedItems,
	} = useMarketMap(items, marketId);

	const { width: gridWidth, height: gridHeight } = gridDimensions;

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[200px]">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4" />
				<p className="text-gray-500">
					Analisando itens e carregando mercado...
				</p>
			</div>
		);
	}

	if (!market) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[200px]">
				<p className="text-red-500">Não foi possível carregar o mercado.</p>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-lg"
		>
			{/* Título do mapa */}
			<h2 className="text-2xl font-medium mb-4 text-center">
				Mapa de {market.name}
			</h2>
			<p className="text-gray-600 mb-2 text-center">
				Produtos: <strong>{items.join(", ")}</strong>
			</p>
			{/* Grid do mercado */}
			<div className="w-full bg-white p-4 rounded-xl border shadow-sm">
				<div
					className="grid gap-[2px] mb-4 relative"
					style={{
						gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
						gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`,
						aspectRatio:
							gridWidth > 0 && gridHeight > 0 ? gridWidth / gridHeight : 1,
					}}
				>
					{/* Renderiza o grid com corredores */}
					{gridMap.flat().map((cell) => {
						if (cell.isEntrance) {
							return (
								<div
									key={`entrance-${cell.x}-${cell.y}`}
									style={{
										gridColumnStart: cell.x + 1,
										gridRowStart: cell.y + 1,
									}}
									className="bg-green-200 w-full h-full rounded-md flex items-center justify-center"
								>
									<span className="text-[8px] font-bold">ENTRADA</span>
								</div>
							);
						}
						if (cell.isCashier) {
							return (
								<div
									key={`cashier-${cell.x}-${cell.y}`}
									style={{
										gridColumnStart: cell.x + 1,
										gridRowStart: cell.y + 1,
									}}
									className="bg-red-200 w-full h-full rounded-md flex items-center justify-center"
								>
									<span className="text-[8px] font-bold">CAIXA</span>
								</div>
							);
						}
						if (!cell.isSection && cell.isCorridor) {
							// Check if this corridor is part of the path
							const isInPath = routePoints.some(
								(point) => point.x === cell.x && point.y === cell.y,
							);

							return (
								<div
									key={`corridor-${cell.x}-${cell.y}`}
									style={{
										gridColumnStart: cell.x + 1,
										gridRowStart: cell.y + 1,
									}}
									className="bg-gray-100 w-full h-full flex items-center justify-center relative"
								>
									{isInPath && (
										<div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
									)}
								</div>
							);
						}
						return null;
					})}{" "}
					{/* Renderiza as seções */}
					{(market.sections || []).map((section: Section) => {
						const isInPath = path.some((s) => s.id === section.id);
						const pathIndex = path.findIndex((s) => s.id === section.id);
						// Multiplica a posição por 2 para corresponder à grade criada em marketGrid.ts
						const gridX = section.position.x * 2;
						const gridY = section.position.y * 2;
						// Check if section has items from AI categorization
						const hasItems = categorizedItems[section.id]?.length > 0;

						return (
							<div
								key={section.id}
								style={{
									gridColumnStart: gridX + 1,
									gridRowStart: gridY + 1,
									gridColumnEnd: gridX + 2,
									gridRowEnd: gridY + 2,
								}}
								className={`
                  relative p-2 rounded-lg text-center text-xs border
                  ${hasItems ? "ring-2 ring-blue-400 bg-blue-100" : ""}
                `}
							>
								{" "}
								<div className="font-medium">{section.name}</div>
								<div className="text-[10px] text-gray-500 mt-1">
									{section.categories.slice(0, 2).join(", ")}
									{section.categories.length > 2 ? "..." : ""}
								</div>
							</div>
						);
					})}{" "}
					{/* Path route visualization removed and replaced with highlighted corridor cells */}
				</div>{" "}
				{/* Legend */}
				<div className="flex flex-wrap gap-4 text-xs mt-4 justify-center">
					<div className="flex items-center">
						<div className="w-3 h-3 bg-blue-100 border-blue-300 border rounded mr-1" />
						<span>Seções para visitar</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-amber-200 border border-amber-400 rounded mr-1" />
						<span>Caminho</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-gray-50 border rounded mr-1" />
						<span>Outras seções</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-gray-100 rounded mr-1" />
						<span>Corredores</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-green-200 rounded mr-1" />
						<span>Entrada</span>
					</div>
					<div className="flex items-center">
						<div className="w-3 h-3 bg-red-200 rounded mr-1" />
						<span>Caixa</span>
					</div>
				</div>{" "}
				{/* Path information */}
				<div className="mt-6 pt-4 border-t">
					<h3 className="font-medium text-lg mb-2">Rota recomendada:</h3>
					{path.length > 0 ? (
						<ol className="list-decimal pl-5">
							{path.map((section) => {
								const sectionItems = categorizedItems[section.id] || [];
								return (
									<li key={section.id} className="mb-2">
										<strong>{section.name}</strong>
										{sectionItems.length > 0 ? (
											<div className="text-sm text-gray-600 mt-1 ml-2">
												Itens: <strong>{sectionItems.join(", ")}</strong>
											</div>
										) : (
											<span className="text-sm text-gray-600">
												{" "}
												{filterRelevantCategories(section, items).join(", ")}
											</span>
										)}
									</li>
								);
							})}
						</ol>
					) : (
						<p className="text-gray-500">Calculando rota...</p>
					)}

					{uncategorizedItems.length > 0 && (
						<div className="mt-4 pt-2 border-t">
							<h3 className="font-medium text-sm text-orange-600 mb-1">
								Itens não categorizados:
							</h3>
							<p className="text-sm text-gray-600">
								{uncategorizedItems.join(", ")}
							</p>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

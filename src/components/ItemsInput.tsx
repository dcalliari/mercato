"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ItemsInputProps {
	onSubmit: (items: string[]) => void;
}

export function ItemsInput({ onSubmit }: ItemsInputProps) {
	const [inputValue, setInputValue] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSubmitItems = (value: string) => {
		if (value.trim() === "" || isProcessing) return;

		setIsProcessing(true);
		const parsed = value
			.toLowerCase()
			.split(" ")
			.filter((v) => v.trim() !== "");

		setInputValue("");
		onSubmit(parsed);

		setTimeout(() => setIsProcessing(false), 500);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			className="text-center max-w-md w-full"
		>
			<h1 className="text-3xl font-semibold mb-4">
				O que você vai comprar hoje?
			</h1>
			<div className="relative">
				<input
					type="text"
					placeholder="arroz leite sabão tomate..."
					className="w-full border p-3 rounded-xl text-lg shadow"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSubmitItems(e.currentTarget.value);
					}}
					disabled={isProcessing}
				/>
				{isProcessing && (
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
						<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
					</div>
				)}
			</div>
			<p className="text-sm text-gray-500 mt-2">
				Pressione Enter para continuar
			</p>
		</motion.div>
	);
}
